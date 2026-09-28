/**
 * State mock bersama grup Pelayanan (docs/design/pelayanan/README.md §4 TL-4).
 * Setiap handler hanya mengubah lariknya sendiri; membaca larik lain boleh.
 * Hapus = isi `deletedAt` (be-sada hapus lunak; relasi lama tetap bernama).
 *
 * Seed mengikuti aturan simpan be-sada: bapel slot = bapel jadwal, pelayan
 * memegang tugas slotnya, alat milik pelayan. Yang sengaja disiapkan:
 * - Christian Wijaya (jemaat 3) terdaftar di Majelis (pelayan 3) dan Komisi
 *   Pemuda (pelayan 9), dan anggota Band Pemuda → bentrok per jemaat (R1/R2);
 * - Gideon (pelayan 7) nonaktif; Debora (pelayan 4) tidak ada di jadwal mana pun;
 * - Bethari (pelayan 2) terjadwal Minggu depan (jadwal 2);
 * - jadwal 1 = tanggal dan jam ibadah Minggu I mock Ibadah yang menautnya;
 * - jadwal 4 (Komisi Pemuda 09:00–11:00) memakai Christian → ia bentrok di jadwal 2.
 * Tidak ada jemaat yang muncul dua kali dalam satu jadwal (aturan 6 be-sada), jadi
 * PUT jadwal seed tanpa perubahan lolos: Paduan Suara Efrata tanpa Kevin, dan
 * Multimedia jadwal 3 kosong karena Eleazar sudah ikut lewat Band Pemuda.
 */
import { addDays, todayJakarta } from "../../src/lib/date";
import { BAPEL_NAMES, DDL_JEMAAT } from "../mock-dashboard";

type Live = { id: number; deletedAt: string | null };

export type RolePelayanRow = Live & { name: string };

export type MusikSkillRow = Live & { name: string };

export type PelayanRow = Live & {
  code: string;
  jemaatId: number;
  bapelId: number;
  roleIds: number[];
  skillIds: number[];
  status: boolean;
};

export type GroupPelayanRow = Live & {
  code: string;
  name: string;
  phone: string;
  bapelId: number;
  rolePelayanId: number;
  skillIds: number[];
  memberIds: number[];
  status: boolean;
};

export type TemplateSlot = { order: number; rolePelayanId: number };

export type TemplateJadwalRow = Live & {
  code: string;
  name: string;
  bapelId: number;
  startTime: string;
  endTime: string;
  detail: TemplateSlot[];
};

export type JadwalSlot = TemplateSlot & {
  pelayanId: number | null;
  musikSkillId: number | null;
  groupPelayanId: number | null;
};

export type JadwalPelayanRow = Live & {
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  bapelId: number;
  detail: JadwalSlot[];
};

const TODAY = todayJakarta();

const weekdayOf = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

// Sama dengan `lastWeekday(0)` mock Ibadah: hari ini Minggu → sepekan lalu.
export const LAST_SUNDAY = addDays(TODAY, -(weekdayOf(TODAY) % 7 || 7));

export const NEXT_SUNDAY = addDays(TODAY, (7 - weekdayOf(TODAY)) % 7 || 7);

export const isLive = <T extends Live>(row: T) => row.deletedAt === null;

export const nextId = (rows: readonly Live[]) =>
  Math.max(0, ...rows.map((row) => row.id)) + 1;

export const bapelKey = (bapelId: number) => String(bapelId).padStart(4, "0");

export const jemaatOf = (id: number) => DDL_JEMAAT.find((row) => row.id === id);

export const bapelOf = (id: number) => {
  const name = BAPEL_NAMES[id - 1];

  return name ? { id, code: `BPL-${id}`, name } : undefined;
};

const MAJELIS = 1;
const KOMISI_PEMUDA = 2;

const LITURGIS = 1;
const PEMUSIK = 2;
const PEMANDU = 3;
const SINGER = 4;
const MULTIMEDIA = 5;
const PENERIMA_TAMU = 6;
const KOLEKTAN = 7;

const KEYBOARD = 1;
const GITAR = 2;
const BASS = 3;
const DRUM = 4;

const master = (names: string[]) =>
  names.map((name, index) => ({ id: index + 1, name, deletedAt: null }));

export const ROLE_PELAYAN: RolePelayanRow[] = master([
  "Liturgis",
  "Pemusik",
  "Pemandu Pujian",
  "Singer",
  "Multimedia",
  "Penerima Tamu",
  "Kolektan",
]);

export const MUSIK_SKILL: MusikSkillRow[] = master([
  "Keyboard",
  "Gitar",
  "Bass",
  "Drum",
  "Biola",
]);

const perBapel = new Map<string, number>();

const codeOf = (prefix: string, bapelId: number) => {
  const key = `${prefix}_${bapelKey(bapelId)}`;
  const serial = (perBapel.get(key) ?? 0) + 1;

  perBapel.set(key, serial);

  return `${key}-${String(serial).padStart(4, "0")}`;
};

export const pelayanCodeOf = (bapelId: number) => codeOf("PLYN", bapelId);

export const groupCodeOf = (bapelId: number) => codeOf("GPLYN", bapelId);

export const templateCodeOf = (bapelId: number) => codeOf("TMP_JDL", bapelId);

export const jadwalCodeOf = (bapelId: number, date: string) =>
  codeOf("JDL", bapelId).replace(/-(\d{4})$/, `-${date.slice(0, 4)}-$1`);

const pelayan = (
  id: number,
  jemaatId: number,
  bapelId: number,
  roleIds: number[],
  skillIds: number[] = [],
  status = true,
): PelayanRow => ({
  id,
  code: pelayanCodeOf(bapelId),
  jemaatId,
  bapelId,
  roleIds,
  skillIds,
  status,
  deletedAt: null,
});

export const PELAYAN: PelayanRow[] = [
  pelayan(1, 1, MAJELIS, [LITURGIS]),
  pelayan(2, 2, MAJELIS, [PEMUSIK, SINGER], [KEYBOARD]),
  pelayan(3, 3, MAJELIS, [PEMUSIK], [GITAR, BASS]),
  pelayan(4, 4, MAJELIS, [PENERIMA_TAMU, KOLEKTAN]),
  pelayan(5, 5, KOMISI_PEMUDA, [MULTIMEDIA]),
  pelayan(6, 6, MAJELIS, [PEMANDU, SINGER]),
  pelayan(7, 7, MAJELIS, [PEMUSIK], [DRUM], false),
  pelayan(8, 8, KOMISI_PEMUDA, [PEMANDU]),
  pelayan(9, 3, KOMISI_PEMUDA, [PEMUSIK], [GITAR]),
  pelayan(10, 11, MAJELIS, [MULTIMEDIA]),
  pelayan(11, 12, MAJELIS, [PENERIMA_TAMU, KOLEKTAN]),
];

export const GROUP_PELAYAN: GroupPelayanRow[] = [
  {
    id: 1,
    code: groupCodeOf(MAJELIS),
    name: "Paduan Suara Efrata",
    phone: "081234567890",
    bapelId: MAJELIS,
    rolePelayanId: SINGER,
    skillIds: [],
    memberIds: [7, 9, 10],
    status: true,
    deletedAt: null,
  },
  {
    id: 2,
    code: groupCodeOf(KOMISI_PEMUDA),
    name: "Band Pemuda",
    phone: "081298765432",
    bapelId: KOMISI_PEMUDA,
    rolePelayanId: PEMUSIK,
    skillIds: [KEYBOARD, GITAR],
    memberIds: [3, 5, 12],
    status: true,
    deletedAt: null,
  },
];

const slots = (roleIds: number[]): TemplateSlot[] =>
  roleIds.map((rolePelayanId, index) => ({ order: index + 1, rolePelayanId }));

const MINGGU_PAGI = [
  LITURGIS,
  PEMANDU,
  PEMUSIK,
  PEMUSIK,
  SINGER,
  MULTIMEDIA,
  PENERIMA_TAMU,
  KOLEKTAN,
];

export const TEMPLATE_JADWAL: TemplateJadwalRow[] = [
  {
    id: 1,
    code: templateCodeOf(MAJELIS),
    name: "Ibadah Minggu Pagi",
    bapelId: MAJELIS,
    startTime: "07:30",
    endTime: "10:00",
    detail: slots(MINGGU_PAGI),
    deletedAt: null,
  },
  {
    id: 2,
    code: templateCodeOf(KOMISI_PEMUDA),
    name: "Ibadah Pemuda",
    bapelId: KOMISI_PEMUDA,
    startTime: "17:00",
    endTime: "19:00",
    detail: slots([PEMANDU, PEMUSIK, MULTIMEDIA]),
    deletedAt: null,
  },
];

type Fill = { pelayan?: number; skill?: number; group?: number } | null;

const filled = (roleIds: number[], fills: Fill[]): JadwalSlot[] =>
  slots(roleIds).map((slot, index) => ({
    ...slot,
    pelayanId: fills[index]?.pelayan ?? null,
    musikSkillId: fills[index]?.skill ?? null,
    groupPelayanId: fills[index]?.group ?? null,
  }));

const jadwal = (
  id: number,
  name: string,
  date: string,
  bapelId: number,
  [startTime, endTime]: [string, string],
  detail: JadwalSlot[],
): JadwalPelayanRow => ({
  id,
  code: jadwalCodeOf(bapelId, date),
  name,
  date,
  startTime,
  endTime,
  bapelId,
  detail,
  deletedAt: null,
});

export const JADWAL_PELAYAN: JadwalPelayanRow[] = [
  jadwal(
    1,
    "Pelayan Ibadah Minggu I",
    LAST_SUNDAY,
    MAJELIS,
    ["07:30", "10:00"],
    filled(MINGGU_PAGI, [
      { pelayan: 1 },
      { pelayan: 6 },
      { pelayan: 2, skill: KEYBOARD },
      { pelayan: 3, skill: GITAR },
      { group: 1 },
      { pelayan: 10 },
      { pelayan: 11 },
      null,
    ]),
  ),
  jadwal(
    2,
    "Pelayan Ibadah Minggu I",
    NEXT_SUNDAY,
    MAJELIS,
    ["07:30", "10:00"],
    filled(MINGGU_PAGI, [
      { pelayan: 1 },
      { pelayan: 6 },
      { pelayan: 2, skill: KEYBOARD },
      null,
      null,
      { pelayan: 10 },
      { pelayan: 11 },
      null,
    ]),
  ),
  jadwal(
    3,
    "Pelayan Ibadah Pemuda",
    NEXT_SUNDAY,
    KOMISI_PEMUDA,
    ["17:00", "19:00"],
    filled(
      [PEMANDU, PEMUSIK, MULTIMEDIA],
      [{ pelayan: 8 }, { group: 2 }, null],
    ),
  ),
  jadwal(
    4,
    "Persekutuan Pemuda Pagi",
    NEXT_SUNDAY,
    KOMISI_PEMUDA,
    ["09:00", "11:00"],
    filled([PEMUSIK], [{ pelayan: 9, skill: GITAR }]),
  ),
];
