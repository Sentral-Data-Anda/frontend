import type { ApprovalDocumentType, ApprovalStatus } from "@/types/persetujuan";

export type ApprovalStepStatus = Exclude<ApprovalStatus, "CANCELLED">;

export type ApprovalStep = {
  publicId: string;
  order: number;
  approverRoleName: string | null;
  approverRoleUser: { publicId: string; name: string } | null;
  approverBapel: { publicId: string; code: string; name: string } | null;
  status: ApprovalStepStatus;
  note: string | null;
  actedAt: string | null;
  actor: { name: string } | null;
};

export type ApprovalRequest = {
  publicId: string;
  code: string;
  documentType: ApprovalDocumentType;
  amount: string;
  status: ApprovalStatus;
  currentOrder: number;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  config: { publicId: string; name: string } | null;
  document: { publicId: string; code: string; title: string } | null;
  submitter: { name: string } | null;
  steps: ApprovalStep[];
};

export type MyDecision = {
  status: "APPROVED" | "REJECTED";
  note: string | null;
  actedAt: string;
};

export type ApprovalListItem = ApprovalRequest & {
  myDecision?: MyDecision | null;
};

export type ApprovalDetail = ApprovalRequest & {
  canSign: boolean;
  canWithdraw: boolean;
};

export type ApprovalView = "menunggu" | "pengajuan" | "riwayat";

export type StepState =
  "approved" | "rejected" | "waiting" | "upcoming" | "skipped";
