import type { ApprovalView } from "@/components/common/display";

export type PayrollStatus =
  "DRAFT" | "CALCULATED" | "APPROVED" | "PAID" | "CANCELLED";

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  DRAFT: "Draf",
  CALCULATED: "Dihitung",
  APPROVED: "Disetujui",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

export const PAYROLL_STATUS_VARIANT: Record<
  PayrollStatus,
  "draft" | "wait" | "success" | "neutral"
> = {
  DRAFT: "draft",
  CALCULATED: "wait",
  APPROVED: "success",
  PAID: "success",
  CANCELLED: "neutral",
};

export type PayrollRun = {
  id: number;
  publicId: string;
  code: string;
  year: number;
  month: number;
  status: PayrollStatus;
  totalGross: string;
  totalDeduction: string;
  totalNet: string;
  approvedAt: string | null;
  paidAt: string | null;
};

export type PayslipLine = {
  publicId: string;
  payrollComponentId: number;
  componentName: string;
  componentType: "EARNING" | "DEDUCTION";
  amount: string;
};

export type Payslip = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  basicSalary: string;
  grossAmount: string;
  deductionTotal: string;
  netAmount: string;
  note: string | null;
  karyawan: { publicId: string; code: string; name: string };
  lines: PayslipLine[];
};

export type PayrollRunDetail = PayrollRun & {
  payslips: Payslip[];
  /**
   * Keduanya MENDAHULUI be-sada `bc20690`: `findByCode` hanya meng-`include`
   * `payslips`, jadi di produksi hari ini keduanya `undefined`. Layar turun ke
   * status polos dan ke panel jurnal yang tidak mengklaim apa pun, bukan ke
   * panel kosong. SG-FE1 dan SG-FE2 di laporan.
   */
  approval?: ApprovalView | null;
  journal?: { publicId: string; code: string } | null;
};

export type PayrollPayload = { year: number; month: number };

/** `markPaid` menjawab run beserta entry yang baru ditulisnya. */
export type PayrollPaid = PayrollRunDetail & { journal?: { code: string } };

export type PayrollAction = "hitung" | "pengajuan" | "bayar" | "batal";
