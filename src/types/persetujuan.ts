import { MENU, detailHref, menuHref, type MenuSlug } from "@/config/menu";
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

export const APPROVAL_DOCUMENT_MENU: Partial<
  Record<ApprovalDocumentType, MenuSlug>
> = {
  PURCHASE_REQUEST: MENU.PERMINTAAN_PEMBELIAN,
  ASSET_DISPOSAL: MENU.SIKLUS_ASET,
  CASH_EXPENSE: MENU.KAS_KELUAR,
  PROGRAM: MENU.PROGRAM,
  PROGRAM_MENDADAK: MENU.PROGRAM,
  BUDGET_USAGE_REPORT: MENU.LAPORAN_BUDGET,
};

export type ApprovalDocumentRef = { publicId: string; code: string };

// Kunci rute berbeda per modul be-sada: Permintaan Pembelian dan Pelepasan memakai
// kode, Kas Keluar dan ketiga dokumen Anggaran memakai publicId.
export const approvalDocumentHref = (
  type: ApprovalDocumentType,
  document: ApprovalDocumentRef,
): string | null => {
  if (type === "PURCHASE_REQUEST") {
    return detailHref(MENU.PENGADAAN, MENU.PERMINTAAN_PEMBELIAN, document.code);
  }

  if (type === "ASSET_DISPOSAL") {
    return `${menuHref(MENU.INVENTARIS, MENU.SIKLUS_ASET)}/pelepasan/${encodeURIComponent(document.code)}`;
  }

  if (type === "CASH_EXPENSE") {
    return detailHref(MENU.KEUANGAN, MENU.KAS_KELUAR, document.publicId);
  }

  if (type === "PROGRAM" || type === "PROGRAM_MENDADAK") {
    return detailHref(MENU.ANGGARAN, MENU.PROGRAM, document.publicId);
  }

  if (type === "BUDGET_USAGE_REPORT") {
    return detailHref(MENU.ANGGARAN, MENU.LAPORAN_BUDGET, document.publicId);
  }

  return null;
};
