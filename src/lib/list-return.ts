import { isSafeRedirectPath } from "./redirect";

/**
 * Jalan kembali dari layar detail ke daftar asalnya, dan penanda baris yang
 * dibuka (docs/design/list-state.md §2.2, §2.4).
 *
 * `sessionStorage`, bukan URL: URL detail harus bisa dibagikan tanpa membawa
 * filter orang lain. Per tab, jadi detail yang dibuka di tab baru memang
 * kembali ke daftar bersih.
 *
 * Semua akses dibungkus `try/catch` dan dijaga `typeof window`: di server
 * tidak ada `sessionStorage`, dan di jendela privat/penyimpanan yang diblokir
 * pengaksesnya melempar. Gagal baca = tidak ada nilai; gagal tulis = diam.
 */
const returnKey = (listPath: string) => `list-return:${listPath}`;

const focusKey = (listPath: string) => `list-focus:${listPath}`;

const read = (key: string): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Penyimpanan penuh atau diblokir: fitur ini bukan syarat layar berjalan.
  }
};

const remove = (key: string) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Sama seperti `write`.
  }
};

/** Simpan URL daftar lengkap (`pathname + search`) untuk layar detailnya. */
export const saveListReturn = (listPath: string, url: string) =>
  write(returnKey(listPath), url);

/**
 * URL kembali ke daftar. Nilai tersimpan dipakai hanya bila lolos
 * `isSafeRedirectPath` DAN memang menunjuk daftar itu — kalau tidak, jatuh ke
 * `listPath` bersih.
 */
export function readListReturn(listPath: string): string {
  const saved = read(returnKey(listPath));

  return isSafeRedirectPath(saved) &&
    (saved === listPath || saved.startsWith(`${listPath}?`))
    ? saved
    : listPath;
}

/** Tandai baris yang dibuka, supaya bisa disorot saat kembali. */
export const saveListFocus = (listPath: string, id: string) =>
  write(focusKey(listPath), id);

/**
 * Baca penanda baris, TANPA membuangnya.
 *
 * Dulu keduanya satu fungsi (`takeListFocus`), dan itu salah karena balapan
 * yang tidak terlihat sebagai galat: daftar ter-mount lebih dulu dengan isi
 * dari cache yang belum memuat baris yang baru disimpan, jadi penandanya
 * terbakar pada render pertama dan sorotannya tidak pernah muncul — juga saat
 * barisnya tiba satu render kemudian. Terukur: 10 sampel setelah simpan,
 * `[data-focus]` nol semua.
 *
 * Pemanggil karena itu membuang penandanya SENDIRI, hanya setelah barisnya
 * benar-benar ketemu (`clearListFocus`).
 */
export const readListFocus = (listPath: string): string | null =>
  read(focusKey(listPath));

/** Buang penanda baris — dipanggil setelah barisnya benar-benar disorot. */
export const clearListFocus = (listPath: string) => remove(focusKey(listPath));
