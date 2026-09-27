import type { ApprovalDocumentType } from "@/types/persetujuan";

export type SetelanStep = {
  publicId: string;
  order: number;
  approverRoleUserId: number | null;
  approverRoleUser: { publicId: string; name: string } | null;
  approverRoleName: string | null;
  approverBapelId: number | null;
  approverBapel: { publicId: string; code: string; name: string } | null;
};

export type SetelanItem = {
  publicId: string;
  name: string;
  documentType: ApprovalDocumentType;
  bapelId: number | null;
  minAmount: string | null;
  maxAmount: string | null;
  isActive: boolean;
  bapel: { code: string; name: string } | null;
  steps: SetelanStep[];
};

export type SetelanTierPayload = {
  roleUserId: number | null;
  roleName: string | null;
  bapelId: number | null;
};

export type SetelanPayload = {
  name: string;
  documentType: ApprovalDocumentType;
  bapelId: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  isActive: boolean;
  tiers: SetelanTierPayload[];
};

export type JabatanRow = { name: string };

export const SETELAN_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};
