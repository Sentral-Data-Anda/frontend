import type {
  BapelRef,
  BudgetYear,
  CeilingUsage,
  ProgramStatus,
} from "@/types/anggaran";
import type { ApprovalStatus } from "@/types/persetujuan";

export type ProgramApprovalStep = {
  order: number;
  approverRoleName: string;
  status: ApprovalStatus;
  note: string | null;
  actedAt: string | null;
  actor: { name: string } | null;
};

export type ProgramApproval = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  currentOrder: number;
  amount: string;
  isSubmittedByViewer: boolean;
  steps: ProgramApprovalStep[];
};

export type Program = {
  publicId: string;
  code: string;
  name: string;
  year: number;
  budgetYear: BudgetYear;
  status: ProgramStatus;
  isUnplanned: boolean;
  startDate: string | null;
  endDate: string | null;
  bapel: BapelRef | null;
  proposedAmount: string;
  approval: ProgramApproval | null;
  itemCount: number;
};

export type ProgramItem = {
  publicId: string;
  accountId: number;
  account: { code: string; name: string } | null;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  note: string | null;
};

export type ReportedPart = {
  publicId: string;
  code: string;
  label: string;
  amount: string;
};

export type ReportedUsage = {
  parts: ReportedPart[];
  untagged: string;
};

export type ProgramDetail = Omit<Program, "itemCount"> & {
  bapelId: number;
  description: string | null;
  items: ProgramItem[];
  ceiling: CeilingUsage;
  reportedUsage: ReportedUsage;
  approvedBy: { name: string } | null;
  approvedAt: string | null;
  cancelReason: string | null;
  cancelledBy: { name: string } | null;
  cancelledAt: string | null;
};

export type ProgramPayload = {
  name: string;
  year: number;
  bapelId: number;
  startDate: string | null;
  endDate: string | null;
  isUnplanned: boolean;
  description: string | null;
  items: {
    accountId: number;
    description: string;
    quantity: string;
    unitPrice: string;
    note: string | null;
  }[];
};

export type ProgramAction = "pengajuan" | "tarik" | "hapus";
