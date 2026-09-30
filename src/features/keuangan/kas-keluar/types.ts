import type { ServerAttachment } from "@/types/attachment";
import type { CashStatus, JournalRef } from "@/types/keuangan";
import type { ApprovalStatus } from "@/types/persetujuan";

export type ExpenseApproval = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  note: string | null;
  isSubmittedByViewer: boolean;
};

export type ExpenseLine = {
  publicId: string;
  accountId: number;
  account: { code: string; name: string };
  amount: string;
  description: string | null;
};

export type CashExpense = {
  id: number;
  publicId: string;
  code: string;
  expenseDate: string;
  description: string;
  payee: string;
  paidFromAccountId: number;
  paidFromAccount: { id: number; code: string; name: string };
  bapelId: number | null;
  bapel: { code: string; name: string } | null;
  method: string | null;
  reference: string | null;
  totalAmount: string;
  status: CashStatus;
  approval: ExpenseApproval | null;
  approvedBy: { name: string } | null;
  approvedAt: string | null;
  lineCount: number;
};

export type CashExpenseDetail = Omit<CashExpense, "lineCount"> & {
  lines: ExpenseLine[];
  attachments: ServerAttachment[];
  journal: JournalRef | null;
  cancelReason: string | null;
};

export type ExpenseState = CashStatus | "PENDING_APPROVAL";

export type ExpenseAction = "pengajuan" | "tarik" | "bayar" | "batal" | "hapus";
