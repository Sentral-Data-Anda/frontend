import type { SelectOption } from "@/components/common/control";
import type { AccountType } from "@/types/keuangan";

export type OfferingTypeAccount = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
};

export type OfferingType = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
  hasPeriod: boolean;
  requiresJemaat: boolean;
  accountId: number | null;
  account: OfferingTypeAccount | null;
};

export type OfferingTypePayload = {
  name: string;
  isActive: boolean;
  hasPeriod: boolean;
  requiresJemaat: boolean;
  accountId: number | null;
};

export const OFFERING_TYPE_STATUS_FILTER: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: "Aktif", value: "aktif" },
  { label: "Nonaktif", value: "nonaktif" },
];
