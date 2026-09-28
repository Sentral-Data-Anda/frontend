/**
 * State mock bersama grup Fasilitas (docs/design/fasilitas/README.md §4a TL-3).
 * `ROOM` adalah larik `ROOM_ROWS` yang sama, diperluas di tempat, supaya Ibadah,
 * Event, dan ddl ikut melihat ruang baru. Hapus = isi `deletedAt`. Tanggal
 * relatif hari ini (WIB). Bentuk respons = bentuk be-sada sesudah gap B1, B10–B13,
 * B16, B19, B20.
 *
 * Yang sengaja disiapkan:
 * - Ruang Pemuda tanpa foto; foto utama Konsistori hilang (gagal muat);
 *   Kelas Sekolah Minggu nonaktif; Perpustakaan terhapus;
 * - dua peminjaman Aula besok yang bersebelahan (10.00–12.00, 12.00–14.00);
 * - pernikahan tanpa badan pelayanan; latihan paduan suara tiap minggu;
 * - Konsistori punya peminjaman mendatang (tidak bisa dihapus, B3).
 */
import { addDays, todayJakarta } from "../../src/lib/date";
import { formatTimeRange } from "../../src/lib/format";
import type { ServerAttachment } from "../../src/types/attachment";
import { ROOM_ROWS } from "../mock-dashboard";

import { ibadahInRoom } from "./handlers/ibadah";
import { EVENT } from "./kegiatan-store";
import { mediaUrl, seedImage } from "./media";
import { bapelKey, bapelOf, isLive, jemaatOf, nextId } from "./pelayanan-store";

export { bapelOf, isLive, jemaatOf, nextId };

export type RoomPhoto = {
  publicId: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

export type RoomRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  deletedAt: string | null;
  mainImage: RoomPhoto | null;
  detailImage: RoomPhoto[];
};

export type LoanRow = {
  id: number;
  publicId: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  roomId: number;
  bapelId: number | null;
  jemaatId: number;
  deletedAt: string | null;
};

export type OccupancyKind = "LOAN" | "IBADAH" | "EVENT";

export type Occupancy = {
  kind: OccupancyKind;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  bapel: { name: string } | null;
};

export const TODAY = todayJakarta();

const YEAR = TODAY.slice(0, 4);

const day = (offset: number) => addDays(TODAY, offset);

const iso = (key: string) => `${key}T00:00:00.000Z`;

const uuid = (group: string, id: number) =>
  `00000000-0000-4000-${group}-${String(id).padStart(12, "0")}`;

let photoCount = 0;

export const roomPhoto = (
  label: string,
  options: { hue: number; isMissing?: boolean },
): RoomPhoto => {
  photoCount += 1;
  const path = `room/seed-${photoCount}.jpeg`;

  return {
    publicId: uuid("b000", photoCount),
    path,
    name: label,
    mimeType: "image/jpeg",
    size: options.isMissing ? 240_000 : seedImage(path, label, options.hue),
  };
};

export const roomPhotoView = (photo: RoomPhoto): ServerAttachment => ({
  publicId: photo.publicId,
  name: photo.name,
  mimeType: photo.mimeType,
  size: photo.size,
  showOnWebsite: false,
  url: mediaUrl(photo.path),
});

const photos = (label: string, hue: number, count: number) =>
  Array.from({ length: count }, (_, index) =>
    roomPhoto(`${label} ${index + 1}`, { hue: hue + index * 23 }),
  );

type RoomSeed = Omit<RoomRow, "id" | "code" | "name" | "publicId">;

const SEED: Record<string, RoomSeed> = {
  "Gedung Gereja": {
    capacity: 400,
    isActive: true,
    deletedAt: null,
    mainImage: roomPhoto("Gedung Gereja", { hue: 210 }),
    detailImage: photos("Gedung Gereja", 220, 3),
  },
  "Aula Serbaguna": {
    capacity: 150,
    isActive: true,
    deletedAt: null,
    mainImage: roomPhoto("Aula Serbaguna", { hue: 30 }),
    detailImage: photos("Aula Serbaguna", 40, 2),
  },
  "Ruang Pemuda": {
    capacity: 30,
    isActive: true,
    deletedAt: null,
    mainImage: null,
    detailImage: [],
  },
};

const room = (id: number, name: string, seed: RoomSeed): RoomRow => ({
  id,
  publicId: uuid("c000", id),
  code: `RM-${String(id).padStart(4, "0")}`,
  name,
  ...seed,
});

export const ROOM = ROOM_ROWS as RoomRow[];

for (const row of ROOM)
  Object.assign(row, room(row.id, row.name, SEED[row.name]));

ROOM.push(
  room(4, "Konsistori", {
    capacity: 12,
    isActive: true,
    deletedAt: null,
    mainImage: roomPhoto("Konsistori", { hue: 0, isMissing: true }),
    detailImage: [],
  }),
  room(5, "Kelas Sekolah Minggu", {
    capacity: 40,
    isActive: false,
    deletedAt: null,
    mainImage: roomPhoto("Kelas Sekolah Minggu", { hue: 120 }),
    detailImage: [],
  }),
  room(6, "Perpustakaan", {
    capacity: 20,
    isActive: true,
    deletedAt: `${day(-40)}T02:00:00.000Z`,
    mainImage: null,
    detailImage: [],
  }),
);

export const roomOf = (id: number) =>
  ROOM.find((row) => row.id === id && isLive(row));

export const roomCodeOf = () => `RM-${String(nextId(ROOM)).padStart(4, "0")}`;

export const loanCodeOf = (
  roomId: number,
  bapelId: number | null,
  year: string = YEAR,
) => {
  const prefix = `LR_${String(roomId).padStart(4, "0")}_${bapelId === null ? "0000" : bapelKey(bapelId)}-${year}-`;
  const count = LOAN.filter((row) => row.code.startsWith(prefix)).length;

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const GEDUNG = 1;
const AULA = 2;
const KONSISTORI = 4;

const MAJELIS = 1;
const PEMUDA = 2;
const WANITA = 3;
const ANAK = 4;
const MUSIK = 5;

export const LOAN: LoanRow[] = [];

const loan = (
  offset: number,
  roomId: number,
  startTime: string,
  endTime: string,
  purpose: string,
  bapelId: number | null,
  jemaatId: number,
  isDeleted = false,
) => {
  const id = LOAN.length + 1;
  const date = day(offset);

  LOAN.push({
    id,
    publicId: uuid("d000", id),
    code: loanCodeOf(roomId, bapelId, date.slice(0, 4)),
    date,
    startTime,
    endTime,
    purpose,
    roomId,
    bapelId,
    jemaatId,
    deletedAt: isDeleted ? `${day(-1)}T02:00:00.000Z` : null,
  });
};

loan(-25, GEDUNG, "13:00", "15:00", "Penghiburan keluarga Siregar", null, 7);
loan(-20, AULA, "09:00", "12:00", "Pelatihan guru sekolah minggu", ANAK, 5);
loan(0, AULA, "06:00", "07:30", "Senam pagi lansia", WANITA, 4);
loan(0, AULA, "19:00", "21:00", "Latihan paduan suara", MUSIK, 2);
loan(1, AULA, "10:00", "12:00", "Rapat pengurus Komisi Wanita", WANITA, 4);
loan(1, AULA, "12:00", "14:00", "Kelas katekisasi", PEMUDA, 3);
loan(1, AULA, "15:00", "17:00", "Rapat panitia bazar", MAJELIS, 1, true);
loan(2, KONSISTORI, "10:00", "12:00", "Konseling pranikah", MAJELIS, 6);
loan(
  3,
  GEDUNG,
  "10:00",
  "13:00",
  "Pemberkatan nikah Sihombing & Tambunan (keluarga, 0812 3456 7890)",
  null,
  8,
);
loan(7, AULA, "19:00", "21:00", "Latihan paduan suara", MUSIK, 2);
loan(14, AULA, "19:00", "21:00", "Latihan paduan suara", MUSIK, 2);
loan(30, KONSISTORI, "18:00", "20:00", "Rapat panitia Natal", MAJELIS, 1);

const relationOf = (
  value: { code: string; name: string } | undefined,
  isDetail: boolean,
  id: number,
) =>
  value
    ? isDetail
      ? { id, code: value.code, name: value.name }
      : { code: value.code, name: value.name }
    : null;

export const loanView = (row: LoanRow, isDetail = false) => ({
  publicId: row.publicId,
  code: row.code,
  date: iso(row.date),
  startTime: row.startTime,
  endTime: row.endTime,
  purpose: row.purpose,
  room: relationOf(
    ROOM.find((item) => item.id === row.roomId),
    isDetail,
    row.roomId,
  ),
  bapel:
    row.bapelId === null
      ? null
      : relationOf(bapelOf(row.bapelId), isDetail, row.bapelId),
  jemaat: relationOf(jemaatOf(row.jemaatId), isDetail, row.jemaatId),
});

export const listLoans = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const roomId = Number(params.get("roomId")) || null;
  const bapelId = Number(params.get("bapelId")) || null;
  const date = params.get("date")?.slice(0, 10);
  const start = params.get("startDate")?.slice(0, 10);
  const end = params.get("endDate")?.slice(0, 10);
  const matches = (text: string | undefined) =>
    (text ?? "").toLowerCase().includes(filter);

  return LOAN.filter(isLive)
    .filter(
      (row) =>
        !filter ||
        matches(row.code) ||
        matches(row.purpose) ||
        (row.bapelId !== null && matches(bapelOf(row.bapelId)?.name)) ||
        matches(jemaatOf(row.jemaatId)?.name) ||
        matches(ROOM.find((item) => item.id === row.roomId)?.name),
    )
    .filter((row) => roomId === null || row.roomId === roomId)
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .filter((row) => !date || row.date === date)
    .filter((row) => !start || row.date >= start)
    .filter((row) => !end || row.date <= end)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.startTime.localeCompare(b.startTime) ||
        a.id - b.id,
    )
    .map((row) => loanView(row));
};

const plusHours = (time: string, hours: number) => {
  const minutes = Math.min(
    23 * 60 + 59,
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + hours * 60,
  );

  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

// Sementara (B12/B16): ibadah tanpa jam selesai = 2 jam; event tanpa jam
// selesai = sampai 23.59; event beberapa hari berlaku tiap hari.
export const occupancyOf = (roomId: number, date: string): Occupancy[] =>
  [
    ...LOAN.filter(
      (row) => isLive(row) && row.roomId === roomId && row.date === date,
    ).map((row) => ({
      kind: "LOAN" as const,
      code: row.code,
      name: row.purpose,
      startTime: row.startTime,
      endTime: row.endTime,
      bapel:
        row.bapelId === null
          ? null
          : { name: bapelOf(row.bapelId)?.name ?? "" },
    })),
    ...ibadahInRoom(roomId, date, date).map((row) => ({
      kind: "IBADAH" as const,
      code: row.code,
      name: row.name,
      startTime: row.startTime,
      endTime: row.endTime ?? plusHours(row.startTime, 2),
      bapel: null,
    })),
    ...EVENT.filter(
      (row) =>
        isLive(row) &&
        row.roomId === roomId &&
        row.startDate <= date &&
        row.endDate >= date,
    ).map((row) => ({
      kind: "EVENT" as const,
      code: row.code,
      name: row.name,
      startTime: row.startTime,
      endTime: row.endTime ?? "23:59",
      bapel: null,
    })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

export const isOverlap = (
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) => a.startTime < b.endTime && b.startTime < a.endTime;

export const clashesOf = (input: {
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  excludeCode?: string;
}) =>
  occupancyOf(input.roomId, input.date).filter(
    (item) =>
      isOverlap(item, input) &&
      !(
        item.kind === "LOAN" &&
        input.excludeCode !== undefined &&
        item.code.toLowerCase() === input.excludeCode.toLowerCase()
      ),
  );

const KIND_LABEL: Record<OccupancyKind, string> = {
  LOAN: "Peminjaman",
  IBADAH: "Ibadah",
  EVENT: "Event",
};

export const clashMessage = (item: Occupancy) =>
  `Ruang Sudah Dipakai ${KIND_LABEL[item.kind]} ${item.name} Pukul ${formatTimeRange(item.startTime, item.endTime)}`;

export const roomUsageOf = (roomId: number, from: string, days: number) =>
  Array.from({ length: days }, (_, index) => addDays(from, index))
    .flatMap((date) =>
      occupancyOf(roomId, date).map(
        ({ kind, code, name, startTime, endTime }) => ({
          kind,
          code,
          name,
          date: iso(date),
          startTime,
          endTime,
        }),
      ),
    )
    .slice(0, 50);

export const upcomingCountsOf = (roomId: number, from: string) => ({
  loans: LOAN.filter(
    (row) => isLive(row) && row.roomId === roomId && row.date >= from,
  ).length,
  events: EVENT.filter(
    (row) => isLive(row) && row.roomId === roomId && row.endDate >= from,
  ).length,
  ibadah: ibadahInRoom(roomId, from).length,
});

export const roomDdl = () =>
  ROOM.filter(isLive)
    .map(({ id, code, name, isActive }) => ({ id, code, name, isActive }))
    .sort((a, b) => a.name.localeCompare(b.name));
