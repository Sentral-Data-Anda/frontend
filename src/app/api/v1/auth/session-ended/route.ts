import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api/cookie";

// Cookie yang ditolak server tidak bisa dihapus dari server component. Tanpa
// ini /login mengira pemakai masih masuk dan melempar balik, tanpa henti.
//
// Tujuannya relatif, bukan `new URL("/login", request.url)`: `request.url` di
// route handler memakai alamat internal server, bukan alamat yang dipakai
// browser. Saat server berjalan di 0.0.0.0 atau di belakang proxy, alamat
// internal itu ikut terkirim, dan browser berpindah ke host yang tidak bisa
// dibuka. Location relatif menahan browser di origin-nya sendiri.
export function GET(): Response {
  const response = new NextResponse(null, {
    status: 307,
    headers: { location: "/login" },
  });

  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}
