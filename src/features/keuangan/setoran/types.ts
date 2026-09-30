import type { AccountType, CashStatus, JournalRef } from "@/types/keuangan";

export type TransferAccount = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
};

export type TransferAccountOption = TransferAccount & { isActive: boolean };

export type Transfer = {
  id: number;
  publicId: string;
  code: string;
  transferDate: string;
  fromAccountId: number;
  toAccountId: number;
  fromAccount: TransferAccount;
  toAccount: TransferAccount;
  amount: string;
  description: string;
  reference: string | null;
  bapel: { code: string; name: string } | null;
  status: CashStatus;
  method: string | null;
  journal: JournalRef | null;
};

export type TransferPayload = {
  transferDate: string;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  description: string;
  reference: string | null;
  bapelId: null;
};

export type TransferAction = "setor" | "batal";
