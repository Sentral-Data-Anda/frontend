import { MENU, createHref, detailHref, menuHref } from "@/config/menu";
import { todayJakarta, toDateInput } from "@/lib/date";
import { formatAmount } from "@/lib/format";

import {
  REPORT_TABS,
  type AccountTreeRow,
  type ReportAccount,
  type ReportTab,
} from "./types";

export const LAPORAN_PATH = menuHref(MENU.KEUANGAN, MENU.LAPORAN_KEUANGAN);

export const JURNAL_CREATE_PATH = createHref(MENU.KEUANGAN, MENU.JURNAL);

export const accountHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.AKUN, code);

export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const ledgerHref = (code: string, month: string) =>
  `${LAPORAN_PATH}?tab=buku-besar&akun=${encodeURIComponent(code)}&bulan=${month}`;

export const readTab = (value: string): ReportTab =>
  REPORT_TABS.some((tab) => tab.value === value)
    ? (value as ReportTab)
    : "neraca";

export const readDate = (value: string) => toDateInput(value) || todayJakarta();

export const readMonth = (value: string) =>
  /^\d{4}-\d{2}$/.test(value) ? value : todayJakarta().slice(0, 7);

export const flattenTree = (
  nodes: readonly ReportAccount[],
  depth = 0,
): AccountTreeRow[] =>
  nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);

export const money = (value: string | undefined) => formatAmount(value ?? 0);

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Laporan Keuangan";

export const NO_VIEW_DESCRIPTION =
  "Laporan keuangan hanya terbuka untuk peran yang memegang pembukuan. Hubungi administrator bila Anda memang seharusnya memegangnya.";

export const OPENING_TITLE = "Saldo awal gereja belum dimasukkan.";

export const OPENING_MESSAGE =
  "Angka di bawah hanya mencakup transaksi yang dicatat di sistem ini.";

export const CLOSING_TITLE = "Belum ada tutup buku tahunan.";

export const CLOSING_MESSAGE =
  "Hasil periode ditampilkan sebagai baris tersendiri, belum dipindahkan ke ekuitas. Sistem ini belum punya tutup buku akhir tahun, jadi angka Surplus/Defisit di bawah dihitung sejak awal pencatatan.";

export const UNBALANCED_TITLE = "Neraca tidak seimbang.";

export const UNBALANCED_MESSAGE = "Hubungi pengelola sistem.";

export const LEDGER_EMPTY_TITLE = "Pilih akun untuk melihat buku besarnya";

export const LEDGER_EMPTY_DESCRIPTION =
  "Buku besar menampilkan satu akun sekaligus, dengan saldo berjalan di setiap baris.";

export const LEDGER_NOTE =
  "Untuk memeriksa pemakaian dana khusus, pilih akun kas dana tersebut.";

export const LEDGER_NO_ROW_TITLE = "Belum ada mutasi di bulan ini";

export const LEDGER_NO_ROW_DESCRIPTION =
  "Saldo awal dan saldo akhir tetap terbaca di atas dan di bawah daftar.";

export const SURPLUS_LABEL = "Surplus/Defisit";

/**
 * Kelas aset neto ISAK 35, dengan kalimat yang bisa dibaca orang.
 *
 * "Tanpa pembatasan" dan "dengan pembatasan" adalah istilah standarnya, dan
 * istilah itulah yang dicari pemeriksa. Keterangannya ada supaya bendahara
 * yang belum pernah menemuinya tahu artinya tanpa membuka PSAK.
 */
export const NET_ASSET_CLASS_LABEL = {
  tanpaPembatasan: "Tanpa pembatasan",
  denganPembatasan: "Dengan pembatasan",
} as const;

export const NET_ASSET_NOTE =
  "Dengan pembatasan berarti pemberinya menentukan penggunaannya — dana pembangunan, beasiswa. Pembatasan di sini dibawa oleh AKUN, jadi dana terikat butuh akun pendapatan dan akun bebannya sendiri.";

export const CASH_FLOW_SECTION_LABEL = {
  OPERASI: "Aktivitas operasi",
  INVESTASI: "Aktivitas investasi",
  PENDANAAN: "Aktivitas pendanaan",
} as const;

export const CASH_FLOW_DERIVED_TITLE =
  "Sebagian angka ditempatkan otomatis dari tipe akunnya.";

export const CASH_FLOW_DERIVED_MESSAGE =
  "Akun yang belum punya kategori arus kas ditebak dari tipenya, dan tebakan itu salah untuk sebagian hal — membeli persediaan adalah operasi, bukan investasi. Atur Kategori Arus Kas di Akun agar angkanya dipilih, bukan ditebak.";

export const CASH_FLOW_NO_ACCOUNT_TITLE = "Belum ada akun yang ditandai kas.";

export const CASH_FLOW_NO_ACCOUNT_MESSAGE =
  "Laporan Arus Kas menjelaskan pergerakan saldo kas dan bank, jadi ia perlu tahu akun mana yang kas. Tandai di Akun lewat Kategori Arus Kas.";

export const ASET_NETO_SCROLL_HINT =
  "Geser tabel ke samping untuk kolom Dengan pembatasan dan Jumlah.";

export const ASET_NETO_EMPTY_NOTE =
  "Gereja ini belum punya dana dengan pembatasan. Kolomnya tetap ditampilkan karena ISAK 35 memintanya, dan nol adalah jawaban yang benar.";

export const SURPLUS_HINT = "Sejak awal pencatatan, belum dipindah ke ekuitas.";
