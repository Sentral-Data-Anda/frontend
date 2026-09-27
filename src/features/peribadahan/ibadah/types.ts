import type { IbadahPlaceType } from "@/lib/ibadah-place";

export type IbadahRelation = { id: number; code: string; name: string };

export type IbadahCounts = {
  maleCount: number;
  femaleCount: number;
  childCount: number;
};

export type Ibadah = IbadahCounts & {
  code: string;
  date: string;
  startTime: string;
  endTime: string | null;
  theme: string | null;
  bibleVerse: string | null;
  preacher: string | null;
  note: string | null;
  placeType: IbadahPlaceType;
  placeName: string | null;
  typeIbadah: IbadahRelation;
  room: IbadahRelation | null;
  bapel: IbadahRelation | null;
  jadwalPelayan: IbadahRelation | null;
  hostKeluarga: IbadahRelation | null;
  zoneChurch: IbadahRelation | null;
};

export type IbadahDetail = Ibadah & { address: string | null };

export type IbadahPayload = IbadahCounts & {
  typeIbadahId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  theme: string | null;
  bibleVerse: string | null;
  preacher: string | null;
  placeType: IbadahPlaceType;
  hostKeluargaId: number | null;
  placeName: string | null;
  address: string | null;
  zoneChurchId: number | null;
  roomId: number | null;
  bapelId: number | null;
  jadwalPelayanId: number | null;
  note: string | null;
};

export type IbadahSaved = { code: string };

export type HostSuggestion = IbadahRelation & { lastHostedDate: string | null };

export type KeluargaAddress = {
  id: number;
  address: string;
  zoneChurch: (IbadahRelation & { isActive: boolean }) | null;
};
