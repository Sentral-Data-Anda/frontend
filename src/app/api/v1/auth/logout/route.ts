import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  pickSessionCookies,
} from "@/lib/api/cookie";
import { env } from "@/lib/env";

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const upstream = await fetch(`${env.API_BASE_URL}/v1/auth/logout`, {
      method: "DELETE",
      headers: {
        cookie: pickSessionCookies(request.headers.get("cookie") ?? ""),
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    await upstream.body?.cancel();
  } catch {
    // be-sada tak terjangkau: cookie tetap dihapus di bawah.
  }

  const response = new NextResponse(null, { status: 204 });

  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}
