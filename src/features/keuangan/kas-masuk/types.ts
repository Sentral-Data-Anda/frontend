import type { CashStatus, JournalStatus } from "@/types/keuangan";

export type CashReceiptLine = {
  publicId: string;
  accountId: number;
  account: { code: string; name: string };
  amount: string;
  description: string | null;
};

export type CashReceipt = {
  id: number;
  publicId: string;
  code: string;
  receiptDate: string;
  description: string;
  payer: string;
  intoAccountId: number;
  intoAccount: { id: number; code: string; name: string };
  bapel: { id: number; code: string; name: string } | null;
  method: string | null;
  reference: string | null;
  totalAmount: string;
  status: CashStatus;
};

export type CashReceiptDetail = CashReceipt & {
  lines: CashReceiptLine[];
  journal: { code: string; status: JournalStatus } | null;
};

export type CashReceiptPayload = {
  receiptDate: string;
  description: string;
  payer: string;
  intoAccountId: number;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  lines: { accountId: number; amount: number; description: string | null }[];
};

export type ReceiptAction = "terima" | "batal" | "hapus";
