/**
 * Origin boneka, tidak pernah benar-benar dihubungi.
 *
 * `new URL(value, base)` butuh base untuk bisa mem-parse path relatif; nilai
 * origin ini sembarang selama unik dan tidak pernah tabrakan dengan origin
 * sungguhan, karena satu-satunya yang diperiksa adalah APAKAH hasil
 * resolusinya masih memakai origin yang sama persis.
 */
const PROBE_ORIGIN = "http://sada.invalid";

/**
 * Tujuan setelah login hanya sah bila ia path di origin ini sendiri.
 *
 * Tanpa penjaga ini, `?redirect=https://phishing.test/login` akan melempar
 * user ke situs lain tepat sesudah ia berhasil masuk — halaman palsu yang
 * meminta password ulang, dari alamat yang tadinya sah. Ini kelas kerentanan
 * open redirect, dan satu-satunya obatnya adalah memeriksa nilainya, bukan
 * mempercayai dari mana ia datang.
 *
 * Pertahanannya DUA LAPIS, dan urutannya penting:
 *
 * 1. Tolak karakter kontrol ASCII (0x00–0x1F dan 0x7F/DEL) lebih dulu. `\n`
 *    dan `\r` yang lolos ke `redirect()` membuat Node melempar
 *    `ERR_INVALID_CHAR` saat header `Location` di-set — bukan open redirect,
 *    tapi 500 tak tertangani yang dipicu masukan user begitu saja.
 *
 * 2. Resolusikan nilainya terhadap `PROBE_ORIGIN` lewat `new URL`, lalu tolak
 *    bila origin hasilnya berubah. Ini BUKAN sekadar pemeriksaan awalan
 *    string (`startsWith("//")`, `startsWith("/\\")`, dst.) — daftar awalan
 *    terlarang seperti itu selalu ketinggalan dari orang yang mencari cara
 *    melewatinya. `new URL` menerapkan aturan parsing yang SAMA dengan
 *    browser, termasuk normalisasi yang justru jadi sumber bypass:
 *
 *    Contoh nyata — TAB. `?redirect=%2F%09%2Fevil.test` di-decode Next
 *    menjadi path `"/\t/evil.test"`. Pemeriksaan awalan lama meloloskannya:
 *    ia diawali "/", bukan "//", bukan "/\\". Tapi browser MEMBUANG karakter
 *    TAB sebelum mem-parse URL (aturan WHATWG), sehingga di address bar ia
 *    menjadi "//evil.test" — protocol-relative, alias origin lain. Guard
 *    berbasis awalan tidak pernah melihat ini karena ia memeriksa string
 *    SEBELUM dibuang tab-nya; `new URL` memeriksa SESUDAHNYA, persis seperti
 *    browser akan memperlakukannya.
 *
 * `value.startsWith("/")` tetap dipertahankan sesudah lapis kedua: tanpa itu,
 * nilai seperti `"evil.test"` (tanpa garis miring awal) resolve ke
 * `http://sada.invalid/evil.test` — origin sama, lolos lapis 2 — padahal ia
 * bukan path absolut dan bukan tujuan yang sah untuk sebuah redirect.
 */
export function isSafeRedirectPath(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;

  if (/[\x00-\x1f\x7f]/.test(value)) return false;

  let resolved: URL;
  try {
    resolved = new URL(value, PROBE_ORIGIN);
  } catch {
    return false;
  }

  return resolved.origin === PROBE_ORIGIN;
}
