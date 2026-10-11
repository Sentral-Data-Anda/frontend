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

  // be-sada records the caller's address and user agent on the session it
  // creates. This call is server to server, so without these it records this
  // server instead and every rotation overwrites the device the user actually
  // signed in from with a datacenter address.
  if (client.userAgent) headers.set("user-agent", client.userAgent);
  if (client.forwardedFor) headers.set("x-forwarded-for", client.forwardedFor);

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

/** What be-sada needs to keep the session pointing at the real device. */
export type ClientContext = {
  userAgent?: string | null;
  forwardedFor?: string | null;
};

/**
 * Reads the client context off an incoming request.
 *
 * `x-forwarded-for` already carries the chain when one is present; falling back
 * to the single address keeps the local and self-hosted cases working.
 */
export const clientContextOf = (headers: Headers): ClientContext => ({
  userAgent: headers.get("user-agent"),
  forwardedFor: headers.get("x-forwarded-for") ?? headers.get("x-real-ip"),
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
