import type { SelectOption } from "@/components/common/control";

export type ComponentType = "EARNING" | "DEDUCTION";

export type CalculationType = "FIXED" | "PERCENTAGE";

export type KomponenPayroll = {
  id: number;
  code: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: string | null;
  isTaxable: boolean;
  isActive: boolean;
  accountId: number | null;
};

export type KomponenPayrollPayload = {
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: number | null;
  isTaxable: boolean;
  isActive: boolean;
  accountId: number | null;
};

export type PenetapanKomponen = {
  publicId: string;
  karyawanId: number;
  payrollComponentId: number;
  value: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  karyawan: { publicId: string; code: string; name: string };
  payrollComponent: AssignedComponent;
};

/**
 * Komponen seperti yang dibawa relasi penetapan. `calculationType` dan
 * `defaultValue` ada di sini supaya layar penetapan tidak bergantung pada
 * pemilih yang hanya memuat komponen aktif — persis kasus yang ia butuhkan.
 */
export type AssignedComponent = {
  publicId: string;
  code: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: string | null;
  isActive: boolean;
};

export type PenetapanPayload = {
  karyawanId: number;
  payrollComponentId: number;
  value: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type KomponenPayrollOption = {
  id: number;
  code: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: string | null;
};

export const COMPONENT_TYPE_LABEL: Record<ComponentType, string> = {
  EARNING: "Tunjangan",
  DEDUCTION: "Potongan",
};

export const CALCULATION_TYPE_LABEL: Record<CalculationType, string> = {
  FIXED: "Nominal",
  PERCENTAGE: "Persentase",
};

export const COMPONENT_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const COMPONENT_TYPE_FILTER: SelectOption[] = [
  { label: "Semua jenis", value: "" },
  { label: COMPONENT_TYPE_LABEL.EARNING, value: "EARNING" },
  { label: COMPONENT_TYPE_LABEL.DEDUCTION, value: "DEDUCTION" },
];
