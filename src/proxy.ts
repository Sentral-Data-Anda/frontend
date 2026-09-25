import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/features/auth/refresh";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api/cookie";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security/csp";

const LOGOUT_PATH = "/api/v1/auth/logout";

const PUBLIC_PATHS = new Set([
  "/login",
  "/authentication",
  ...(process.env.NODE_ENV === "development" ? ["/dev/preview"] : []),
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRequest = pathname === "/api" || pathname.startsWith("/api/");

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    if (isApiRequest || PUBLIC_PATHS.has(pathname)) {
      return onContinue(request, { isApiRequest });
    }

    const target = `${pathname}${request.nextUrl.search}`;

    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(target)}`, request.url),
    );
  }

  let cookieHeader: string | undefined;
  let setCookie: string[] | undefined;

  if (!accessToken && refreshToken && pathname !== LOGOUT_PATH) {
    const refreshed = await refreshSession(
      request.headers.get("cookie") ?? "",
      refreshToken,
    );

    if (!refreshed) {
      const response = isApiRequest
        ? NextResponse.json(
            { status: 401, error: "Sesi Anda telah berakhir." },
            { status: 401 },
          )
        : NextResponse.redirect(new URL("/login", request.url));

      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);

      return response;
    }

    cookieHeader = refreshed.cookieHeader;
    setCookie = refreshed.setCookie;
  }

  if (pathname === "/login") {
    const url = new URL("/authentication", request.url);
    const redirect = request.nextUrl.searchParams.get("redirect");

    if (redirect) url.searchParams.set("redirect", redirect);

    const response = NextResponse.redirect(url);

    for (const cookie of setCookie ?? []) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  }

  return onContinue(request, { isApiRequest, cookieHeader, setCookie });
}

const onContinue = (
  request: NextRequest,
  options: {
    isApiRequest: boolean;
    cookieHeader?: string;
    setCookie?: string[];
  },
) => {
  const requestHeaders = new Headers(request.headers);

  if (options.cookieHeader) {
    requestHeaders.set("cookie", options.cookieHeader);
  }

  let csp: string | null = null;

  if (!options.isApiRequest) {
    const nonce = generateNonce();

    csp = buildContentSecurityPolicy({
      nonce,
      isDev: process.env.NODE_ENV === "development",
    });

    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (csp) response.headers.set("Content-Security-Policy", csp);

  for (const cookie of options.setCookie ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
};

export const config = {
  matcher: [
    // Aset yang dialihkan ke /login dijawab HTML dan gagal diam-diam.
    {
      source:
        "/((?!(?:api|_next/static|_next/image|manifest\\.webmanifest|sw\\.js|icons|brand|apple-icon\\.png|icon\\.png|favicon\\.ico|offline|robots\\.txt)(?:/|$)).*)",
    },
    {
      source: "/api/:path*",
    },
  ],
};
