import { MENU, menuHref } from "@/config/menu";
import { todayJakarta, toDateInput } from "@/lib/date";
import { formatAmount } from "@/lib/format";

export const LAPORAN_ASET_PATH = menuHref(MENU.REPORT, MENU.ASSET_REPORT);

export const TITLE = "Laporan Aset Tetap";

export const readDate = (value: string) => toDateInput(value) || todayJakarta();

export const money = (value: string | undefined) => formatAmount(value ?? 0);

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Laporan Aset Tetap";

export const NO_VIEW_DESCRIPTION =
  "Laporan ini terbuka untuk peran yang memegang aset tetap dan pembukuan. Hubungi administrator bila Anda memang seharusnya memegangnya.";

export const EMPTY_TITLE = "Belum ada aset pada tanggal ini";

export const EMPTY_DESCRIPTION =
  "Aset yang perolehannya setelah tanggal ini, dan aset yang pelepasannya sudah disetujui, tidak ikut dihitung.";

/**
 * Jumlah yang ditampilkan hanya menjumlahkan halaman yang sedang dibuka.
 *
 * Dikatakan terus terang di layar: satu halaman berisi sepuluh aset yang
 * terbaca sebagai seluruh posisi aset gereja adalah salah baca yang mahal.
 */
export const PAGE_TOTAL_NOTE = "Halaman ini saja";
