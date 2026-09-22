/** Nama cookie sesi be-sada. Dipakai proxy dan route logout. */
export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

/**
 * Header `Cookie` yang dikirim ke be-sada hanya memuat cookie sesi. Cookie
 * milik FE (mis. `sidebar_collapsed`) tidak punya urusan di sana — daftar-
 * putih, sama seperti header BFF: cookie FE baru tidak ikut bocor sampai ada
 * yang sengaja mengizinkannya. be-sada hanya membaca dua ini
 * (`req.signedCookies`).
 */
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

/**
 * Membuang atribut `Domain` dari satu header `Set-Cookie`.
 *
 * be-sada memasang `Domain=<CORS_DOMAIN>` pada cookie sesinya. Diteruskan apa
 * adanya, browser MENOLAK cookie itu karena domainnya tidak mencakup origin
 * FE — dan penolakan itu tidak memunculkan error apa pun: login sekadar tidak
 * pernah jadi. Tanpa atribut `Domain`, cookie berlaku untuk host yang
 * mengirimnya, yaitu persis yang kita mau.
 *
 * Atribut lain (`HttpOnly`, `Secure`, `SameSite`, `Max-Age`, `Path`)
 * diteruskan apa adanya.
 *
 * Tinggal di sini, bukan di route handler, karena `src/proxy.ts` juga
 * memakainya — dan mengimpor modul route handler dari proxy akan menyeret
 * handler HTTP-nya ikut ke bundel proxy.
 */
export function stripCookieDomain(setCookie: string): string {
  return setCookie
    .split(";")
    .filter((part) => !/^\s*domain\s*=/i.test(part))
    .join(";");
}
