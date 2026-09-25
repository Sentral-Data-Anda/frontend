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
