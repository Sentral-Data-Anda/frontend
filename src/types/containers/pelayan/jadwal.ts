export interface DetailJadwal {
  order: number;
  rolePelayanId: string | null;
  isLoadingPelayan: boolean;
  pelayanId?: string | null;
  groupPelayanId?: string | null;
  musikSkillId?: string | null;
}

export interface FormJadwalPelayan {
  bapelId: string | null;
  date: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
  makeTemplate: boolean;
  detail: DetailJadwal[];
}

export interface DetailListJadwal {
  order: number;
  role: string;
  pelayan: string;
}

export interface ListJadwalPelayan {
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  detail: DetailListJadwal[];
}
