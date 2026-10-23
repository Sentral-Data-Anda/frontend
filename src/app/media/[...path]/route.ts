import { NextResponse, type NextRequest } from "next/server";

import { toMediaTarget } from "@/lib/api/media";

const FORWARDED_REQUEST_HEADERS = [
  "range",
  "if-none-match",
  "if-modified-since",
];

const PASSED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

const PASSED_STATUSES = new Set([200, 206, 304, 403, 404, 416]);

const NOT_FOUND = { status: 404, error: "Berkas tidak ditemukan" };

const forwardToStorage = async (request: NextRequest): Promise<Response> => {
  const target = toMediaTarget(
    new URL(request.url),
    process.env.MEDIA_UPSTREAM_URL,
  );

  if (!target) return NextResponse.json(NOT_FOUND, { status: 404 });

  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value !== null) headers.set(name, value);
  }

  let upstream: Response;

  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return NextResponse.json(
      { status: 502, error: "Penyimpanan berkas tidak dapat dihubungi" },
      { status: 502 },
    );
  }

  if (!PASSED_STATUSES.has(upstream.status)) {
    await upstream.body?.cancel().catch(() => {});

    return NextResponse.json(
      { status: 502, error: "Penyimpanan berkas tidak dapat dihubungi" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();

  for (const name of PASSED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);

    if (value !== null) responseHeaders.set(name, value);
  }

  // Tautan bertanda tangan sudah unik per terbit; cache privat cukup.
  responseHeaders.set(
    "cache-control",
    upstream.status === 200 || upstream.status === 206
      ? "private, max-age=300"
      : "private, no-store",
  );

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export const GET = forwardToStorage;
export const HEAD = forwardToStorage;
