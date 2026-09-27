import type { SelectOption } from "@/components/common/control";

export type TipeIbadah = {
  code: string;
  name: string;
  isActive: boolean;
};

export type TipeIbadahPayload = {
  name: string;
  isActive: boolean;
};

export const TIPE_IBADAH_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const TIPE_IBADAH_STATUS_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: TIPE_IBADAH_STATUS_LABEL.true, value: "aktif" },
  { label: TIPE_IBADAH_STATUS_LABEL.false, value: "nonaktif" },
];
