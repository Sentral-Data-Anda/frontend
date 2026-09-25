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

const onRefresh = async (cookieHeader: string): Promise<RefreshResult> => {
  let response: Response;

  try {
    response = await fetch(`${env.API_BASE_URL}/v1/auth/refresh-token`, {
      headers: { Cookie: pickSessionCookies(cookieHeader) },
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

export function refreshSession(
  cookieHeader: string,
  refreshToken: string,
): Promise<RefreshResult> {
  const existing = inFlight.get(refreshToken);

  if (existing) return existing;

  const attempt = onRefresh(cookieHeader).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, attempt);

  return attempt;
}
