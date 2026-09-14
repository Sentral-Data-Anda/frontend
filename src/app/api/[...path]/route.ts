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
 * Header yang tidak boleh direlai dari respons upstream.
 *
 * Sebagian hop-by-hop sejati — hanya bermakna untuk satu lompatan koneksi,
 * dan `content-length` yang tidak lagi cocok setelah badan di-stream ulang
 * adalah yang paling sering menggigit.
 *
 * `content-encoding` masuk di sini karena alasan yang berbeda dan lebih
 * mematikan: `fetch` MENDEKOMPRESI badan upstream tapi MEMPERTAHANKAN
 * `content-encoding: gzip` di `response.headers`. Kalau ikut direlai, browser
 * menerima klaim gzip di atas JSON polos dan setiap panggilan API mati dengan
 * `ERR_CONTENT_DECODING_FAILED`. Hari ini laten karena be-sada belum memasang
 * kompresi — hidup pada hari pertama ada yang menaruh nginx atau Cloudflare
 * di depannya.
 */
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
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

/**
 * Header respons yang menggambarkan penempatan be-sada. Tidak merusak apa
 * pun, tapi tidak ada gunanya diberitahukan ke browser: ia menyebutkan
 * runtime dan versi yang dipakai backend, dan itu memperpendek pekerjaan
 * penyerang yang sedang mencari CVE yang cocok.
 */
const FINGERPRINT_RESPONSE_HEADERS = new Set(["server", "x-powered-by"]);

/**
 * Header permintaan yang boleh sampai ke be-sada. DAFTAR-PUTIH, dan itu
 * disengaja.
 *
 * Sebelumnya berupa daftar-hitam (teruskan semua kecuali hop-by-hop). Cacat
 * daftar-hitam bukan teoretis: yang lolos kemarin adalah `x-forwarded-for`,
 * `x-real-ip`, dan `forwarded` — apa adanya dari browser. be-sada memasang
 * `middleware.set("trust proxy", 1)`, jadi `req.ip` diambil dari header itu,
 * dan `authIpLimiter` yang menjaga `POST /auth/login` serta
 * `GET /auth/refresh-token` menyusun kuncinya dari `req.ip`. Penyerang cukup
 * merotasi satu header tiap permintaan dan pertahanan password-spraying itu
 * hilang seluruhnya. `x-nonce` juga ikut bocor — itu nonce CSP internal kita,
 * yang tidak punya urusan apa pun di luar proses ini.
 *
 * Daftar-hitam berarti setiap header baru yang ditemukan penyerang lolos
 * sampai ada orang yang ingat menambahkannya ke daftar. Daftar-putih membalik
 * bebannya: yang baru ditolak sampai ada yang sengaja mengizinkannya.
 *
 * MENAMBAH KE DAFTAR INI: hanya bila be-sada benar-benar membacanya, dan
 * sertakan komentar yang menyebut di mana ia dibaca. "Mungkin dipakai" bukan
 * alasan.
 */
const FORWARDED_REQUEST_HEADERS = [
  "cookie",
  "content-type",
  "authorization",
  "accept",
  "accept-language",
  "user-agent",
];

/** Method yang boleh membawa badan; sisanya `request.body` selalu null. */
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const onBuildForwardHeaders = (request: NextRequest): Headers => {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

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

  let upstream: Response;

  try {
    upstream = await fetch(target, {
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
  } catch {
    // be-sada tidak terjangkau — persis penanganan yang sudah dipakai
    // `src/features/auth/refresh.ts` untuk kegagalan yang sama. Tanpa ini,
    // fetch yang melempar keluar sebagai galat tak tertangani: Next membalas
    // 500 dengan badan KOSONG plus stack trace penuh di log server, dan
    // `readErrorMessage` di fetcher tidak punya apa pun untuk dibaca.
    //
    // Amplopnya dibuat sama seperti amplop galat be-sada (`status` + `error`)
    // supaya pemanggil tidak perlu tahu apakah galatnya datang dari backend
    // atau dari lapisan ini.
    return Response.json(
      {
        status: 502,
        error: "Layanan sedang tidak dapat dihubungi. Coba lagi sebentar lagi.",
      },
      { status: 502 },
    );
  }

  const headers = new Headers();

  // Arah respons memakai daftar-hitam, dan itu bukan inkonsistensi dengan
  // daftar-putih di arah request: yang menulis header di sini adalah be-sada
  // sendiri, bukan penyerang. Yang perlu dibuang hanyalah header yang RUSAK
  // bila direlai (`content-length`, `content-encoding`, transfer-encoding)
  // atau yang membocorkan penempatan backend — sisanya justru harus sampai
  // apa adanya, termasuk header baru yang belum ada saat baris ini ditulis.
  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();

    if (
      !HOP_BY_HOP_HEADERS.has(name) &&
      !FINGERPRINT_RESPONSE_HEADERS.has(name)
    ) {
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
