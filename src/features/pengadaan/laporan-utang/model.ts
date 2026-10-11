import { MENU, menuHref } from "@/config/menu";
import { todayJakarta, toDateInput } from "@/lib/date";
import { formatAmount } from "@/lib/format";

export const LAPORAN_UTANG_PATH = menuHref(MENU.REPORT, MENU.AP_AGING);

export const TITLE = "Umur Utang Supplier";

export const readDate = (value: string) => toDateInput(value) || todayJakarta();

export const money = (value: string | undefined) => formatAmount(value ?? 0);

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Umur Utang Supplier";

export const NO_VIEW_DESCRIPTION =
  "Laporan ini terbuka untuk peran yang memegang pengadaan dan pembukuan. Hubungi administrator bila Anda memang seharusnya memegangnya.";

export const EMPTY_TITLE = "Tidak ada utang supplier pada tanggal ini";

export const EMPTY_DESCRIPTION =
  "Faktur yang masih berstatus draf belum dihitung sebagai utang, begitu juga faktur yang sudah lunas atau dibatalkan.";

/**
 * Dikatakan di layar, bukan disembunyikan di dokumen.
 *
 * Menerbitkan faktur dan mempostingnya adalah dua langkah, dan hanya yang
 * kedua menyentuh jurnal. Bendahara yang mencocokkan angka ini dengan saldo
 * akun Hutang Supplier perlu tahu kenapa keduanya bisa berbeda.
 */
export const POSTING_NOTE =
  "Faktur yang sudah diterbitkan tapi belum diposting sudah dihitung di sini, tapi belum ada di akun Hutang Supplier.";
