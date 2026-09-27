/**
 * Tiruan `/api/v1/hari-libur` (be-sada modul `holiday`) dan
 * `GET /hari-libur/kalender` dari state yang sama, supaya libur baru langsung
 * terlihat di kalender form lain.
 *
 *   MOCK_500=1                           → daftar hari libur menjawab 500
 *   MOCK_HOLIDAY_SAVE_ERROR=500          → simpan (POST/PUT) menjawab 500
 *   MOCK_HOLIDAY_CALENDAR_ERROR=500      → /kalender menjawab 500 (kalender tanpa penanda)
 *
 * `/kalender` hanya butuh sesi (tanpa guard menu). Ganda → 409
 * "Hari Libur Sudah Tersedia": (tanggal, nama) sama, atau (bulan-hari, nama) sama
 * dengan rekaman berulang yang berlaku di tanggal itu (sama dengan assertUnique be-sada).
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type HolidayType = "NASIONAL" | "CUTI_BERSAMA" | "GEREJA";

type Row = {
  id: number;
  publicId: string;
  date: string;
  name: string;
  type: HolidayType;
  isRecurring: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string | null;
};

type Body = {
  date?: unknown;
  name?: unknown;
  type?: unknown;
  isRecurring?: unknown;
};

const TYPES: HolidayType[] = ["NASIONAL", "CUTI_BERSAMA", "GEREJA"];
const SEEDED_AT = "2026-01-02T02:00:00.000Z";
const MAX_RANGE_DAYS = 400;

const toRow = (
  id: number,
  date: string,
  name: string,
  type: HolidayType,
  isRecurring = false,
): Row => ({
  id,
  publicId: `holiday-${id}`,
  date: `${date}T00:00:00.000Z`,
  name,
  type,
  isRecurring,
  createdBy: 1,
  createdAt: SEEDED_AT,
  updatedBy: null,
  updatedAt: null,
});

const rows: Row[] = [
  toRow(1, "2026-01-01", "Tahun Baru 2026 Masehi", "NASIONAL"),
  toRow(2, "2026-03-20", "Idul Fitri 1447 Hijriah", "NASIONAL"),
  toRow(3, "2026-03-21", "Idul Fitri 1447 Hijriah (hari kedua)", "NASIONAL"),
  toRow(4, "2026-03-23", "Cuti Bersama Idul Fitri", "CUTI_BERSAMA"),
  toRow(5, "2026-04-03", "Wafat Yesus Kristus", "NASIONAL"),
  toRow(6, "2026-04-05", "Hari Paskah", "NASIONAL"),
  toRow(7, "2026-05-14", "Kenaikan Yesus Kristus", "NASIONAL"),
  toRow(8, "2026-06-01", "Hari Lahir Pancasila", "NASIONAL"),
  toRow(9, "2026-08-17", "Hari Kemerdekaan Republik Indonesia", "NASIONAL"),
  toRow(10, "2026-10-02", "Retret Majelis", "GEREJA"),
  toRow(11, "2026-12-24", "Cuti Bersama Natal", "CUTI_BERSAMA"),
  toRow(12, "2026-12-25", "Hari Raya Natal", "NASIONAL"),
  toRow(13, "1985-09-27", "HUT Gereja", "GEREJA", true),
  toRow(14, "2024-02-29", "Syukur Tahun Kabisat", "GEREJA", true),
];

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const dayOf = (row: Row) => row.date.slice(0, 10);

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const byDateThenName = (
  a: { date: string; name: string },
  b: { date: string; name: string },
) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name);

const invalid = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const validate = (body: Body) => {
  if (!body.date) return invalid("date", "Mohon Lengkapi Tanggal");
  if (!isIsoDate(body.date))
    return invalid("date", "Format Tanggal Tidak Valid");

  const name = typeof body.name === "string" ? normalize(body.name) : "";

  if (!name) return invalid("name", "Mohon Lengkapi Nama Hari Libur");
  if (name.length < 3) {
    return invalid("name", "Nama Hari Libur minimal 3 karakter");
  }
  if (name.length > 100) {
    return invalid(
      "name",
      "Nama Hari Libur tidak boleh lebih dari 100 karakter",
    );
  }
  if (!TYPES.includes(body.type as HolidayType)) {
    return invalid(
      "type",
      "Tipe Hari Libur harus Nasional, Cuti Bersama, atau Gereja",
    );
  }
  if (body.isRecurring !== undefined && typeof body.isRecurring !== "boolean") {
    return invalid("isRecurring", "Berulang Tiap Tahun tidak valid");
  }

  return null;
};

const isTaken = (
  date: string,
  name: string,
  isRecurring: boolean,
  ownId?: number,
) =>
  rows.some((row) => {
    if (row.id === ownId || row.name.toLowerCase() !== name.toLowerCase()) {
      return false;
    }

    if (dayOf(row) === date) return true;
    if (dayOf(row).slice(5) !== date.slice(5)) return false;

    return (
      (isRecurring && row.isRecurring) ||
      (row.isRecurring && dayOf(row) <= date) ||
      (isRecurring && date <= dayOf(row))
    );
  });

const taken = () =>
  json({ status: 409, error: "Hari Libur Sudah Tersedia" }, 409);

const calendar = (url: URL) => {
  if (process.env.MOCK_HOLIDAY_CALENDAR_ERROR) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    return invalid("from", "Rentang Tanggal Tidak Valid");
  }

  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (days > MAX_RANGE_DAYS) {
    return invalid("to", `Rentang Tanggal Maksimal ${MAX_RANGE_DAYS} Hari`);
  }

  const firstYear = Number(from.slice(0, 4));
  const lastYear = Number(to.slice(0, 4));
  const occurrences = rows.flatMap((row) => {
    if (!row.isRecurring) return [{ date: dayOf(row), row }];

    const origin = Number(dayOf(row).slice(0, 4));
    const monthDay = dayOf(row).slice(5);

    return Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => firstYear + index,
    )
      .filter((year) => year >= origin)
      .filter((year) => monthDay !== "02-29" || isLeapYear(year))
      .map((year) => ({ date: `${year}-${monthDay}`, row }));
  });

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Kalender Hari Libur",
    data: occurrences
      .filter(({ date }) => date >= from && date <= to)
      .map(({ date, row }) => ({ date, name: row.name, type: row.type }))
      .sort(byDateThenName),
  });
};

export const hariLiburMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/hari-libur/kalender" && method === "GET") return calendar(url);
  if (path !== "/hari-libur" && !path.startsWith("/hari-libur/")) return null;

  const id = Number(path.match(/^\/hari-libur\/(\d+)$/)?.[1]);
  const action =
    method === "POST"
      ? "CREATE"
      : method === "PUT"
        ? "UPDATE"
        : method === "DELETE"
          ? "DELETE"
          : "VIEW";

  if (!can(MENU.HARI_LIBUR, action)) return denied();

  if (
    (method === "POST" || method === "PUT") &&
    process.env.MOCK_HOLIDAY_SAVE_ERROR === "500"
  ) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/hari-libur" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const year = Number(url.searchParams.get("year")) || 0;
    const type = url.searchParams.get("type") ?? "";

    return list(
      rows
        .filter((row) => row.name.toLowerCase().includes(filter))
        .filter((row) => {
          const rowYear = Number(dayOf(row).slice(0, 4));

          return (
            !year || rowYear === year || (row.isRecurring && rowYear <= year)
          );
        })
        .filter((row) => !type || row.type === type)
        .sort(byDateThenName),
      url,
      "Hari Libur",
      "Hari Libur",
    );
  }

  if (path === "/hari-libur" && method === "POST") {
    const body = await readBody<Body>(request);
    const failure = validate(body);
    if (failure) return failure;

    const date = String(body.date);
    const name = normalize(String(body.name));
    const isRecurring = body.isRecurring === true;
    if (isTaken(date, name, isRecurring)) return taken();

    const row = toRow(
      Math.max(0, ...rows.map((item) => item.id)) + 1,
      date,
      name,
      body.type as HolidayType,
      isRecurring,
    );
    row.createdAt = new Date().toISOString();
    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Hari Libur", data: row },
      201,
    );
  }

  const row = rows.find((item) => item.id === id);

  if (!row) {
    return json({ status: 404, error: "Hari Libur Tidak Ditemukan" }, 404);
  }

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Hari Libur",
      data: row,
    });
  }

  if (method === "PUT") {
    const body = await readBody<Body>(request);
    const failure = validate(body);
    if (failure) return failure;

    const date = String(body.date);
    const name = normalize(String(body.name));
    const isRecurring = body.isRecurring === true;
    if (isTaken(date, name, isRecurring, row.id)) return taken();

    row.date = `${date}T00:00:00.000Z`;
    row.name = name;
    row.type = body.type as HolidayType;
    row.isRecurring = isRecurring;
    row.updatedBy = 1;
    row.updatedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Memperbarui Hari Libur",
      data: row,
    });
  }

  if (method === "DELETE") {
    rows.splice(rows.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Hari Libur",
      data: row,
    });
  }

  return null;
};
