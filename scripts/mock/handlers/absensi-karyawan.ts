/**
 * Tiruan `/api/v1/absensi-karyawan` (be-sada `modules/absensi_karyawan`,
 * gelombang 0 `9b94577`). Kunci path `publicId` — tabelnya tanpa kolom `code`.
 *
 * Hapusnya KERAS, bukan soft: `karyawan_attendance` tanpa `deletedAt`, karena
 * nisan akan menempati `@@unique([karyawanId, date])` dan menolak baris
 * pengganti hari yang salah ketik.
 *
 *   MOCK_500=1                      → daftar menjawab 500
 *   MOCK_EMPTY=1                    → daftar kosong (404, lewat `list`)
 *   MOCK_FAIL_PAGE=3                → halaman 3 daftar menjawab 500
 *   MOCK_ABSENSI_SAVE_ERROR=500     → simpan menjawab 500 (galat tingkat form)
 *                            =tanggal  → 400 tanggal melewati hari ini
 *                            =duplikat → 409 karyawan sudah punya absensi hari itu
 *                            =karyawan → 404 "Karyawan Tidak Ditemukan"
 *   MOCK_ABSENSI_DELETE_ERROR=1     → hapus menjawab 500
 *
 * Nol angka gaji di berkas ini, dan nol prompt password di layarnya: absensi
 * tidak memuat nominal, dan prompt di situ melatih orang mengabaikannya
 * (SDM README §0.3 no. 2).
 */
import { MENU } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import { collapseSpaces } from "../../../src/lib/name";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { KARYAWAN } from "./komponen-payroll";

const STATUSES = ["HADIR", "IZIN", "SAKIT", "CUTI", "ALPA", "LIBUR"] as const;

type AttendanceStatus = (typeof STATUSES)[number];

type Row = {
  id: number;
  publicId: string;
  karyawanId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  note: string | null;
};

const TODAY = todayJakarta();

const day = (offset: number) => addDays(TODAY, offset);

const row = (
  id: number,
  karyawanId: number,
  offset: number,
  status: AttendanceStatus,
  hours: [string | null, string | null] | null,
  note: string | null = null,
): Row => ({
  id,
  publicId: `abs-${String(id).padStart(4, "0")}`,
  karyawanId,
  date: day(offset),
  checkIn: hours?.[0] ?? null,
  checkOut: hours?.[1] ?? null,
  status,
  note,
});

const SEED: readonly Row[] = [
  row(1, 1, 0, "HADIR", ["07:45", "16:30"]),
  row(2, 2, 0, "HADIR", ["06:30", "15:00"]),
  row(3, 3, 0, "IZIN", null, "Mengurus administrasi bank gereja"),
  row(4, 4, 0, "SAKIT", null, "Surat dokter menyusul"),
  row(5, 1, -1, "HADIR", ["08:00", "17:00"]),
  row(6, 2, -1, "LIBUR", null, "Libur mingguan koster"),
  row(7, 3, -1, "HADIR", ["08:10", "17:05"]),
  row(8, 4, -1, "ALPA", null, "Tidak ada kabar sampai sore"),
  row(9, 1, -2, "CUTI", null, "Cuti tahunan, dicatat manual"),
  row(10, 2, -2, "HADIR", ["06:35", "15:10"]),
  // Lupa absen pulang: null di satu sisi, yang kolomnya render sebagai "—".
  row(11, 3, -2, "HADIR", ["08:00", null]),
  row(12, 4, -3, "HADIR", ["07:55", "16:45"]),
  // Catatan terpanjang TANPA SPASI, sengaja: pedoman §7.3 diukur dengan ini,
  // bukan dengan teks contoh yang punya spasi di tempat yang nyaman.
  row(
    13,
    1,
    -32,
    "HADIR",
    ["08:00", "17:00"],
    "Menggantikanpetugaskebersihanyangberhalanganhadirsekaligusmenyiapkanruangkonsistoriuntukrapatmajelisjemaatpagiharisampaisoretanpajeda",
  ),
  row(14, 2, -33, "HADIR", ["06:30", "15:00"]),
];

const ATTENDANCE: Row[] = SEED.map((item) => ({ ...item }));

/** Benih dimiliki modul yang menyemainya (pedoman §7.2), bukan berkas test. */
export const resetAttendanceRows = () =>
  ATTENDANCE.splice(0, ATTENDANCE.length, ...SEED.map((item) => ({ ...item })));

const nextId = () => Math.max(0, ...ATTENDANCE.map((item) => item.id)) + 1;

const NOT_FOUND = "Absensi Karyawan Tidak Ditemukan";
const KARYAWAN_NOT_FOUND = "Karyawan Tidak Ditemukan";
const FUTURE = "Tanggal Absensi Tidak Boleh Melewati Hari Ini";
const DUPLICATE =
  "Karyawan Ini Sudah Memiliki Absensi Pada Tanggal Tersebut. Ubah Data Yang Ada";

const WALL_CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

const karyawanOf = (id: number) =>
  KARYAWAN.find((person) => person.id === id) ?? null;

const view = (item: Row) => {
  const karyawan = karyawanOf(item.karyawanId);

  return {
    id: item.id,
    publicId: item.publicId,
    karyawanId: item.karyawanId,
    karyawan: karyawan
      ? {
          publicId: karyawan.publicId,
          code: karyawan.code,
          name: karyawan.name,
        }
      : null,
    date: `${item.date}T00:00:00.000Z`,
    checkIn: item.checkIn,
    checkOut: item.checkOut,
    status: item.status,
    note: item.note,
  };
};

const fieldError = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

type Body = {
  karyawanId?: unknown;
  date?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  status?: unknown;
  note?: unknown;
};

const isBlank = (value: unknown) =>
  value === null || value === undefined || value === "";

// `optionalTimeOfDay`: kosong jadi null, terisi tetap harus jam dinding nyata.
// Membaca kosong sebagai "00:00" akan menaruh jam palsu di kolom yang dibaca
// perbandingan.
const parseClock = (value: unknown, label: string, example: string) => {
  if (isBlank(value)) return { value: null as string | null };
  if (typeof value !== "string" || !WALL_CLOCK.test(value)) {
    return {
      failure: fieldError(
        400,
        label === "Jam Masuk" ? "checkIn" : "checkOut",
        `Format ${label} harus HH:mm (contoh: ${example})`,
      ),
    };
  }

  return { value };
};

const parse = (body: Body) => {
  // `formNumber` + refine: field kosong bukan 0.
  const karyawanId = isBlank(body.karyawanId) ? NaN : Number(body.karyawanId);
  if (Number.isNaN(karyawanId)) {
    return {
      failure: fieldError(400, "karyawanId", "Mohon Lengkapi Karyawan"),
    };
  }
  if (!(Number.isInteger(karyawanId) && karyawanId > 0)) {
    return { failure: fieldError(400, "karyawanId", "Karyawan tidak valid") };
  }

  // `formDate`: field kosong itu hilang, bukan `new Date(null)` alias
  // 1970-01-01 — yang dulu lolos penjaga tidak-boleh-masa-depan lalu tersimpan.
  if (isBlank(body.date) || typeof body.date !== "string") {
    return { failure: fieldError(400, "date", "Mohon Lengkapi Tanggal") };
  }
  const date = body.date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { failure: fieldError(400, "date", "Format Tanggal tidak valid") };
  }

  const checkIn = parseClock(body.checkIn, "Jam Masuk", "08:00");
  if (checkIn.failure) return { failure: checkIn.failure };

  const checkOut = parseClock(body.checkOut, "Jam Pulang", "17:00");
  if (checkOut.failure) return { failure: checkOut.failure };

  if (
    checkIn.value !== null &&
    checkOut.value !== null &&
    checkOut.value < checkIn.value
  ) {
    return {
      failure: fieldError(
        400,
        "checkOut",
        "Jam Pulang tidak boleh sebelum Jam Masuk",
      ),
    };
  }

  if (!STATUSES.includes(body.status as AttendanceStatus)) {
    return {
      failure: fieldError(400, "status", "Mohon Lengkapi Status Kehadiran"),
    };
  }
  const status = body.status as AttendanceStatus;

  const note = isBlank(body.note) ? null : collapseSpaces(String(body.note));
  if (note !== null && note.length > 250) {
    return {
      failure: fieldError(
        400,
        "note",
        "Catatan tidak boleh lebih dari 250 karakter",
      ),
    };
  }

  // `resolveHours`: hari yang ditandai LIBUR tapi membawa 08:00–17:00 terbaca
  // sebagai hari kerja, jadi status di luar HADIR memaksa keduanya null.
  const isPresent = status === "HADIR";

  return {
    karyawanId,
    date,
    checkIn: isPresent ? checkIn.value : null,
    checkOut: isPresent ? checkOut.value : null,
    status,
    note: note || null,
  };
};

const assertWritableDay = (
  karyawanId: number,
  date: string,
  exceptId?: number,
) => {
  if (
    process.env.MOCK_ABSENSI_SAVE_ERROR === "karyawan" ||
    !karyawanOf(karyawanId)
  ) {
    return json({ status: 404, error: KARYAWAN_NOT_FOUND }, 404);
  }

  // Dibandingkan sebagai hari kalender di zona organisasi, jadi catatan pagi
  // ini diterima dan tidak ditolak karena "di masa depan".
  if (
    process.env.MOCK_ABSENSI_SAVE_ERROR === "tanggal" ||
    date > todayJakarta()
  ) {
    return fieldError(400, "date", FUTURE);
  }

  const clash = ATTENDANCE.find(
    (item) => item.karyawanId === karyawanId && item.date === date,
  );
  if (
    process.env.MOCK_ABSENSI_SAVE_ERROR === "duplikat" ||
    (clash && clash.id !== exceptId)
  ) {
    return fieldError(409, "date", DUPLICATE);
  }

  return null;
};

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const BASE = "/absensi-karyawan";

// `z.enum` di query: `?status=PENDINGG` ditolak menyebut fieldnya, bukan 400
// generik dari Prisma.
const queryStatus = (url: URL) => {
  const value = url.searchParams.get("status");

  if (!value) return { value: "" };
  if (!STATUSES.includes(value as AttendanceStatus)) {
    return {
      failure: fieldError(400, "status", "Status Kehadiran tidak valid"),
    };
  }

  return { value };
};

const matches = (item: Row, url: URL, status: string) => {
  const karyawanId = Number(url.searchParams.get("karyawanId"));
  const startDate = url.searchParams.get("startDate") ?? "";
  const endDate = url.searchParams.get("endDate") ?? "";

  if (karyawanId && item.karyawanId !== karyawanId) return false;
  if (status && item.status !== status) return false;
  // Masing-masing berdiri sendiri: "sejak tanggal 1" ditanyakan jauh lebih
  // sering daripada rentang tertutup.
  if (startDate && item.date < startDate) return false;
  if (endDate && item.date > endDate) return false;

  return true;
};

const byDateDesc = (a: Row, b: Row) =>
  a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1;

export const absensiKaryawanMock: MockHandler = async (context) => {
  const { request, url, path, method, can } = context;

  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  const publicId = path.match(/^\/absensi-karyawan\/([^/]+)$/)?.[1];

  if (!can(MENU.ABSENSI_KARYAWAN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_ABSENSI_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === BASE && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const failPage = Number(process.env.MOCK_FAIL_PAGE);
    if (failPage && Number(url.searchParams.get("page")) === failPage) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const status = queryStatus(url);
    if (status.failure) return status.failure;

    return list(
      ATTENDANCE.filter((item) => matches(item, url, status.value))
        .sort(byDateDesc)
        .map(view),
      url,
      "Absensi Karyawan",
      "Absensi Karyawan",
    );
  }

  if (path === BASE && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const refused = assertWritableDay(parsed.karyawanId, parsed.date);
    if (refused) return refused;

    const id = nextId();
    const created: Row = {
      id,
      publicId: crypto.randomUUID(),
      karyawanId: parsed.karyawanId,
      date: parsed.date,
      checkIn: parsed.checkIn,
      checkOut: parsed.checkOut,
      status: parsed.status,
      note: parsed.note,
    };
    ATTENDANCE.push(created);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Absensi Karyawan",
        data: view(created),
      },
      201,
    );
  }

  if (!publicId) return null;

  const found = ATTENDANCE.find((item) => item.publicId === publicId);

  if (method === "GET") {
    if (!found) return notFound();

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Absensi Karyawan",
      data: view(found),
    });
  }

  if (method === "PUT") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    if (!found) return notFound();

    // `update` MENULIS `karyawanId`, dan itu aman karena pasangan (karyawan
    // baru, tanggal) diperiksa ulang di sini.
    const refused = assertWritableDay(parsed.karyawanId, parsed.date, found.id);
    if (refused) return refused;

    found.karyawanId = parsed.karyawanId;
    found.date = parsed.date;
    found.checkIn = parsed.checkIn;
    found.checkOut = parsed.checkOut;
    found.status = parsed.status;
    found.note = parsed.note;

    return json({
      status: 200,
      message: "Berhasil Mengubah Absensi Karyawan",
      data: view(found),
    });
  }

  if (method === "DELETE") {
    if (!found) return notFound();
    if (process.env.MOCK_ABSENSI_DELETE_ERROR) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const removed = view(found);
    ATTENDANCE.splice(ATTENDANCE.indexOf(found), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Absensi Karyawan",
      data: removed,
    });
  }

  return null;
};
