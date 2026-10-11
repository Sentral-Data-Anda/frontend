import { pickSessionCookies, stripCookieDomain } from "@/lib/api/cookie";
import { env } from "@/lib/env";

export type RefreshResult = {
  cookieHeader: string;
  setCookie: string[];
} | null;

const inFlight = new Map<string, Promise<RefreshResult>>();

const parseCookieHeader = (header: string): Map<string, string> => {
  const jar = new Map<string, string>();

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    jar.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }

  return jar;
};

const onRefresh = async (
  cookieHeader: string,
  client: ClientContext,
): Promise<RefreshResult> => {
  let response: Response;

  const headers = new Headers({ Cookie: pickSessionCookies(cookieHeader) });

  // be-sada menulis user agent pemanggil pada sesi yang dibuatnya. Panggilan ini
  // server ke server, jadi tanpa ini setiap rotasi menimpa perangkat yang
  // benar-benar dipakai pengguna dengan user agent bawaan fetch.
  //
  // Hanya user agent. Alamat klien sengaja tidak diteruskan: `x-forwarded-for`
  // datang dari klien dan bisa dikarang, sementara be-sada memasang
  // `trust proxy` dan memakai `req.ip` sebagai kunci rate limiter — meneruskan
  // header itu apa adanya berarti menyerahkan kunci itu kepada pemanggil.
  // Merekam alamat klien yang sebenarnya butuh kontrak header tepercaya antara
  // Vercel dan be-sada, bukan penerusan mentah.
  if (client.userAgent) headers.set("user-agent", client.userAgent);

  try {
    response = await fetch(`${env.API_BASE_URL}/v1/auth/refresh-token`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const setCookie = response.headers.getSetCookie().map(stripCookieDomain);

  const jar = parseCookieHeader(cookieHeader);

  for (const cookie of setCookie) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");

    if (separator === -1) continue;

    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }

  return {
    cookieHeader: [...jar]
      .map(([name, value]) => `${name}=${value}`)
      .join("; "),
    setCookie,
  };
};

/** Yang dibawa agar sesi hasil rotasi tetap menunjuk perangkat yang benar. */
export type ClientContext = {
  userAgent?: string | null;
};

/** Membaca konteks klien dari permintaan yang masuk. */
export const clientContextOf = (headers: Headers): ClientContext => ({
  userAgent: headers.get("user-agent"),
});

export function refreshSession(
  cookieHeader: string,
  refreshToken: string,
  client: ClientContext = {},
): Promise<RefreshResult> {
  const existing = inFlight.get(refreshToken);

  if (existing) return existing;

  const attempt = onRefresh(cookieHeader, client).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, attempt);

  return attempt;
}
