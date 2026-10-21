import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { clientContextOf, refreshSession } from "@/features/auth/refresh";
import {
  ACCESS_COOKIE,
  pickSessionCookies,
  readCookie,
  REFRESH_COOKIE,
  stripCookieDomain,
} from "@/lib/api/cookie";
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

const buildForwardHeaders = (
  request: NextRequest,
  cookieOverride?: string,
): Headers => {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value =
      name === "cookie"
        ? (cookieOverride ?? request.headers.get(name))
        : request.headers.get(name);

    if (value !== null && value !== undefined) {
      headers.set(name, name === "cookie" ? pickSessionCookies(value) : value);
    }
  }

  return headers;
};

// The two endpoints that own the session themselves. Retrying a refresh after
// a refresh would replay the id it had just spent, and a logout that answered
// 401 has already done what the caller asked for.
const SESSION_PATHS = new Set(["v1/auth/refresh-token", "v1/auth/logout"]);

/**
 * Whether a 401 is worth one refresh and one retry.
 *
 * Only a GET. A request with a body streams it straight through
 * (`duplex: "half"`), so by the time the answer arrives the body is spent and
 * cannot be sent a second time without holding the whole upload in memory
 * first.
 */
const isRetryable = (request: NextRequest, path: string[]): boolean =>
  request.method === "GET" && !SESSION_PATHS.has(path.join("/"));

// Jawaban be-sada berisi data pribadi; be-sada tidak memasang Cache-Control.
const NO_STORE = { "cache-control": "private, no-store" };

const forwardToBackend = async (
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
      { status: 400, headers: NO_STORE },
    );
  }

  const base = new URL(`${env.API_BASE_URL}/`);
  const target = new URL(path.map(encodeURIComponent).join("/"), base);

  target.search = new URL(request.url).search;

  if (!target.href.startsWith(base.href)) {
    return Response.json(
      { status: 400, error: "Path tidak valid" },
      { status: 400, headers: NO_STORE },
    );
  }

  const isBodyAllowed =
    METHODS_WITH_BODY.has(request.method) && request.body !== null;

  const callBackend = (cookieOverride?: string) =>
    fetch(target, {
      method: request.method,
      headers: buildForwardHeaders(request, cookieOverride),
      body: isBodyAllowed ? request.body : undefined,
      ...(isBodyAllowed ? { duplex: "half" } : {}),
      redirect: "manual",
      // Kunci Data Cache Next adalah URL, bukan user.
      cache: "no-store",
    } as RequestInit & { duplex?: "half" });

  let upstream: Response;

  try {
    upstream = await callBackend();
  } catch {
    return Response.json(
      {
        status: 502,
        error: "Layanan sedang tidak dapat dihubungi. Coba lagi sebentar lagi.",
      },
      { status: 502, headers: NO_STORE },
    );
  }

  // Cookie yang dibawa refresh, dipasang pada jawaban akhir supaya browser ikut
  // memakai sesi yang baru.
  let refreshSetCookie: string[] = [];

  // src/proxy.ts hanya menyegarkan token ketika cookie access-nya sudah hilang
  // dari browser. Cookie yang masih terpasang tapi ditolak be-sada — jam klien
  // yang meleset dari jam server, atau SECRET_ACCESS_TOKEN yang berganti saat
  // deploy — tidak pernah sampai ke jalur itu dan langsung mengeluarkan
  // pengguna. Di sini 401-nya diberi satu kesempatan: segarkan sekali, ulangi
  // sekali. Kalau sesinya memang sudah dicabut, refresh-nya ikut gagal dan
  // pengguna tetap keluar seperti sebelumnya.
  const refreshToken = readCookie(
    request.headers.get("cookie"),
    REFRESH_COOKIE,
  );

  if (upstream.status === 401 && refreshToken && isRetryable(request, path)) {
    const refreshed = await refreshSession(
      request.headers.get("cookie") ?? "",
      refreshToken,
      clientContextOf(request.headers),
    );

    if (refreshed) {
      // Jawaban pertama dibuang seluruhnya, termasuk Set-Cookie penghapus sesi
      // yang dikirim be-sada bersama 401-nya.
      await upstream.body?.cancel().catch(() => {});

      try {
        upstream = await callBackend(refreshed.cookieHeader);
        refreshSetCookie = refreshed.setCookie;
      } catch {
        return Response.json(
          {
            status: 502,
            error:
              "Layanan sedang tidak dapat dihubungi. Coba lagi sebentar lagi.",
          },
          { status: 502, headers: NO_STORE },
        );
      }
    }
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

  for (const cookie of refreshSetCookie) {
    headers.append("set-cookie", cookie);
  }

  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", stripCookieDomain(cookie));
  }

  headers.set("cache-control", NO_STORE["cache-control"]);
  headers.delete("etag");

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });

  // 401 yang bertahan sampai sini berarti be-sada benar-benar tidak mengenali
  // sesi ini: percobaan menyegarkan di atas sudah gagal, atau permintaannya
  // berbadan sehingga tidak bisa diulang. Paling sering karena login di
  // perangkat lain mencabutnya. Tanpa pembersihan ini perangkat lama akan terus
  // mengirim token yang sudah mati sampai cookie itu kedaluwarsa sendiri,
  // menerima 401 berulang tanpa pernah keluar. Menghapusnya membuat permintaan
  // berikutnya jatuh ke jalur login di src/proxy.ts.
  //
  // Hanya 401. 403 adalah soal izin pada sesi yang masih sah, dan mengeluarkan
  // pengguna karena membuka menu yang tidak boleh diaksesnya akan keliru.
  if (upstream.status === 401) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }

  return response;
};

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Bungkus handler BFF dengan metrik Sentry (Metrics): jumlah request + durasi.
 * Route sengaja hanya 2 segmen pertama supaya kardinalitas atribut tetap kecil.
 */
const withMetrics =
  (
    handler: (request: NextRequest, context: RouteContext) => Promise<Response>,
  ) =>
  async (request: NextRequest, context: RouteContext): Promise<Response> => {
    const startedAt = Date.now();
    const { path } = await context.params;
    const route = `/${path.slice(0, 2).join("/")}`;

    try {
      const response = await handler(request, context);

      Sentry.metrics.count("api.request", 1, {
        attributes: { method: request.method, status: response.status, route },
      });
      Sentry.metrics.distribution("api.duration", Date.now() - startedAt, {
        unit: "millisecond",
        attributes: { method: request.method, status: response.status },
      });

      return response;
    } catch (error) {
      Sentry.metrics.count("api.request", 1, {
        attributes: { method: request.method, status: "error", route },
      });
      throw error;
    }
  };

export const GET = withMetrics(forwardToBackend);
export const POST = withMetrics(forwardToBackend);
export const PUT = withMetrics(forwardToBackend);
export const PATCH = withMetrics(forwardToBackend);
export const DELETE = withMetrics(forwardToBackend);
