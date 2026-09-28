export type IbadahLink = {
  code: string;
  date: string;
  startTime: string;
  typeIbadah: { name: string };
};

export type JadwalPelayan = {
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  bapel: { name: string };
  detail: { order: number; role: string; pelayan: string }[];
  ibadah: IbadahLink[];
};

export type SlotPelayan = {
  value: string;
  name: string;
  isGroup: boolean;
  isActive: boolean;
};

export type JadwalSlot = {
  order: number;
  rolePelayanId: string;
  pelayanId: string;
  role: { id: number; name: string };
  pelayan: SlotPelayan | null;
};

export type JadwalPelayanDetail = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  bapel: { id: number; code: string; name: string };
  detail: JadwalSlot[];
  ibadah: IbadahLink[];
};

export type SlotPayload = {
  pelayanId: number | null;
  musikSkillId: number | null;
  groupPelayanId: number | null;
};

export type JadwalPelayanPayload = {
  bapelId: number;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  makeTemplate: boolean;
  detail: (SlotPayload & { order: number; rolePelayanId: number })[];
};

export type JadwalPelayanSaved = { code: string };

export type PelayanOption = {
  typePelayan: "INDIVIDUAL" | "GROUP";
  code: string;
  name: string;
  bapelName: string;
  jemaatId?: string;
  disableServe: boolean;
  unavailableReason: string | null;
};

export type TemplateOption = {
  id: number;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  detail: { order: number; rolePelayanId: number }[];
};
