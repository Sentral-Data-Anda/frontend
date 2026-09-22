import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api/cookie";
import { env } from "@/lib/env";

/**
 * Logout. Segmen statis, jadi menang atas catch-all `[...path]`.
 *
 * be-sada mencabut sesi ini dan mengirim Set-Cookie pembersih, tapi yang itu
 * membawa `Domain` be-sada dan diabaikan browser (lihat `proxy.ts`). Jadi
 * cookie dihapus DI SINI, apa pun hasil be-sada — 200, 401 (access sudah
 * kedaluwarsa), 5xx, atau tak terjangkau. User yang menekan "Keluar" harus
 * keluar dari perangkat ini walau pencabutan di server gagal.
 */
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const upstream = await fetch(`${env.API_BASE_URL}/v1/auth/logout`, {
      method: "DELETE",
      headers: { cookie: request.headers.get("cookie") ?? "" },
      redirect: "manual",
      cache: "no-store",
      // be-sada yang menggantung tidak boleh menahan tombol Keluar.
      signal: AbortSignal.timeout(5_000),
    });

    await upstream.body?.cancel();
  } catch {
    // Tak terjangkau atau timeout: tetap hapus cookie di bawah.
  }

  const response = new NextResponse(null, { status: 204 });

  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}
