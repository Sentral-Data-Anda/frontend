import type { FilterChip } from "@/components/common/list";

export type Wilayah = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type WilayahPayload = {
  name: string;
  isActive: boolean;
};

export const WILAYAH_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const WILAYAH_STATUS_CHIPS: FilterChip[] = [
  { label: "Semua", value: "" },
  { label: WILAYAH_STATUS_LABEL.true, value: "aktif" },
  { label: WILAYAH_STATUS_LABEL.false, value: "nonaktif" },
];
