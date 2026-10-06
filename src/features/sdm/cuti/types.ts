import type { ApprovalStatus } from "@/types/persetujuan";

export type CutiStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export const CUTI_STATUS_LABEL: Record<CutiStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export type CutiKaryawan = {
  publicId: string;
  code: string;
  name: string;
  position: string;
};

export type CutiLeaveType = {
  publicId: string;
  code: string;
  name: string;
  isPaid: boolean;
  maxDaysPerYear: number | null;
};

export type CutiApprovalStep = {
  order: number;
  approverRoleName: string;
  status: ApprovalStatus;
  note: string | null;
  actedAt: string | null;
  actor: { name: string } | null;
};

export type CutiApproval = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  currentOrder: number;
  steps: CutiApprovalStep[];
};

export type Cuti = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: string;
  /**
   * Data kesehatan dan keluarga (SDM README §0.3 no. 4). Ia ada di respons
   * daftar karena be-sada mengembalikan semua skalar, dan tetap tidak boleh
   * dirender di baris, kolom, atau tooltip — hanya di halaman detail.
   */
  reason: string;
  status: CutiStatus;
  /**
   * Kolom nyata di `leave_request`, ditulis mesin persetujuan saat ditolak.
   * Ia sampai ke layar tanpa menunggu SC-FE1, dan dirender penuh.
   */
  rejectedReason: string | null;
  approvedAt: string | null;
  karyawan: CutiKaryawan;
  leaveType: CutiLeaveType;
  /**
   * be-sada `9b94577` belum mengirimnya di jalur baca cuti — SC-FE1. Tanpa ia
   * layar turun ke status polos, bukan ke panel kosong.
   */
  approval?: CutiApproval | null;
};

export type CutiPayload = {
  karyawanId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  reason: string;
};

export type RemainingQuota = {
  karyawan: { name: string };
  leaveType: { name: string };
  year: number;
  maxDaysPerYear: number | null;
  taken: string;
  remaining: string | null;
};

export type HolidayType = "NASIONAL" | "CUTI_BERSAMA" | "GEREJA";

export type HolidayDay = {
  date: string;
  name: string;
  type: HolidayType;
};
