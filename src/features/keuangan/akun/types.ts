import type { SelectOption } from "@/components/common/control";
import { ACCOUNT_TYPE_LABEL, type AccountType } from "@/types/keuangan";

export type Account = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  parent: { id: number; code: string; name: string; type: AccountType } | null;
  isActive: boolean;
  childCount: number;
};

export type AccountDetail = Account & { hasJournalLines: boolean };

export type AccountPayload = {
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  isActive: boolean;
};

export type AccountTreeRow = Account & { depth: number };

export const ACCOUNT_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const ACCOUNT_STATUS_FILTER: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: ACCOUNT_STATUS_LABEL.true, value: "aktif" },
  { label: ACCOUNT_STATUS_LABEL.false, value: "nonaktif" },
];

export const ACCOUNT_TYPE_FILTER: SelectOption[] = [
  { label: "Semua tipe", value: "" },
  ...Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

export const ACCOUNT_STATUS_OPTIONS: SelectOption[] = [
  { label: ACCOUNT_STATUS_LABEL.true, value: "true" },
  { label: ACCOUNT_STATUS_LABEL.false, value: "false" },
];

export const ACCOUNT_TYPE_OPTIONS: SelectOption[] = Object.entries(
  ACCOUNT_TYPE_LABEL,
).map(([value, label]) => ({ value, label }));
