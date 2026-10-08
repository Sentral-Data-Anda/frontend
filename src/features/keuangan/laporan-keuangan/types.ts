import type { AccountType } from "@/types/keuangan";

export type ReportAccount = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  total: string;
  children: ReportAccount[];
};

export type AccountTreeRow = ReportAccount & { depth: number };

/**
 * Satu angka per kelas aset neto ISAK 35, plus jumlah keduanya.
 *
 * `total` ikut dikirim server, tidak dihitung ulang di layar: dua tempat yang
 * menjumlahkan hal yang sama adalah dua tempat yang bisa berselisih.
 */
export type ByNetAssetClass = {
  tanpaPembatasan: string;
  denganPembatasan: string;
  total: string;
};

export type PerubahanAsetNeto = {
  from: string;
  to: string;
  opening: ByNetAssetClass;
  income: ByNetAssetClass;
  expense: ByNetAssetClass;
  change: ByNetAssetClass;
  equityMovement: ByNetAssetClass;
  closing: ByNetAssetClass;
};

export type CashFlowSection = "OPERASI" | "INVESTASI" | "PENDANAAN";

export type CashFlowLine = {
  code: string;
  name: string;
  section: CashFlowSection;
  /** Bertanda: positif kas masuk, negatif kas keluar. */
  amount: string;
};

export type ArusKas = {
  from: string;
  to: string;
  openingCash: string;
  sections: { operasi: string; investasi: string; pendanaan: string };
  lines: CashFlowLine[];
  change: string;
  closingCash: string;
  cashAccounts: { code: string; name: string }[];
  /** Apakah ada angka yang ditempatkan cadangan, bukan dipilih seseorang. */
  isDerived: boolean;
};

export type Neraca = {
  date: string;
  assets: ReportAccount[];
  liabilities: ReportAccount[];
  equity: ReportAccount[];
  totals: {
    assets: string;
    liabilities: string;
    equity: string;
    surplus: string;
  };
  /**
   * Aset neto ISAK 35: ekuitas tercatat PLUS hasil periode berjalan, per kelas.
   *
   * Hasil periodenya ikut karena belum ada tutup buku — membaca ekuitas saja
   * melaporkan aset neto yang tertinggal satu tahun penuh.
   */
  netAssets: ByNetAssetClass;
  balanced: boolean;
  isOpeningEntered: boolean;
};

export type SurplusDefisit = {
  from: string;
  to: string;
  income: ReportAccount[];
  expense: ReportAccount[];
  totals: { income: string; expense: string; surplus: string };
  byNetAssetClass: {
    income: ByNetAssetClass;
    expense: ByNetAssetClass;
    surplus: ByNetAssetClass;
  };
};

export type LedgerRow = {
  entryCode: string;
  entryPublicId: string | null;
  entryDate: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
};

export type BukuBesar = {
  account: { code: string; name: string; type: AccountType };
  from: string;
  to: string;
  openingBalance: string;
  rows: LedgerRow[];
  closingBalance: string;
  totalData: number;
  totalPage: number;
};

export const REPORT_TABS = [
  { value: "neraca", label: "Posisi Keuangan" },
  { value: "laba-rugi", label: "Penghasilan" },
  { value: "aset-neto", label: "Aset Neto" },
  { value: "arus-kas", label: "Arus Kas" },
  { value: "buku-besar", label: "Buku Besar" },
] as const;

export type ReportTab = (typeof REPORT_TABS)[number]["value"];

export type ReportQuery = {
  isPending: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => unknown;
};
