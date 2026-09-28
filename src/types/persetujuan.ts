import { formatRupiah } from "@/lib/format";

export const APPROVAL_DOCUMENT_TYPES = [
  "PURCHASE_REQUEST",
  "PROGRAM",
  "PROGRAM_MENDADAK",
  "BUDGET_USAGE_REPORT",
  "CASH_EXPENSE",
  "LEAVE_REQUEST",
  "PAYROLL_RUN",
  "PURCHASE_RETURN",
  "LOAN_ROOM",
  "ASSET_DISPOSAL",
] as const;

export type ApprovalDocumentType = (typeof APPROVAL_DOCUMENT_TYPES)[number];

export const APPROVAL_DOCUMENT_LABEL: Record<ApprovalDocumentType, string> = {
  PURCHASE_REQUEST: "Permintaan pembelian",
  PROGRAM: "Program",
  PROGRAM_MENDADAK: "Program mendadak",
  BUDGET_USAGE_REPORT: "Laporan pemakaian anggaran",
  CASH_EXPENSE: "Kas keluar",
  LEAVE_REQUEST: "Cuti",
  PAYROLL_RUN: "Penggajian",
  PURCHASE_RETURN: "Retur pembelian",
  LOAN_ROOM: "Peminjaman ruang",
  ASSET_DISPOSAL: "Pelepasan barang",
};

export const APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Ditarik",
};

export type AmountUnit = "hari" | "rupiah";

export const amountUnitOf = (type: ApprovalDocumentType): AmountUnit =>
  type === "LEAVE_REQUEST" ? "hari" : "rupiah";

const dayFormat = new Intl.NumberFormat("id-ID");

export const formatApprovalAmount = (
  type: ApprovalDocumentType,
  value: string | number,
): string =>
  amountUnitOf(type) === "hari"
    ? `${dayFormat.format(Number(value))} hari`
    : formatRupiah(Number(value));
