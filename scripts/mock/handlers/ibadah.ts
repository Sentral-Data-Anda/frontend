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
 *
 * Hari ini selalu dua ibadah Minggu (bentuk Beranda yang sudah di-review, apa pun
 * harinya). Baris khusus, relatif ke hari ini: Persekutuan Doa Rabu lalu tanpa
 * hitungan ("Belum dicatat"); Ibadah Padang bertipe nonaktif; Minggu II tiga pekan
 * lalu bertema 150 karakter; Minggu I sepekan lalu bertaut jadwal pelayan; Minggu I
 * dua pekan lalu punya persembahan ACTIVE (DELETE → 400); Persekutuan Doa dua pekan
 * lalu hanya punya persembahan VOID (DELETE berhasil).
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import { ROOM_ROWS, ddlRows } from "../../mock-dashboard";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

import { findTipeIbadah } from "./tipe-ibadah";

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

const SPECIAL = {
  notCounted: { date: lastWeekday(3), typeIbadahId: DOA },
  longTheme: { date: lastWeekday(0, 2), typeIbadahId: MINGGU_II },
  withJadwal: { date: lastWeekday(0), typeIbadahId: MINGGU_I },
  activeOffering: { date: lastWeekday(0, 1), typeIbadahId: MINGGU_I },
  voidOffering: { date: lastWeekday(3, 1), typeIbadahId: DOA },
};

const JADWAL_ROWS = [
  {
    id: 1,
    code: "JDP-0001",
    name: "Pelayan Ibadah Minggu I",
    date: iso(SPECIAL.withJadwal.date),
    startTime: "07:30",
    endTime: "10:00",
  },
];

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

const withSpecials = (seed: Seed): Seed => {
  if (isSpecial(seed, SPECIAL.notCounted)) {
    return { ...seed, maleCount: 0, femaleCount: 0, childCount: 0 };
  }
  if (isSpecial(seed, SPECIAL.longTheme)) return { ...seed, theme: LONG_THEME };
  if (isSpecial(seed, SPECIAL.withJadwal)) {
    return { ...seed, jadwalPelayanId: JADWAL_ROWS[0].id };
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

const nextCode = (typeIbadahId: number, date: string) => {
  const typeCode = typeRowOf(typeIbadahId)?.code ?? "";
  const key = `${typeCode.split("-")[1] ?? typeCode}-${date.slice(0, 4)}`;
  const serial = (serials.get(key) ?? 0) + 1;

  serials.set(key, serial);

  return `IBD_${key}-${String(serial).padStart(4, "0")}`;
};

const toRow = (id: number, seed: Seed): Row => ({
  id,
  publicId: `00000000-0000-4000-b000-${String(id).padStart(12, "0")}`,
  code: nextCode(seed.typeIbadahId, seed.date),
  theme: null,
  bibleVerse: null,
  preacher: null,
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

const seeds: Seed[] = [
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
];

const rows: Row[] = seeds
  .sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  )
  .map((seed, index) => toRow(index + 1, seed));

const OFFERINGS = [
  ...rows
    .filter((row) => isSpecial(row, SPECIAL.activeOffering))
    .map((row) => ({ ibadahId: row.id, status: "ACTIVE" })),
  ...rows
    .filter((row) => isSpecial(row, SPECIAL.voidOffering))
    .map((row) => ({ ibadahId: row.id, status: "VOID" })),
];

const relationOf = (source: Relation[], id: number | null) => {
  const found = id === null ? undefined : source.find((row) => row.id === id);

  return found ? { id: found.id, code: found.code, name: found.name } : null;
};

const present = (row: Row) => {
  const { typeIbadahId, roomId, bapelId, jadwalPelayanId, ...rest } = row;

  return {
    ...rest,
    typeIbadah: typeRelationOf(typeIbadahId),
    room: relationOf(ROOM_ROWS, roomId),
    bapel: relationOf(BAPEL_ROWS, bapelId),
    jadwalPelayan: relationOf(JADWAL_ROWS, jadwalPelayanId),
  };
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
  );

type IbadahInput = Omit<z.infer<typeof ibadahSchema>, "date"> & {
  date: string;
};

const failure = (status: number, error: string) =>
  json({ status, error }, status);

const notFound = () => failure(404, "Ibadah Tidak Ditemukan");

const isLive = (row: Row) => row.deletedAt === null;

const findByCode = (code: string) =>
  rows.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const byNewest = (a: Row, b: Row) =>
  b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime);

const listRows = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const typeIbadahId = params.get("typeIbadahId") ?? "";
  const bapelId = params.get("bapelId") ?? "";
  const roomId = params.get("roomId") ?? "";
  const date = params.get("date") ?? "";
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const isRange = Boolean(startDate && endDate);

  return rows
    .filter(isLive)
    .filter(
      (row) =>
        !filter ||
        [
          row.code,
          row.theme,
          row.preacher,
          typeRelationOf(row.typeIbadahId)?.name,
        ].some((value) => value?.toLowerCase().includes(filter)),
    )
    .filter((row) => !typeIbadahId || row.typeIbadahId === +typeIbadahId)
    .filter((row) => !bapelId || row.bapelId === +bapelId)
    .filter((row) => !roomId || row.roomId === +roomId)
    .filter((row) => !date || dayOf(row) === date)
    .filter(
      (row) => !isRange || (dayOf(row) >= startDate && dayOf(row) <= endDate),
    )
    .sort(byNewest)
    .map(present);
};

const scheduleCovers = (
  schedule: (typeof JADWAL_ROWS)[number],
  service: { date: string; startTime: string; endTime: string | null },
) =>
  schedule.date.slice(0, 10) === service.date.slice(0, 10) &&
  schedule.startTime <= (service.endTime ?? service.startTime) &&
  schedule.endTime > service.startTime;

const checkRelations = (input: IbadahInput, current?: Row): Response | null => {
  const movingTo = (key: "roomId" | "bapelId" | "jadwalPelayanId") => {
    const value = input[key];

    return value !== null && value !== current?.[key] ? value : null;
  };

  const roomId = movingTo("roomId");
  if (roomId !== null && !relationOf(ROOM_ROWS, roomId)) {
    return failure(404, "Ruangan Tidak Ditemukan");
  }

  const bapelId = movingTo("bapelId");
  if (bapelId !== null && !relationOf(BAPEL_ROWS, bapelId)) {
    return failure(404, "Bapel Tidak Ditemukan");
  }

  const jadwalId = movingTo("jadwalPelayanId");
  if (jadwalId !== null) {
    const jadwal = JADWAL_ROWS.find((row) => row.id === jadwalId);

    if (!jadwal) return failure(404, "Jadwal Pelayan Tidak Ditemukan");
    if (!scheduleCovers(jadwal, input)) {
      return failure(
        400,
        "Jadwal Pelayan Tersebut Tidak Sesuai Dengan Tanggal atau Jam Ibadah",
      );
    }
  }

  return null;
};

const isDuplicate = (input: IbadahInput, ownId?: number) =>
  rows.some(
    (row) =>
      isLive(row) &&
      row.id !== ownId &&
      row.typeIbadahId === input.typeIbadahId &&
      dayOf(row) === input.date.slice(0, 10) &&
      row.startTime === input.startTime,
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
  roomId: input.roomId,
  bapelId: input.bapelId,
  jadwalPelayanId: input.jadwalPelayanId,
  maleCount: input.maleCount,
  femaleCount: input.femaleCount,
  childCount: input.childCount,
  note: input.note,
});

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

  if (!can(MENU.IBADAH, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_IBADAH_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }

  if (path === "/ibadah" && method === "GET") {
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    return list(listRows(url.searchParams), url, "Data Ibadah", "Ibadah");
  }

  if (path === "/ibadah" && method === "POST") {
    const parsed = await parse(request);
    if ("error" in parsed) return parsed.error;

    const { input } = parsed;
    const type = typeRowOf(input.typeIbadahId);

    if (!type) return failure(404, "Tipe Ibadah Tidak Ditemukan");
    if (!type.isActive) {
      return failure(
        400,
        "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
      );
    }

    const relationError = checkRelations(input);
    if (relationError) return relationError;
    if (isDuplicate(input)) {
      return failure(
        409,
        "Ibadah dengan tipe, tanggal dan jam mulai yang sama sudah tercatat",
      );
    }

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

    if (!type) return failure(404, "Tipe Ibadah Tidak Ditemukan");
    if (row.typeIbadahId !== input.typeIbadahId && !type.isActive) {
      return failure(
        400,
        "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
      );
    }

    const relationError = checkRelations(input, row);
    if (relationError) return relationError;
    if (isDuplicate(input, row.id)) {
      return failure(
        409,
        "Ibadah dengan tipe, tanggal dan jam mulai yang sama sudah tercatat",
      );
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

    const isOffered = OFFERINGS.some(
      (offering) =>
        offering.ibadahId === row.id && offering.status === "ACTIVE",
    );

    if (isOffered) {
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
