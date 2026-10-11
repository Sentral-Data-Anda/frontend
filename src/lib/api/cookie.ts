export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export function pickSessionCookies(header: string): string {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.slice(0, part.indexOf("="));

      return name === ACCESS_COOKIE || name === REFRESH_COOKIE;
    })
    .join("; ");
}

export function stripCookieDomain(setCookie: string): string {
  return setCookie
    .split(";")
    .filter((part) => !/^\s*domain\s*=/i.test(part))
    .join(";");
}

/**
 * Satu nilai cookie dari header Cookie.
 *
 * `NextRequest.cookies` tidak dipakai di sini: handler rute ini juga dipanggil
 * dengan `Request` biasa, dan hanya header yang selalu ada pada keduanya.
 */
export function readCookie(
  header: string | null,
  name: string,
): string | undefined {
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return undefined;
}
