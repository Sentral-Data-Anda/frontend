export type TipeCuti = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
};

export type TipeCutiPayload = {
  name: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
};

export const TIPE_CUTI_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Tidak aktif",
};

export const TIPE_CUTI_PAID_LABEL: Record<"true" | "false", string> = {
  true: "Dibayar",
  false: "Tidak dibayar",
};

export const TIPE_CUTI_QUOTA_LABEL: Record<"true" | "false", string> = {
  false: "Dibatasi",
  true: "Tanpa batas",
};
