/**
 * Bahasa tabel (dashboard-desktop.md §10.9), satu sumber untuk
 * `DashboardTable` (kartu Beranda) dan `DataTable` (daftar) — seperti
 * `MENU_POPUP`/`MENU_ITEM` untuk popup.
 */

/** Kepala kolom: 10px, kapital, pudar, terpotong. */
export const TABLE_HEAD =
  "text-muted-foreground truncate text-caption font-medium tracking-wide uppercase";

/**
 * Tautan judul yang diregangkan menutupi seluruh baris (baris harus
 * `relative`): satu baris = satu target klik = satu perhentian Tab, dengan
 * cincin fokus selebar baris.
 */
export const TABLE_ROW_LINK =
  "focus-visible:after:ring-ring outline-none after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2";

/**
 * Garis baris. Warnanya mengikuti PERMUKAAN, jadi ada dua:
 * - di kartu putih (Beranda): `hairline` — `border` (primary-200) terlalu
 *   berat di atas putih untuk tabel sepadat kartu dashboard;
 * - di kanvas (daftar): `border` — `hairline` #e5e9ee di atas kanvas
 *   primary-50 nyaris tak terlihat. Garisnya digambar `::after` dari tepi
 *   konten ke tepi konten, TIDAK ikut menjorok bersama bidang hover.
 */
export const TABLE_HEAD_LINE_ON_CARD = "border-hairline border-b";
export const TABLE_ROWS_ON_CARD = "divide-hairline divide-y";
export const TABLE_ROW_LINE_ON_CANVAS =
  "after:border-border after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-0 after:border-b";
