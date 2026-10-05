import type { GateWaiver } from "@/types/anggaran";
import type { ServerAttachment } from "@/types/attachment";
import type { BapelChoice, CashStatus, JournalRef } from "@/types/keuangan";
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
  // null hanya berarti baris lama: pertanyaannya belum ada saat ia ditulis.
  bapelChoice: BapelChoice | null;
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
  // Pembebasan gerbang untuk komisi + bulan `expenseDate`, bukan untuk dokumen
  // ini. Alasannya ditampilkan PENUH; memotongnya menghapus satu-satunya
  // kendali atas pintu ini.
  waiver: GateWaiver | null;
};

// Bentuk minimal `/laporan-budget/belum-lapor` yang dibutuhkan gerbang. Fitur
// tidak saling mengimpor, jadi ia ditulis lagi di sini — hanya field yang
// dipakai, bukan salinan bentuk penuh milik Laporan Budget.
export type GateCompliance = {
  bapelId: number;
  state: "APPROVED" | "DRAFT" | "MISSING" | "NOT_DUE" | "WAIVED";
  report: { publicId: string; code: string } | null;
  waiver: GateWaiver | null;
};

export type WaiveInput = {
  bapelId: number;
  year: number;
  month: number;
  reason: string;
};

export type ExpenseState = CashStatus | "PENDING_APPROVAL";

export type ExpenseAction = "pengajuan" | "tarik" | "bayar" | "batal" | "hapus";
