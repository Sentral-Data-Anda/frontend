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

  // Router Next tidak meloloskan ".." sebagai segmen, tapi penjaga ini tidak
  // boleh bergantung pada perilaku itu: yang dijaga adalah kemampuan
  // menembak host be-sada di luar prefix yang dimaksud.
  if (path.some((segment) => segment === "." || segment === "..")) {
    return Response.json(
      { status: 400, error: "Path tidak valid" },
      { status: 400 },
    );
  }

  // `request.nextUrl` hanya ada pada instance NextRequest sungguhan; diambil
  // lewat `new URL(...)` supaya berlaku sama untuk NextRequest produksi
  // maupun Request polos yang dipakai test.
  const target = `${env.API_BASE_URL}/${path.join("/")}${new URL(request.url).search}`;

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

  const headers = new Headers(upstream.headers);

  // `new Headers(...)` menggabungkan beberapa Set-Cookie jadi satu string
  // berkoma, yang bukan header yang sah. Jadi dibuang lalu dipasang ulang
  // satu per satu lewat getSetCookie().
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
