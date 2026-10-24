import type { SelectOption } from "@/components/common/control";

export type EndReason = "CERAI_HIDUP" | "CERAI_MATI";

export const END_REASON_LABEL: Record<EndReason, string> = {
  CERAI_HIDUP: "Cerai hidup",
  CERAI_MATI: "Cerai mati",
};

export type DeceasedSide = "SUAMI" | "ISTRI";

export const DECEASED_SIDE_LABEL: Record<DeceasedSide, string> = {
  SUAMI: "Suami",
  ISTRI: "Istri",
};

export type MarriageParty = {
  jemaatCode: string | null;
  name: string;
};

export type MarriageDetail = {
  id: string;
  husband: MarriageParty;
  wife: MarriageParty;
  marriedAt: string | null;
  marriedPlace: string | null;
  blessedHere: boolean;
  endedAt: string | null;
  endReason: EndReason | null;
  endNote: string | null;
};

export type MarriageListItem = MarriageDetail;

export const MARRIAGE_STATUS_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: "Aktif", value: "AKTIF" },
  { label: "Berakhir", value: "BERAKHIR" },
];

export type MarriagePayload = {
  husbandJemaatCode: string | null;
  husbandName: string | null;
  wifeJemaatCode: string | null;
  wifeName: string | null;
  marriedAt: string | null;
  marriedPlace: string | null;
  blessedHere: boolean;
};

export type EndMarriagePayload = {
  endedAt: string;
  endReason: EndReason;
  // Only a death closes the dead spouse's household membership with it, so
  // only a death says which side it was.
  deceased?: DeceasedSide;
  endNote: string | null;
};

export type MarriageSaved = { publicId: string };
