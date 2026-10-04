import type {
  BapelRef,
  BudgetReportStatus,
  ComplianceState,
  GateWaiver,
  ProgramRef,
} from "@/types/anggaran";
import type { ServerAttachment } from "@/types/attachment";
import type { ApprovalStatus } from "@/types/persetujuan";

// `publicId` tahap adalah nilai QR verifikasi, dan ia boleh null: bacaan yang
// meringkas bentuk `approval` kehilangan field ini, dan tahap tanpa kunci
// dirender tanpa QR alih-alih dengan QR kosong.
export type ReportApprovalStep = {
  publicId: string | null;
  order: number;
  approverRoleName: string | null;
  status: ApprovalStatus;
  note: string | null;
  actedAt: string | null;
  actor: { name: string } | null;
};

export type ReportApproval = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  currentOrder: number;
  isSubmittedByViewer: boolean;
  steps: ReportApprovalStep[];
};

export type BudgetReport = {
  publicId: string;
  code: string;
  bapel: BapelRef | null;
  year: number;
  month: number;
  label: string;
  status: BudgetReportStatus;
  totalAmount: string;
  approval: ReportApproval | null;
  waiver: GateWaiver | null;
  lineCount: number;
  receiptCount: number;
};

export type BudgetReportLine = {
  publicId: string;
  accountId: number;
  account: { code: string; name: string } | null;
  programId: number | null;
  program: ProgramRef | null;
  spentDate: string;
  description: string;
  amount: string;
  cashExpense: { publicId: string; code: string } | null;
};

export type BudgetReportDetail = Omit<
  BudgetReport,
  "lineCount" | "receiptCount"
> & {
  bapelId: number;
  note: string | null;
  lines: BudgetReportLine[];
  listReceipt: ServerAttachment[];
  disbursementTotal: string;
  approvedBy: { name: string } | null;
  approvedAt: string | null;
};

export type PrefillLine = {
  cashExpense: { publicId: string; code: string };
  accountId: number;
  account: { code: string; name: string } | null;
  spentDate: string;
  description: string;
  amount: string;
};

export type Prefill = {
  lines: PrefillLine[];
  total: string;
};

export type ComplianceRow = {
  bapelId: number;
  bapel: BapelRef | null;
  state: ComplianceState;
  label: string;
  report: { publicId: string; code: string } | null;
  disbursementCount: number;
  disbursementTotal: string;
  waiver: GateWaiver | null;
};

export type ReportAction = "pengajuan" | "tarik" | "hapus";
