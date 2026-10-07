/**
 * Tiruan `/api/v1/ibadah` (be-sada modul `ibadah`, `24add68`). Dipanggil sebelum
 * cabang bawaan `dev-mock.ts`, jadi juga menjawab `/ibadah` yang dibaca Beranda
 * (`?date=` Hari ini, `?startDate&endDate` Agenda pekan).
 *
 *   MOCK_EMPTY=1                  → daftar kosong (404 "Ibadah Tidak Ditemukan")
 *   MOCK_500=1                    → daftar menjawab 500 (Beranda ikut galat)
 *   MOCK_NO_IBADAH=1              → tanpa ibadah hari ini
 *   MOCK_IBADAH_MANY=1            → 30 pekan ke belakang (±150 baris), untuk paginasi
 *   MOCK_IBADAH_SAVE_ERROR=500    → POST/PUT/DELETE menjawab 500
 *   MOCK_SARAN_EMPTY=1            → saran tuan rumah kosong (404)
 *   MOCK_BATCH_ERROR=row          → POST /ibadah/batch: baris indeks 1 selalu gagal
 *   MOCK_BATCH_ERROR=500          → POST /ibadah/batch menjawab 500
 *   MOCK_BATCH_ERROR=race         → POST /ibadah/batch menjawab 409 duplikat tanpa issues
 *
 * Hari ini selalu dua ibadah Minggu (bentuk Beranda yang sudah di-review, apa pun
 * harinya). Baris khusus, relatif ke hari ini: Persekutuan Doa Rabu lalu tanpa
 * hitungan ("Belum dicatat"); Ibadah Padang bertipe nonaktif; Minggu II tiga pekan
 * lalu bertema 150 karakter; Minggu I sepekan lalu bertaut jadwal pelayan; Minggu I
 * dua pekan lalu punya persembahan ACTIVE (DELETE → 400); Persekutuan Doa dua pekan
 * lalu hanya punya persembahan VOID (DELETE berhasil).
 *
 * Tempat: seed lama = Gereja tanpa wilayah. Ibadah Wilayah Kamis 19:00 di Wilayah I
 * dan II, 6 pekan lalu + 2 pekan depan, bergilir di keluarga layak (yang terakhir
 * belum pernah). Tujuh pekan lalu: tuan rumah yang kini pindah wilayah dan tuan
 * rumah yang sudah dihapus. Retret pemuda di Villa Ciater (Lainnya) dan Persekutuan
 * Doa bertanda Wilayah V (nonaktif). Baris dibuat saat handler pertama dipanggil,
 * karena `keluarga.ts` mengimpor berkas ini.
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import type { IbadahPlaceType } from "../../../src/lib/ibadah-place";
import { ROOM_ROWS, ddlRows } from "../../mock-dashboard";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";
import { JADWAL_PELAYAN, type JadwalPelayanRow } from "../pelayanan-store";

import { findKeluarga, keluargaRows } from "./keluarga";
import { findTipeIbadah } from "./tipe-ibadah";
import { findWilayah, registerWilayahDependent } from "./wilayah";

type Relation = { id: number; code: string; name: string };

type Row = {
  id: number;
  publicId: string;
  code: string;
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
  maleCount: number;
  femaleCount: number;
  childCount: number;
  note: string | null;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string | null;
  deletedBy: number | null;
  deletedAt: string | null;
};

type Seed = Partial<Row> &
  Pick<Row, "typeIbadahId" | "date" | "startTime" | "endTime">;

const TODAY = todayJakarta();
const WEEKS_BACK = process.env.MOCK_IBADAH_MANY ? 30 : 10;
const SEEDED_AT = "2026-09-01T02:00:00.000Z";

const MINGGU_I = 1;
const MINGGU_II = 2;
const DOA = 3;
const PEMUDA = 4;
const PADANG = 5;
const WILAYAH_TYPE = 6;

const RUANG_GEREJA = 1;
const RUANG_PEMUDA = 3;

const BAPEL_ROWS = (ddlRows("bapel", new URLSearchParams()) ??
  []) as Relation[];
const KOMISI_PEMUDA =
  BAPEL_ROWS.find((bapel) => bapel.name === "Komisi Pemuda")?.id ?? null;

const THEMES = [
  ["Hidup dalam kasih karunia", "Efesus 2:8–10"],
  ["Terang di tengah kegelapan", "Yohanes 8:12"],
  ["Iman yang bekerja", "Yakobus 2:14–26"],
  ["Gembala yang baik", "Yohanes 10:11–18"],
  ["Bersukacita senantiasa", "Filipi 4:4–7"],
  ["Roti hidup", "Yohanes 6:35–40"],
  ["Berjaga dan berdoa", "Matius 26:36–46"],
];

const PREACHERS = [
  "Pdt. Yohanes Simatupang",
  "Pdt. Maria Sihombing",
  "Pdt. Daniel Hutagalung",
  "Vik. Ruth Nainggolan",
];

const LONG_THEME =
  "Membangun persekutuan yang saling menopang di tengah perubahan zaman, supaya setiap anggota jemaat bertumbuh dalam iman, pengharapan, dan kasih setia.";

const iso = (key: string) => `${key}T00:00:00.000Z`;

const dayOf = (row: Pick<Row, "date">) => row.date.slice(0, 10);

const weekdayOf = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

const lastWeekday = (weekday: number, weeksBack = 0) => {
  const back = (weekdayOf(TODAY) - weekday + 7) % 7 || 7;

  return addDays(TODAY, -back - weeksBack * 7);
};

const nextWeekday = (weekday: number, weeksAhead = 0) => {
  const ahead = (weekday - weekdayOf(TODAY) + 7) % 7 || 7;

  return addDays(TODAY, ahead + weeksAhead * 7);
};

const SPECIAL = {
  notCounted: { date: lastWeekday(3), typeIbadahId: DOA },
  longTheme: { date: lastWeekday(0, 2), typeIbadahId: MINGGU_II },
  withJadwal: { date: lastWeekday(0), typeIbadahId: MINGGU_I },
  activeOffering: { date: lastWeekday(0, 1), typeIbadahId: MINGGU_I },
  voidOffering: { date: lastWeekday(3, 1), typeIbadahId: DOA },
};

const SEEDED_JADWAL = JADWAL_PELAYAN.find(
  (row) => row.date === SPECIAL.withJadwal.date,
);

const isSpecial = (
  seed: Pick<Row, "date" | "typeIbadahId">,
  special: { date: string; typeIbadahId: number },
) =>
  seed.date.startsWith(special.date) &&
  seed.typeIbadahId === special.typeIbadahId;

const countsOf = (base: [number, number, number], index: number) => ({
  maleCount: base[0] + ((index * 7) % 23),
  femaleCount: base[1] + ((index * 11) % 29),
  childCount: base[2] + ((index * 5) % 13),
});

const seedsOn = (key: string, index: number): Seed[] => {
  const isPast = key < TODAY;
  const [theme, bibleVerse] =
    THEMES[(Math.floor(index / 7) + weekdayOf(key)) % THEMES.length];
  const detailOf = (base: [number, number, number]) =>
    isPast
      ? { theme, bibleVerse, ...countsOf(base, index) }
      : { theme: key === TODAY ? theme : null };

  if (key === TODAY) {
    if (process.env.MOCK_NO_IBADAH) return [];

    return [
      {
        typeIbadahId: MINGGU_I,
        date: iso(key),
        startTime: "08:00",
        endTime: "09:30",
        preacher: "Pdt. Yohanes Simatupang",
        roomId: RUANG_GEREJA,
        ...detailOf([0, 0, 0]),
      },
      {
        typeIbadahId: MINGGU_II,
        date: iso(key),
        startTime: "17:00",
        endTime: "18:30",
        roomId: RUANG_GEREJA,
        ...detailOf([0, 0, 0]),
      },
    ];
  }

  switch (weekdayOf(key)) {
    case 0:
      return [
        {
          typeIbadahId: MINGGU_I,
          date: iso(key),
          startTime: "08:00",
          endTime: "09:30",
          preacher: PREACHERS[index % PREACHERS.length],
          roomId: RUANG_GEREJA,
          ...detailOf([128, 164, 46]),
        },
        {
          typeIbadahId: MINGGU_II,
          date: iso(key),
          startTime: "17:00",
          endTime: "18:30",
          preacher: isPast ? PREACHERS[(index + 1) % PREACHERS.length] : null,
          roomId: RUANG_GEREJA,
          ...detailOf([64, 82, 18]),
        },
      ];
    case 3:
      return [
        {
          typeIbadahId: DOA,
          date: iso(key),
          startTime: "19:00",
          endTime: "20:30",
          roomId: RUANG_GEREJA,
          ...detailOf([14, 22, 0]),
        },
      ];
    case 6:
      return [
        {
          typeIbadahId: PEMUDA,
          date: iso(key),
          startTime: "18:00",
          endTime: null,
          roomId: RUANG_PEMUDA,
          bapelId: KOMISI_PEMUDA,
          ...detailOf([21, 26, 0]),
        },
      ];
    default:
      return [];
  }
};

const eligibleHosts = (zoneChurchId: number) =>
  keluargaRows().filter(
    (row) =>
      row.zoneChurchId === zoneChurchId &&
      row.worshipsHere &&
      row.activeMembers > 0,
  );

const homeSeed = (
  date: string,
  zoneChurchId: number,
  host: { id: number; address: string },
  isPast: boolean,
  index: number,
): Seed => ({
  typeIbadahId: WILAYAH_TYPE,
  date: iso(date),
  startTime: "19:00",
  endTime: "20:30",
  placeType: "RUMAH_JEMAAT",
  hostKeluargaId: host.id,
  address: host.address,
  zoneChurchId,
  ...(isPast ? countsOf([6, 9, 3], index) : {}),
});

const zoneSeeds = (): Seed[] =>
  [1, 2].flatMap((zoneChurchId) => {
    const rotation = eligibleHosts(zoneChurchId).slice(0, -1);

    return Array.from({ length: 8 }, (_, week) => {
      // Dihitung dari dua sisi, bukan satu deret 8 pekan: kalau hari ini Kamis,
      // deret itu mendarat tepat di hari ini dan merusak "hari ini selalu dua
      // ibadah Minggu".
      const date =
        week < 6 ? lastWeekday(4, 5 - week) : nextWeekday(4, week - 6);

      return homeSeed(
        date,
        zoneChurchId,
        rotation[week % rotation.length],
        date < TODAY,
        week + zoneChurchId,
      );
    });
  });

const DELETED_HOST = {
  id: 99,
  code: "KK-0099",
  name: "Keluarga Lumbantobing",
  address: "Jl. Sisingamangaraja No. 12, RT 03 RW 02",
};

const placeSeeds = (): Seed[] => {
  const movedHost = keluargaRows().find((row) => row.zoneChurchId === 4);

  return [
    ...(movedHost ? [homeSeed(lastWeekday(4, 6), 2, movedHost, true, 3)] : []),
    homeSeed(lastWeekday(4, 6), 1, DELETED_HOST, true, 5),
    {
      typeIbadahId: PEMUDA,
      date: iso(lastWeekday(5, 3)),
      startTime: "16:00",
      endTime: "21:00",
      theme: "Retret pemuda: berakar dan bertumbuh",
      placeType: "LAINNYA",
      placeName: "Villa Ciater",
      address: "Jl. Raya Ciater KM 12, Subang",
      bapelId: KOMISI_PEMUDA,
      maleCount: 24,
      femaleCount: 31,
    },
    {
      typeIbadahId: DOA,
      date: iso(lastWeekday(2, 1)),
      startTime: "19:00",
      endTime: "20:30",
      roomId: RUANG_GEREJA,
      zoneChurchId: 5,
      maleCount: 9,
      femaleCount: 15,
    },
  ];
};

const withSpecials = (seed: Seed): Seed => {
  if (isSpecial(seed, SPECIAL.notCounted)) {
    return { ...seed, maleCount: 0, femaleCount: 0, childCount: 0 };
  }
  if (isSpecial(seed, SPECIAL.longTheme)) return { ...seed, theme: LONG_THEME };
  if (isSpecial(seed, SPECIAL.withJadwal)) {
    return { ...seed, jadwalPelayanId: SEEDED_JADWAL?.id ?? null };
  }

  return seed;
};

// Relasi be-sada tetap membawa tipe yang sudah dihapus; ingat bentuk terakhirnya.
const knownTypes = new Map<number, Relation>();

const typeRowOf = (id: number) => {
  const type = findTipeIbadah(id);

  if (type) knownTypes.set(id, { id, code: type.code, name: type.name });

  return type;
};

const typeRelationOf = (id: number) => {
  typeRowOf(id);

  return knownTypes.get(id) ?? null;
};

const serials = new Map<string, number>();

// Tahun kode dari jam, bukan tanggal ibadahnya: `generateCode` be-sada.
const nextCode = (typeIbadahId: number) => {
  const typeCode = typeRowOf(typeIbadahId)?.code ?? "";
  const key = `${typeCode.split("-")[1] ?? typeCode}-${TODAY.slice(0, 4)}`;
  const serial = (serials.get(key) ?? 0) + 1;

  serials.set(key, serial);

  return `IBD_${key}-${String(serial).padStart(4, "0")}`;
};

const toRow = (id: number, seed: Seed): Row => ({
  id,
  publicId: `00000000-0000-4000-b000-${String(id).padStart(12, "0")}`,
  code: nextCode(seed.typeIbadahId),
  theme: null,
  bibleVerse: null,
  preacher: null,
  placeType: "GEREJA",
  hostKeluargaId: null,
  placeName: null,
  address: null,
  zoneChurchId: null,
  roomId: null,
  bapelId: null,
  jadwalPelayanId: null,
  maleCount: 0,
  femaleCount: 0,
  childCount: 0,
  note: null,
  createdBy: 3,
  createdAt: SEEDED_AT,
  updatedBy: null,
  updatedAt: null,
  deletedBy: null,
  deletedAt: null,
  ...seed,
});

const seedRows = (): Row[] =>
  [
    ...Array.from({ length: WEEKS_BACK * 7 + 15 }, (_, index) =>
      addDays(TODAY, index - WEEKS_BACK * 7),
    ).flatMap((key, index) => seedsOn(key, index).map(withSpecials)),
    {
      typeIbadahId: PADANG,
      date: iso(addDays(lastWeekday(6, 2), -1)),
      startTime: "07:00",
      endTime: "11:00",
      theme: "Syukur panen di tepi danau",
      bibleVerse: "Mazmur 65:10–14",
      preacher: "Pdt. Maria Sihombing",
      maleCount: 88,
      femaleCount: 97,
      childCount: 41,
      note: "Diadakan di Parapat; jemaat berangkat pukul 05.30.",
    },
    ...zoneSeeds(),
    ...placeSeeds(),
  ]
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
    .map((seed, index) => toRow(index + 1, seed));

let seeded: Row[] | undefined;

const allRows = () => (seeded ??= seedRows());

const isActiveOffering = (row: Row) =>
  row.createdAt === SEEDED_AT && isSpecial(row, SPECIAL.activeOffering);

const relationOf = (source: Relation[], id: number | null) => {
  const found = id === null ? undefined : source.find((row) => row.id === id);

  return found ? { id: found.id, code: found.code, name: found.name } : null;
};

// Relasi be-sada tetap membawa keluarga/wilayah yang sudah dihapus.
const knownHosts = new Map<number, Relation>([[DELETED_HOST.id, DELETED_HOST]]);
const knownZones = new Map<number, Relation>();

const remembered = (
  known: Map<number, Relation>,
  id: number | null,
  found: Relation | undefined,
) => {
  if (id === null) return null;
  if (found) known.set(id, { id, code: found.code, name: found.name });

  return known.get(id) ?? null;
};

const hostRelationOf = (id: number | null) =>
  remembered(knownHosts, id, id === null ? undefined : findKeluarga(id));

const zoneRelationOf = (id: number | null) =>
  remembered(knownZones, id, id === null ? undefined : findWilayah(id));

const present = (row: Row) => {
  const {
    typeIbadahId,
    roomId,
    bapelId,
    jadwalPelayanId,
    hostKeluargaId,
    zoneChurchId,
    ...rest
  } = row;

  return {
    ...rest,
    typeIbadah: typeRelationOf(typeIbadahId),
    room: relationOf(ROOM_ROWS, roomId),
    bapel: relationOf(BAPEL_ROWS, bapelId),
    jadwalPelayan: relationOf(JADWAL_PELAYAN, jadwalPelayanId),
    hostKeluarga: hostRelationOf(hostKeluargaId),
    zoneChurch: zoneRelationOf(zoneChurchId),
  };
};

const presentListed = (row: Row) => {
  const { address: _address, ...listed } = present(row);

  return listed;
};

const WALL_CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const formNumber = (message: string) =>
  z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.coerce.number({ error: message }),
  );

const optionalFormNumber = () =>
  z.preprocess(
    (value) => (isBlank(value) ? null : value),
    z.coerce.number().nullable(),
  );

const optionalFormString = () =>
  z.preprocess(
    (value) => (isBlank(value) ? null : value),
    z.string().nullable(),
  );

const formDate = (message: string) =>
  z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.coerce.date({ error: message }),
  );

const timeOfDay = (label: string, example: string) =>
  z.string({ error: `Mohon Lengkapi ${label}` }).regex(WALL_CLOCK, {
    error: `Format ${label} harus HH:mm (contoh: ${example})`,
  });

const optionalTimeOfDay = (label: string, example: string) =>
  z.preprocess(
    (value) => (isBlank(value) ? null : value),
    z
      .string({ error: `Format ${label} harus HH:mm (contoh: ${example})` })
      .regex(WALL_CLOCK, {
        error: `Format ${label} harus HH:mm (contoh: ${example})`,
      })
      .nullable(),
  );

const headCount = (label: string) =>
  z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? 0 : value,
    z.coerce
      .number({ error: `${label} harus berupa angka` })
      .int({ error: `${label} harus berupa bilangan bulat` })
      .min(0, { error: `${label} tidak boleh kurang dari 0` }),
  );

const trimmedText = (label: string, max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" ? value.trim() || null : (value ?? null),
    z
      .string()
      .max(max, { error: `${label} tidak boleh lebih dari ${max} karakter` })
      .nullable(),
  );

const optionalText = (label: string, max: number) =>
  optionalFormString().refine(
    (value) => value === null || value.trim().length <= max,
    { error: `${label} tidak boleh lebih dari ${max} karakter` },
  );

const ibadahSchema = z
  .object({
    typeIbadahId: formNumber("Mohon Lengkapi Tipe Ibadah"),
    date: formDate("Mohon Lengkapi Tanggal Ibadah"),
    startTime: timeOfDay("Jam Mulai", "07:00"),
    endTime: optionalTimeOfDay("Jam Selesai", "09:00"),
    theme: optionalText("Tema Ibadah", 150),
    bibleVerse: optionalText("Ayat Alkitab", 100),
    preacher: optionalText("Pengkhotbah", 150),
    placeType: z.enum(["GEREJA", "RUMAH_JEMAAT", "LAINNYA"], {
      error: "Mohon Lengkapi Tempat Ibadah",
    }),
    hostKeluargaId: optionalFormNumber(),
    placeName: trimmedText("Nama Tempat", 150),
    address: trimmedText("Alamat", 250),
    zoneChurchId: optionalFormNumber(),
    roomId: optionalFormNumber(),
    bapelId: optionalFormNumber(),
    jadwalPelayanId: optionalFormNumber(),
    maleCount: headCount("Jumlah Pria"),
    femaleCount: headCount("Jumlah Wanita"),
    childCount: headCount("Jumlah Anak"),
    note: optionalText("Catatan", 250),
  })
  .refine(
    (ibadah) => ibadah.endTime === null || ibadah.endTime > ibadah.startTime,
    { error: "Jam Selesai harus setelah Jam Mulai Ibadah", path: ["endTime"] },
  )
  .superRefine((ibadah, ctx) => {
    const isChurch = ibadah.placeType === "GEREJA";
    const isHome = ibadah.placeType === "RUMAH_JEMAAT";
    const isOther = ibadah.placeType === "LAINNYA";
    const rules: [boolean, string, string][] = [
      [
        isHome && ibadah.hostKeluargaId === null,
        "hostKeluargaId",
        "Mohon Lengkapi Keluarga Tuan Rumah",
      ],
      [
        isHome && ibadah.address === null,
        "address",
        "Mohon Lengkapi Alamat Ibadah",
      ],
      [
        isOther && ibadah.placeName === null,
        "placeName",
        "Mohon Lengkapi Nama Tempat",
      ],
      [
        !isHome && ibadah.hostKeluargaId !== null,
        "hostKeluargaId",
        "Tuan Rumah Hanya Diisi Untuk Ibadah di Rumah Jemaat",
      ],
      [
        !isOther && ibadah.placeName !== null,
        "placeName",
        "Nama Tempat Hanya Diisi Untuk Ibadah di Tempat Lainnya",
      ],
      [
        isChurch && ibadah.address !== null,
        "address",
        "Alamat Tidak Diisi Untuk Ibadah di Gereja",
      ],
      [
        !isChurch && ibadah.roomId !== null,
        "roomId",
        "Ruangan Hanya Diisi Untuk Ibadah di Gereja",
      ],
    ];

    for (const [isBroken, path, message] of rules) {
      if (isBroken) ctx.addIssue({ code: "custom", path: [path], message });
    }
  });

type IbadahInput = Omit<z.infer<typeof ibadahSchema>, "date"> & {
  date: string;
};

const failure = (status: number, error: string, path?: string) =>
  json(
    path
      ? { status, error, issues: [{ path, message: error }] }
      : { status, error },
    status,
  );

const notFound = () => failure(404, "Ibadah Tidak Ditemukan");

const isLive = (row: Row) => row.deletedAt === null;

registerWilayahDependent("Ibadah", (zoneId) =>
  allRows().some((row) => isLive(row) && row.zoneChurchId === zoneId),
);

const nameOnly = (relation: { name: string } | null) =>
  relation ? { name: relation.name } : null;

const isoDate = (date: string) =>
  date.length === 10 ? `${date}T00:00:00.000Z` : date;

export const ibadahLinkedTo = (
  jadwalId: number,
  order: "dateTime" | "time" = "dateTime",
) =>
  allRows()
    .filter((row) => isLive(row) && row.jadwalPelayanId === jadwalId)
    .sort(
      (a, b) =>
        (order === "time" ? 0 : a.date.localeCompare(b.date)) ||
        a.startTime.localeCompare(b.startTime),
    )
    .map((row) => ({
      code: row.code,
      date: isoDate(row.date),
      startTime: row.startTime,
      endTime: row.endTime,
      placeType: row.placeType,
      placeName: row.placeName,
      typeIbadah: { name: findTipeIbadah(row.typeIbadahId)?.name ?? "" },
      room: nameOnly(relationOf(ROOM_ROWS, row.roomId)),
      hostKeluarga: nameOnly(hostRelationOf(row.hostKeluargaId)),
    }));

export const ibadahInRoom = (roomId: number, from: string, to?: string) =>
  allRows()
    .filter(
      (row) =>
        isLive(row) &&
        row.roomId === roomId &&
        row.date.slice(0, 10) >= from &&
        (!to || row.date.slice(0, 10) <= to),
    )
    .map((row) => ({
      code: row.code,
      name: findTipeIbadah(row.typeIbadahId)?.name ?? "Ibadah",
      date: row.date.slice(0, 10),
      startTime: row.startTime,
      endTime: row.endTime,
    }));

const findByCode = (code: string) =>
  allRows().find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const byNewest = (a: Row, b: Row) =>
  b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime);

const listRows = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const typeIbadahId = params.get("typeIbadahId") ?? "";
  const bapelId = params.get("bapelId") ?? "";
  const roomId = params.get("roomId") ?? "";
  const zoneChurchId = params.get("zoneChurchId") ?? "";
  const hostKeluargaId = params.get("hostKeluargaId") ?? "";
  const date = params.get("date") ?? "";
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const isRange = Boolean(startDate && endDate);

  return allRows()
    .filter(isLive)
    .filter(
      (row) =>
        !filter ||
        [
          row.code,
          row.theme,
          row.preacher,
          row.placeName,
          typeRelationOf(row.typeIbadahId)?.name,
          hostRelationOf(row.hostKeluargaId)?.name,
        ].some((value) => value?.toLowerCase().includes(filter)),
    )
    .filter((row) => !typeIbadahId || row.typeIbadahId === +typeIbadahId)
    .filter((row) => !bapelId || row.bapelId === +bapelId)
    .filter((row) => !roomId || row.roomId === +roomId)
    .filter((row) => !zoneChurchId || row.zoneChurchId === +zoneChurchId)
    .filter((row) => !hostKeluargaId || row.hostKeluargaId === +hostKeluargaId)
    .filter((row) => !date || dayOf(row) === date)
    .filter(
      (row) => !isRange || (dayOf(row) >= startDate && dayOf(row) <= endDate),
    )
    .sort(byNewest)
    .map(presentListed);
};

const scheduleCovers = (
  schedule: JadwalPelayanRow,
  service: { date: string; startTime: string; endTime: string | null },
) =>
  schedule.date.slice(0, 10) === service.date.slice(0, 10) &&
  schedule.startTime <= (service.endTime ?? service.startTime) &&
  schedule.endTime > service.startTime;

const checkRelations = (input: IbadahInput, current?: Row): Response | null => {
  const movingTo = (
    key:
      | "roomId"
      | "bapelId"
      | "jadwalPelayanId"
      | "hostKeluargaId"
      | "zoneChurchId",
  ) => {
    const value = input[key];

    return value !== null && value !== current?.[key] ? value : null;
  };

  const roomId = movingTo("roomId");
  if (roomId !== null && !relationOf(ROOM_ROWS, roomId)) {
    return failure(404, "Ruangan Tidak Ditemukan", "roomId");
  }

  const bapelId = movingTo("bapelId");
  if (bapelId !== null && !relationOf(BAPEL_ROWS, bapelId)) {
    return failure(404, "Bapel Tidak Ditemukan", "bapelId");
  }

  const isSlotMoved =
    current !== undefined &&
    (input.date.slice(0, 10) !== current.date.slice(0, 10) ||
      input.startTime !== current.startTime ||
      input.endTime !== current.endTime);
  const jadwalId =
    movingTo("jadwalPelayanId") ?? (isSlotMoved ? input.jadwalPelayanId : null);
  if (jadwalId !== null) {
    const jadwal = JADWAL_PELAYAN.find(
      (row) => row.id === jadwalId && row.deletedAt === null,
    );

    if (!jadwal) {
      return failure(404, "Jadwal Pelayan Tidak Ditemukan", "jadwalPelayanId");
    }
    if (!scheduleCovers(jadwal, input)) {
      return failure(
        400,
        "Jadwal Pelayan Tersebut Tidak Sesuai Dengan Tanggal atau Jam Ibadah",
        "jadwalPelayanId",
      );
    }
  }

  const hostId = movingTo("hostKeluargaId");
  if (hostId !== null && !findKeluarga(hostId)) {
    return failure(
      404,
      "Keluarga Tuan Rumah Tidak Ditemukan",
      "hostKeluargaId",
    );
  }

  const zoneId = movingTo("zoneChurchId");
  if (zoneId !== null) {
    const zone = findWilayah(zoneId);

    if (!zone) {
      return failure(404, "Wilayah Gereja Tidak Ditemukan", "zoneChurchId");
    }
    if (!zone.isActive) {
      return failure(
        400,
        `Wilayah ${zone.name} sudah nonaktif. Pilih wilayah lain.`,
        "zoneChurchId",
      );
    }
  }

  return null;
};

const DUPLICATE =
  "Ibadah dengan tipe, tanggal, jam mulai dan wilayah yang sama sudah tercatat. Isi Wilayah jika ibadah ini untuk wilayah yang berbeda";

const isDuplicate = (input: IbadahInput, ownId?: number) =>
  allRows().some(
    (row) =>
      isLive(row) &&
      row.id !== ownId &&
      row.typeIbadahId === input.typeIbadahId &&
      dayOf(row) === input.date.slice(0, 10) &&
      row.startTime === input.startTime &&
      (row.zoneChurchId ?? 0) === (input.zoneChurchId ?? 0),
  );

const parse = async (
  request: Request,
): Promise<{ input: IbadahInput } | { error: Response }> => {
  const parsed = ibadahSchema.safeParse(await readBody<unknown>(request));

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return {
      error: json({ status: 400, error: issues[0].message, issues }, 400),
    };
  }

  return {
    input: {
      ...parsed.data,
      date: iso(parsed.data.date.toISOString().slice(0, 10)),
    },
  };
};

const fieldsOf = (input: IbadahInput) => ({
  typeIbadahId: input.typeIbadahId,
  date: input.date,
  startTime: input.startTime,
  endTime: input.endTime,
  theme: input.theme,
  bibleVerse: input.bibleVerse,
  preacher: input.preacher,
  placeType: input.placeType,
  hostKeluargaId: input.hostKeluargaId,
  placeName: input.placeName,
  address: input.address,
  zoneChurchId: input.zoneChurchId,
  roomId: input.roomId,
  bapelId: input.bapelId,
  jadwalPelayanId: input.jadwalPelayanId,
  maleCount: input.maleCount,
  femaleCount: input.femaleCount,
  childCount: input.childCount,
  note: input.note,
});

export const nextHostedDate = (keluargaId: number) =>
  allRows()
    .filter(
      (row) =>
        isLive(row) &&
        row.hostKeluargaId === keluargaId &&
        dayOf(row) >= todayJakarta(),
    )
    .map((row) => row.date)
    .sort()[0] ?? null;

const positiveId = (value: string | null) =>
  /^\d+$/.test(value ?? "") && Number(value) > 0 ? Number(value) : null;

const lastHostedOf = (keluargaId: number, typeIbadahId: number) =>
  allRows()
    .filter(
      (row) =>
        isLive(row) &&
        row.hostKeluargaId === keluargaId &&
        row.typeIbadahId === typeIbadahId,
    )
    .map((row) => row.date)
    .sort()
    .at(-1) ?? null;

const hostSuggestions = (params: URLSearchParams) => {
  const typeIbadahId = positiveId(params.get("typeIbadahId"));
  const zoneChurchId = positiveId(params.get("zoneChurchId"));

  if (typeIbadahId === null) {
    return failure(400, "Mohon Lengkapi Tipe Ibadah", "typeIbadahId");
  }
  if (zoneChurchId === null) {
    return failure(400, "Mohon Lengkapi Wilayah", "zoneChurchId");
  }

  const data = process.env.MOCK_SARAN_EMPTY
    ? []
    : keluargaRows()
        .filter(
          (row) =>
            row.zoneChurchId === zoneChurchId &&
            row.worshipsHere &&
            row.activeMembers > 0,
        )
        .map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          lastHostedDate: lastHostedOf(row.id, typeIbadahId),
        }))
        .sort(
          (a, b) =>
            Number(a.lastHostedDate !== null) -
              Number(b.lastHostedDate !== null) ||
            (a.lastHostedDate ?? "").localeCompare(b.lastHostedDate ?? "") ||
            a.name.localeCompare(b.name, "id"),
        );

  if (data.length === 0) {
    return failure(
      404,
      "Tidak Ada Keluarga Yang Dapat Menjadi Tuan Rumah di Wilayah Ini",
    );
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Saran Tuan Rumah",
    data,
  });
};

const BATCH_MAX = 60;

const batchSchema = z.object({
  rows: z
    .array(z.unknown(), { error: "Mohon Lengkapi Daftar Ibadah" })
    .min(1, { error: "Mohon Lengkapi Daftar Ibadah" })
    .max(BATCH_MAX, {
      error: `Maksimal ${BATCH_MAX} Ibadah Dalam Satu Kali Simpan`,
    })
    .pipe(z.array(ibadahSchema)),
});

type Issue = { path: string; message: string };

const creatableIssue = async (input: IbadahInput): Promise<Issue | null> => {
  const type = typeRowOf(input.typeIbadahId);

  if (!type) {
    return { path: "typeIbadahId", message: "Tipe Ibadah Tidak Ditemukan" };
  }
  if (!type.isActive) {
    return {
      path: "typeIbadahId",
      message: "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
    };
  }

  const relationError = checkRelations(input);
  if (relationError) {
    return ((await relationError.json()) as { issues: Issue[] }).issues[0];
  }

  return isDuplicate(input) ? { path: "startTime", message: DUPLICATE } : null;
};

const slotOf = (input: IbadahInput) =>
  [
    input.typeIbadahId,
    input.date.slice(0, 10),
    input.startTime,
    input.zoneChurchId ?? 0,
  ].join("|");

const createBatch = async (request: Request) => {
  const parsed = batchSchema.safeParse(await readBody<unknown>(request));

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return json({ status: 400, error: issues[0].message, issues }, 400);
  }

  const inputs: IbadahInput[] = parsed.data.rows.map((row) => ({
    ...row,
    date: iso(row.date.toISOString().slice(0, 10)),
  }));
  const issues: Issue[] = [];
  const seen = new Map<string, number>();

  for (const [index, input] of inputs.entries()) {
    const earlier = seen.get(slotOf(input));

    if (earlier !== undefined) {
      issues.push({
        path: `rows.${index}.startTime`,
        message: `Ibadah Ini Sama Dengan Baris ${earlier + 1}`,
      });
      continue;
    }
    seen.set(slotOf(input), index);

    const issue =
      process.env.MOCK_BATCH_ERROR === "row" && index === 1
        ? {
            path: "hostKeluargaId",
            message: "Keluarga Tuan Rumah Tidak Ditemukan",
          }
        : await creatableIssue(input);

    if (issue) {
      issues.push({
        path: `rows.${index}.${issue.path}`,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return json({ status: 400, error: issues[0].message, issues }, 400);
  }
  if (process.env.MOCK_BATCH_ERROR === "race") return failure(409, DUPLICATE);

  const rows = allRows();
  const firstId = Math.max(0, ...rows.map((row) => row.id)) + 1;
  const createdAt = new Date().toISOString();
  const created = inputs.map((input, index) =>
    toRow(firstId + index, { ...fieldsOf(input), createdBy: 1, createdAt }),
  );

  rows.push(...created);

  return json(
    {
      status: 201,
      message: `Berhasil Membuat ${created.length} Data Ibadah`,
      data: { codes: created.map((row) => row.code) },
    },
    201,
  );
};

const actionOf = (method: string): MockAction =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const ibadahMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/ibadah" && !path.startsWith("/ibadah/")) return null;

  const code = decodeURIComponent(path.slice("/ibadah/".length));

  if (path === "/ibadah/saran-tuan-rumah" && method === "GET") {
    if (!can(MENU.IBADAH, "CREATE")) return denied();

    return hostSuggestions(url.searchParams);
  }

  if (!can(MENU.IBADAH, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_IBADAH_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }

  if (path === "/ibadah" && method === "GET") {
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    return list(listRows(url.searchParams), url, "Data Ibadah", "Ibadah");
  }

  if (path === "/ibadah/batch" && method === "POST") {
    if (process.env.MOCK_BATCH_ERROR === "500") {
      return failure(500, "Kesalahan server.");
    }

    return createBatch(request);
  }

  if (path === "/ibadah" && method === "POST") {
    const parsed = await parse(request);
    if ("error" in parsed) return parsed.error;

    const { input } = parsed;
    const type = typeRowOf(input.typeIbadahId);

    if (!type) {
      return failure(404, "Tipe Ibadah Tidak Ditemukan", "typeIbadahId");
    }
    if (!type.isActive) {
      return failure(
        400,
        "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
        "typeIbadahId",
      );
    }

    const relationError = checkRelations(input);
    if (relationError) return relationError;
    if (isDuplicate(input)) {
      return failure(409, DUPLICATE, "startTime");
    }

    const rows = allRows();
    const row = toRow(Math.max(0, ...rows.map((item) => item.id)) + 1, {
      ...fieldsOf(input),
      createdBy: 1,
      createdAt: new Date().toISOString(),
    });
    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Data Ibadah", data: row },
      201,
    );
  }

  if (method === "GET") {
    const row = findByCode(code);
    if (!row) return notFound();

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Data Ibadah",
      data: present(row),
    });
  }

  if (method === "PUT") {
    const parsed = await parse(request);
    if ("error" in parsed) return parsed.error;

    const row = findByCode(code);
    if (!row) return notFound();

    const { input } = parsed;
    const type = typeRowOf(input.typeIbadahId);

    if (!type) {
      return failure(404, "Tipe Ibadah Tidak Ditemukan", "typeIbadahId");
    }
    if (row.typeIbadahId !== input.typeIbadahId && !type.isActive) {
      return failure(
        400,
        "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
        "typeIbadahId",
      );
    }

    const relationError = checkRelations(input, row);
    if (relationError) return relationError;
    if (isDuplicate(input, row.id)) {
      return failure(409, DUPLICATE, "startTime");
    }

    Object.assign(row, fieldsOf(input), {
      updatedBy: 1,
      updatedAt: new Date().toISOString(),
    });

    return json({
      status: 200,
      message: "Berhasil Memperbarui Data Ibadah",
      data: row,
    });
  }

  if (method === "DELETE") {
    const row = findByCode(code);
    if (!row) return notFound();

    if (isActiveOffering(row)) {
      return failure(
        400,
        "Ibadah Tidak Dapat Dihapus Karena Sudah Memiliki Data Persembahan",
      );
    }

    row.deletedBy = 1;
    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Data Ibadah",
      data: row,
    });
  }

  return null;
};
