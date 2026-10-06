import type { SelectOption } from "@/components/common/control";

export type ContractType = "TETAP" | "KONTRAK" | "PARUH_WAKTU" | "HONORER";

export type ContractPhase = "ACTIVE" | "UPCOMING" | "ENDED";

export type KontrakKaryawan = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  contractType: ContractType;
  position: string;
  basicSalary: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  weeklyDayOff: number[];
  note: string | null;
  karyawan: { publicId: string; code: string; name: string };
};

export type KontrakKaryawanPayload = {
  karyawanId: number;
  contractType: ContractType;
  position: string;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  weeklyDayOff: number[];
  note: string | null;
};

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  TETAP: "Tetap",
  KONTRAK: "Kontrak",
  PARUH_WAKTU: "Paruh waktu",
  HONORER: "Honorer",
};

export const CONTRACT_PHASE_LABEL: Record<ContractPhase, string> = {
  ACTIVE: "Berlaku",
  UPCOMING: "Akan datang",
  ENDED: "Berakhir",
};

export const CONTRACT_PHASE_VARIANT: Record<
  ContractPhase,
  "success" | "wait" | "neutral"
> = {
  ACTIVE: "success",
  UPCOMING: "wait",
  ENDED: "neutral",
};

export const CONTRACT_TYPE_OPTIONS: SelectOption[] = (
  Object.keys(CONTRACT_TYPE_LABEL) as ContractType[]
).map((value) => ({ value, label: CONTRACT_TYPE_LABEL[value] }));

// Senin dulu: karyawan gereja libur Senin/Selasa/Rabu, bukan akhir pekan.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_LABEL: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export const WEEKDAY_OPTIONS: SelectOption[] = WEEKDAY_ORDER.map((day) => ({
  value: String(day),
  label: WEEKDAY_LABEL[day],
}));
