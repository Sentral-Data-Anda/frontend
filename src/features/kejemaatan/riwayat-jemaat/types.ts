import type { SacramentType } from "@/types/jemaat";

export { SACRAMENT_TYPE_LABEL, type SacramentType } from "@/types/jemaat";

export type RiwayatJemaat = {
  id: string;
  type: SacramentType;
  typeLabel: string;
  date: string;
  certificateNumber: string | null;
  place: string | null;
  jemaat: { code: string; name: string };
};

export type RiwayatJemaatPayload = {
  jemaatCode: string;
  type: SacramentType;
  date: string;
  certificateNumber: string | null;
  place: string | null;
};

export type RiwayatJemaatSaved = Omit<RiwayatJemaat, "id" | "typeLabel"> & {
  publicId: string;
};
