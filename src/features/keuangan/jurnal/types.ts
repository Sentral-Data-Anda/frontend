import type {
  AccountType,
  JournalStatus,
  PeriodStatus,
} from "@/types/keuangan";

export const JOURNAL_SOURCE_TYPES = [
  "MANUAL",
  "GOODS_RECEIPT",
  "SUPPLIER_INVOICE",
  "SUPPLIER_PAYMENT",
  "PAYROLL_RUN",
  "DEPRECIATION_RUN",
  "PERSEMBAHAN",
  "EVENT_REGISTRATION",
  "STOCK_ADJUSTMENT",
  "ITEM_DISPOSAL",
  "CASH_RECEIPT",
  "CASH_EXPENSE",
  "CASH_TRANSFER",
] as const;

export type JournalSourceType = (typeof JOURNAL_SOURCE_TYPES)[number];

export const JOURNAL_SOURCE_LABEL: Record<JournalSourceType, string> = {
  MANUAL: "Manual",
  GOODS_RECEIPT: "Penerimaan barang",
  SUPPLIER_INVOICE: "Tagihan supplier",
  SUPPLIER_PAYMENT: "Pembayaran supplier",
  PAYROLL_RUN: "Penggajian",
  DEPRECIATION_RUN: "Penyusutan",
  PERSEMBAHAN: "Persembahan",
  EVENT_REGISTRATION: "Pendaftaran event",
  STOCK_ADJUSTMENT: "Penyesuaian stok",
  ITEM_DISPOSAL: "Pelepasan barang",
  CASH_RECEIPT: "Kas masuk",
  CASH_EXPENSE: "Kas keluar",
  CASH_TRANSFER: "Setoran",
};

export type Person = { name: string };

export type JournalLine = {
  id: string;
  publicId: string;
  accountId: number;
  account: { id: number; code: string; name: string; type: AccountType };
  debit: string;
  credit: string;
  description: string | null;
};

export type JournalEntryRef = {
  publicId: string;
  code: string;
  entryDate: string;
};

export type JournalEntry = {
  id: string;
  publicId: string;
  code: string;
  entryDate: string;
  description: string;
  status: JournalStatus;
  sourceType: JournalSourceType;
  source: { type: JournalSourceType; id: number | null };
  reversalOfId: number | null;
  isReversal: boolean;
  fiscalPeriod: { year: number; month: number; status: PeriodStatus } | null;
  postedBy: Person | null;
  postedAt: string | null;
  lineCount: number;
  totalDebit: string;
};

export type JournalEntryDetail = Omit<
  JournalEntry,
  "lineCount" | "totalDebit"
> & {
  lines: JournalLine[];
  reversalOf: JournalEntryRef | null;
  reversedBy: JournalEntryRef | null;
};

export type JournalLinePayload = {
  accountId: number;
  debit: string;
  credit: string;
  description?: string;
};

export type JournalPayload = {
  entryDate: string;
  description: string;
  lines: JournalLinePayload[];
};

export type ReversePayload = {
  entryDate: string;
  description: string;
};

export type PostingRange = {
  from: string;
  to: string;
};

export type PostingRefusal = {
  code: string;
  reason: string;
  reasonCode: string;
};

export type PostingResult = {
  posted: number;
  skipped: number;
  refused: PostingRefusal[];
};
