import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api/cookie";

// Cookie yang ditolak server tidak bisa dihapus dari server component. Tanpa
// ini /login mengira pemakai masih masuk dan melempar balik, tanpa henti.
export function GET(request: NextRequest): Response {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}
