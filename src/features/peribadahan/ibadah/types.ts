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
  typeIbadah: IbadahRelation;
  room: IbadahRelation | null;
  bapel: IbadahRelation | null;
  jadwalPelayan: IbadahRelation | null;
};

export type IbadahPayload = IbadahCounts & {
  typeIbadahId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  theme: string | null;
  bibleVerse: string | null;
  preacher: string | null;
  roomId: number | null;
  bapelId: number | null;
  jadwalPelayanId: number | null;
  note: string | null;
};

export type IbadahSaved = { code: string };
