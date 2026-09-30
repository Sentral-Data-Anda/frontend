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
  balanced: boolean;
  isOpeningEntered: boolean;
};

export type SurplusDefisit = {
  from: string;
  to: string;
  income: ReportAccount[];
  expense: ReportAccount[];
  totals: { income: string; expense: string; surplus: string };
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
  { value: "neraca", label: "Neraca" },
  { value: "laba-rugi", label: "Laba Rugi" },
  { value: "buku-besar", label: "Buku Besar" },
] as const;

export type ReportTab = (typeof REPORT_TABS)[number]["value"];

export type ReportQuery = {
  isPending: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => unknown;
};
