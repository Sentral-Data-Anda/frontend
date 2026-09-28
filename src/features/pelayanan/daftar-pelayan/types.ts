import type { SelectOption } from "@/components/common/control";
import type { ApiResponse } from "@/types/api";

export type TypePelayan = "INDIVIDUAL" | "GROUP";

export type PelayanListItem = {
  code: string;
  typePelayan: TypePelayan;
  namePelayan: string;
  genderPelayan: string | null;
  bapel: string;
  role: string[];
  members: string[];
  musikSkill: string[];
  status: boolean;
};

export type JemaatRef = { id: number; code: string; name: string };

export type PelayanDetail = {
  code: string;
  typePelayan: TypePelayan;
  jemaatId: string | null;
  name: string | null;
  phone: string | null;
  bapelId: string;
  rolePelayan: string[];
  members: string[];
  musikSkill: string[];
  status: boolean;
  jemaat: JemaatRef | null;
  memberList: JemaatRef[];
};

export type PelayanPayload = {
  typePelayan: TypePelayan;
  bapelId: number;
  jemaatId: number | null;
  name: string | null;
  phone: string | null;
  members: number[];
  rolePelayan: number[];
  isPemusik: boolean;
  musikSkill: number[];
  status: boolean;
};

export type FutureSlot = {
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  bapel: { name: string };
};

export type PelayanSaved = ApiResponse<{ code: string }> & {
  futureSlots?: FutureSlot[];
};

export const TYPE_PELAYAN_LABEL: Record<TypePelayan, string> = {
  INDIVIDUAL: "Perorangan",
  GROUP: "Kelompok",
};

export const PELAYAN_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const PELAYAN_STATUS_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: PELAYAN_STATUS_LABEL.true, value: "aktif" },
  { label: PELAYAN_STATUS_LABEL.false, value: "nonaktif" },
];
