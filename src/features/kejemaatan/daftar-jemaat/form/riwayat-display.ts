import { SACRAMENT_TYPE_LABEL, type SacramentType } from "../types";

export const sacramentLabel = (type: string): string | null =>
  SACRAMENT_TYPE_LABEL[type as SacramentType] ?? null;

export const riwayatTitle = (type: string, index: number): string =>
  sacramentLabel(type) ?? `Riwayat ${index + 1}`;
