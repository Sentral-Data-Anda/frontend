import type { NextRequest } from "next/server";

import { stripCookieDomain } from "@/lib/api/cookie";
import { env } from "@/lib/env";

/**
 * BFF — satu-satunya jalan browser menuju be-sada.
 *
 * Alasannya cookie, bukan kerapian. be-sada menaruh sesi di cookie `httpOnly`
 * bertanda tangan, dan cookie terikat pada origin yang menerbitkannya. Kalau
 * browser menembak be-sada langsung, cookie hanya ikut bila be-sada memasang
 * CORS berkredensial dan menandai cookienya `SameSite=None; Secure` — dan
 * cookie lintas-situs seperti itu diblokir makin agresif oleh Safari/iOS,
 * tepat pada perangkat yang paling banyak memakai aplikasi ini.
 *
 * Dengan diteruskan dari sini, cookie terbit dari origin yang sama seperti
 * halamannya. `SameSite=Strict` bawaan be-sada justru jadi benar, CORS tidak
 * diperlukan, dan be-sada tidak perlu diubah sedikit pun.
 *
 * Rute `/api/observability` yang sudah ada tidak tertutup catch-all ini:
 * segmen statis menang atas catch-all di Next.
 */

/**
 * Header yang hanya bermakna untuk satu lompatan koneksi. Meneruskannya
 * membuat respons rusak — `content-length` yang tidak lagi cocok setelah
 * badan di-stream ulang adalah yang paling sering menggigit.
 */
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/** Method yang boleh membawa badan; sisanya `request.body` selalu null. */
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const onBuildForwardHeaders = (request: NextRequest): Headers => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
};

const onHandle = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> => {
  const { path } = await context.params;

  // Router Next tidak meloloskan ".." sebagai segmen TERSENDIRI, tapi Next
  // men-SPLIT lalu men-DECODE tiap segmen catch-all sebelum kita menerimanya
  // — jadi `/api/v1/..%2f..%2fadmin` tiba di sini sebagai SATU elemen array
  // `"../../admin"`, bukan tiga elemen `".."`. Segmen itu tidak sama persis
  // dengan "..", tapi begitu di-split lagi dengan "/" ia berisi "..". Maka
  // tiap segmen di-split dulu sebelum dibandingkan, supaya dot-segment yang
  // "disembunyikan" lewat decode Next tetap tertangkap sebelum sempat
  // digabung jadi satu URL.
  if (
    path.some((segment) =>
      segment.split("/").some((part) => part === "." || part === ".."),
    )
  ) {
    return Response.json(
      { status: 400, error: "Path tidak valid" },
      { status: 400 },
    );
  }

  // Jaring pengaman kedua, independen dari guard di atas: tiap segmen
  // di-encode ulang (encodeURIComponent) supaya tidak bisa ditafsirkan
  // sebagai sintaks path sama sekali (parameter be-sada yang wajar, mis.
  // "A-0184", tidak berubah oleh encoding ini), lalu hasil akhirnya tetap
  // divalidasi terhadap prefix `base` sebelum dipakai — supaya trik encoding
  // lain yang belum terpikirkan sekarang, di luar dot-segment yang sudah
  // ditangkap guard di atas, tetap tertutup.
  const base = new URL(`${env.API_BASE_URL}/`);
  const target = new URL(path.map(encodeURIComponent).join("/"), base);

  // `request.nextUrl` hanya ada pada instance NextRequest sungguhan; diambil
  // lewat `new URL(...)` supaya berlaku sama untuk NextRequest produksi
  // maupun Request polos yang dipakai test.
  target.search = new URL(request.url).search;

  if (!target.href.startsWith(base.href)) {
    return Response.json(
      { status: 400, error: "Path tidak valid" },
      { status: 400 },
    );
  }

  const isBodyAllowed =
    METHODS_WITH_BODY.has(request.method) && request.body !== null;

  const upstream = await fetch(target, {
    method: request.method,
    headers: onBuildForwardHeaders(request),
    body: isBodyAllowed ? request.body : undefined,
    // Wajib ketika badan berupa stream; tanpa ini fetch menolak dengan
    // "RequestInit: duplex option is required when sending a body".
    ...(isBodyAllowed ? { duplex: "half" } : {}),
    // Pengalihan diteruskan ke browser, tidak diikuti di sini — mengikutinya
    // berarti cookie untuk host lain ikut terkirim.
    redirect: "manual",
    // Respons terautentikasi tidak boleh masuk Data Cache Next. Kuncinya URL,
    // bukan user, sehingga data satu user akan tersaji ke user lain.
    cache: "no-store",
  } as RequestInit & { duplex?: "half" });

  const headers = new Headers();

  // Header respons dari upstream disaring dengan daftar hop-by-hop yang
  // sama seperti arah request — `content-length` dan `transfer-encoding`
  // upstream tidak lagi cocok dengan badan yang di-stream ulang lewat
  // Response ini, persis kelas kegagalan yang dijaga di onBuildForwardHeaders.
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Loop di atas memanggil `.set()`, yang menimpa nilai lama tiap dipanggil
  // dengan nama header yang sama — kalau upstream mengirim lebih dari satu
  // Set-Cookie, hanya yang terakhir yang tersisa. Dibuang di sini lalu
  // dipasang ulang satu per satu lewat getSetCookie(), yang mengembalikan
  // tiap Set-Cookie sebagai entri terpisah, bukan digabung.
  headers.delete("set-cookie");

  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", stripCookieDomain(cookie));
  }

  return new Response(upstream.body, { status: upstream.status, headers });
};

export const GET = onHandle;
export const POST = onHandle;
export const PUT = onHandle;
export const PATCH = onHandle;
export const DELETE = onHandle;
