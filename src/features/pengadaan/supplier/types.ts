import type { SelectOption } from "@/components/common/control";

export type Supplier = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  npwp: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  isActive: boolean;
};

export type SupplierPayload = Omit<Supplier, "id" | "publicId" | "code">;

export const SUPPLIER_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const SUPPLIER_STATUS_FILTER: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: SUPPLIER_STATUS_LABEL.true, value: "aktif" },
  { label: SUPPLIER_STATUS_LABEL.false, value: "nonaktif" },
];
