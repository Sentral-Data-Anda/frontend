export type TemplateJadwalListItem = {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  bapel: string;
  detail: { order: number; roleName: string }[];
};

export type TemplateSlot = { order: number; rolePelayanId: number };

export type TemplateJadwalDetail = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  bapel: { id: number; code: string; name: string };
  detail: TemplateSlot[];
};

export type TemplateJadwalPayload = {
  bapelId: number;
  name: string;
  startTime: string;
  endTime: string;
  detail: TemplateSlot[];
};

export type TemplateJadwalSaved = { code: string; name: string };
