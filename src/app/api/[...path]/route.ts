import type { NextRequest } from "next/server";

import { pickSessionCookies, stripCookieDomain } from "@/lib/api/cookie";
import { env } from "@/lib/env";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  // fetch sudah mendekompresi badan tapi tetap membawa header ini.
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

const FINGERPRINT_RESPONSE_HEADERS = new Set(["server", "x-powered-by"]);

const FORWARDED_REQUEST_HEADERS = [
  "cookie",
  "content-type",
  "authorization",
  "accept",
  "accept-language",
  "user-agent",
];

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const onBuildForwardHeaders = (request: NextRequest): Headers => {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value !== null) {
      headers.set(name, name === "cookie" ? pickSessionCookies(value) : value);
    }
  }

  return headers;
};

const onHandle = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> => {
  const { path } = await context.params;

  // Next sudah men-decode tiap segmen, jadi `..%2f` tiba sebagai "../".
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

  const base = new URL(`${env.API_BASE_URL}/`);
  const target = new URL(path.map(encodeURIComponent).join("/"), base);

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
      ...(isBodyAllowed ? { duplex: "half" } : {}),
      redirect: "manual",
      // Kunci Data Cache Next adalah URL, bukan user.
      cache: "no-store",
    } as RequestInit & { duplex?: "half" });
  } catch {
    return Response.json(
      {
        status: 502,
        error: "Layanan sedang tidak dapat dihubungi. Coba lagi sebentar lagi.",
      },
      { status: 502 },
    );
  }

  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();

    if (
      !HOP_BY_HOP_HEADERS.has(name) &&
      !FINGERPRINT_RESPONSE_HEADERS.has(name)
    ) {
      headers.set(key, value);
    }
  });

  // `.set()` di atas hanya menyisakan Set-Cookie terakhir.
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
