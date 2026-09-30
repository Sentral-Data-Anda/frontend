import { MENU, createHref, detailHref, menuHref } from "@/config/menu";
import { todayJakarta, toDateInput } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

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

export const money = (value: string | undefined) =>
  formatRupiah(Number(value ?? 0));

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

export const SURPLUS_HINT = "Sejak awal pencatatan, belum dipindah ke ekuitas.";
