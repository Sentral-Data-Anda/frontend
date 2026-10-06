/**
 * Tiruan `/api/v1/tipe-cuti` dan `/api/v1/ddl/tipe-cuti`
 * (be-sada `modules/tipe_cuti` + `dropdown_list`).
 *
 *   MOCK_EMPTY=1                  → daftar kosong (404) — keadaan hari pertama
 *   MOCK_500=1                    → daftar menjawab 500
 *   MOCK_TIPE_CUTI_SAVE_ERROR=500 → POST/PUT/DELETE menjawab 500
 *   MOCK_TIPE_CUTI_IN_USE=1       → DELETE ditolak "Nonaktifkan Saja"
 *   MOCK_DDL_EMPTY=1              → `/ddl/tipe-cuti` kosong (404)
 *
 * Benih ada di sini, bukan di store bersama: ia satu-satunya larik tipe cuti di
 * mock, dan handler Cuti mengimpornya dari sini (pedoman §7.2 — benih dimiliki
 * modul yang menyemainya).
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { denied, json, list, readBody, type MockHandler } from "../kit";

export type LeaveTypeRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
  deletedAt: string | null;
};

const row = (
  id: number,
  name: string,
  maxDaysPerYear: number | null,
  isPaid: boolean,
  isActive: boolean,
): LeaveTypeRow => ({
  id,
  publicId: `tct-${String(id).padStart(4, "0")}`,
  code: `TCT-${String(id).padStart(4, "0")}`,
  name,
  maxDaysPerYear,
  isPaid,
  isActive,
  deletedAt: null,
});

const SEED: readonly LeaveTypeRow[] = [
  row(1, "Cuti Tahunan", 12, true, true),
  row(2, "Cuti Sakit", 14, true, true),
  row(3, "Cuti Melahirkan", null, true, true),
  row(4, "Cuti Menikah", 3, true, true),
  row(5, "Cuti Duka", 2, true, true),
  row(6, "Cuti Di Luar Tanggungan", 30, false, true),
  row(7, "Izin Tidak Dibayar", 5, false, false),
];

export const LEAVE_TYPE: LeaveTypeRow[] = SEED.map((item) => ({ ...item }));

/**
 * Pedoman §7.2: benih dimiliki modul yang menyemainya. Berkas test memakai ini
 * dan TIDAK menyimpan snapshot sendiri — snapshot yang diambil saat sebuah
 * berkas dimuat merekam apa pun yang berkas sebelumnya tinggalkan.
 */
export const resetLeaveTypes = () => {
  LEAVE_TYPE.length = 0;
  LEAVE_TYPE.push(...SEED.map((item) => ({ ...item })));
};

export const leaveTypeSeed = () => SEED.map((item) => ({ ...item }));

export const isLiveLeaveType = (item: LeaveTypeRow) => item.deletedAt === null;

const nextId = () => Math.max(0, ...LEAVE_TYPE.map((item) => item.id)) + 1;

const NOT_FOUND = "Tipe Cuti Tidak Ditemukan";
const TAKEN = "Tipe Cuti Sudah Tersedia";
const IN_USE =
  "Tipe Cuti Ini Sudah Dipakai Oleh Pengajuan Cuti. Nonaktifkan Saja, Jangan Dihapus";

const view = ({
  id,
  publicId,
  code,
  name,
  maxDaysPerYear,
  isPaid,
  isActive,
}: LeaveTypeRow) => ({
  id,
  publicId,
  code,
  name,
  maxDaysPerYear,
  isPaid,
  isActive,
});

const byName = (a: LeaveTypeRow, b: LeaveTypeRow) =>
  a.name.localeCompare(b.name, "id");

const findRow = (code: string) =>
  LEAVE_TYPE.find(
    (item) =>
      isLiveLeaveType(item) && item.code.toLowerCase() === code.toLowerCase(),
  );

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const fieldError = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

type Body = {
  name?: unknown;
  maxDaysPerYear?: unknown;
  isPaid?: unknown;
  isActive?: unknown;
};

const asBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["true", "1", "on", "yes"].includes(text)) return true;
    if (["false", "0", "off", "no", ""].includes(text)) return false;
  }

  return null;
};

const parse = (body: Body) => {
  if (typeof body.name !== "string" || collapseSpaces(body.name).length < 1) {
    return {
      failure: fieldError(400, "name", "Mohon Lengkapi Nama Tipe Cuti"),
    };
  }

  const name = collapseSpaces(body.name);
  if (name.length > 50) {
    return {
      failure: fieldError(
        400,
        "name",
        "Nama Tipe Cuti tidak boleh lebih dari 50 karakter",
      ),
    };
  }

  // `optionalFormNumber`: kosong atau null jadi null (tanpa batas); nol dan
  // pecahan ditolak, karena nol berarti tipe yang tidak pernah bisa diambil.
  const isBlank =
    body.maxDaysPerYear === null ||
    body.maxDaysPerYear === undefined ||
    body.maxDaysPerYear === "";
  const maxDaysPerYear = isBlank ? null : Number(body.maxDaysPerYear);

  if (
    maxDaysPerYear !== null &&
    !(Number.isInteger(maxDaysPerYear) && maxDaysPerYear > 0)
  ) {
    return {
      failure: fieldError(
        400,
        "maxDaysPerYear",
        "Jatah Hari Per Tahun harus bilangan bulat lebih dari 0",
      ),
    };
  }

  const isPaid = asBoolean(body.isPaid);
  if (isPaid === null) {
    return {
      failure: fieldError(400, "isPaid", "Mohon Lengkapi Status Dibayar"),
    };
  }

  const isActive = asBoolean(body.isActive);
  if (isActive === null) {
    return {
      failure: fieldError(400, "isActive", "Mohon Lengkapi Status Aktif"),
    };
  }

  return { name, maxDaysPerYear, isPaid, isActive };
};

const isNameTaken = (name: string, exceptId?: number) =>
  LEAVE_TYPE.some(
    (item) =>
      isLiveLeaveType(item) &&
      item.id !== exceptId &&
      item.name.toLowerCase() === name.toLowerCase(),
  );

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

// `ddlLimit` be-sada: limit yang absen atau < 1 berarti TANPA `take` — semua
// baris, bukan 20. Combobox yang mengandalkan bawaan diam-diam akan melihat
// potongan berbeda di mock dan di produksi.
const ddlLimit = (url: URL) => {
  const requested = Number(url.searchParams.get("limit"));

  if (!Number.isFinite(requested) || requested < 1) return undefined;

  return Math.min(Math.trunc(requested), 100);
};

// Hanya aktif + hidup, dan membawa `isPaid` + `maxDaysPerYear` supaya form Cuti
// merender jatahnya tanpa bacaan kedua. Daftar pengelolaan sengaja TIDAK
// menyaring yang tidak aktif — di situ ia dirawat.
const ddl = (url: URL) => {
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
  const take = ddlLimit(url);

  // `OR [code, name]`, bukan nama saja: mengetik TCT-0003 di combobox menemukan
  // barisnya di be-sada, dan harus menemukannya di sini juga.
  const matched = process.env.MOCK_DDL_EMPTY
    ? []
    : LEAVE_TYPE.filter(
        (item) =>
          isLiveLeaveType(item) &&
          item.isActive &&
          (item.name.toLowerCase().includes(filter) ||
            item.code.toLowerCase().includes(filter)),
      ).sort(byName);

  const rows = (take === undefined ? matched : matched.slice(0, take)).map(
    ({ id, code, name, maxDaysPerYear, isPaid }) => ({
      id,
      code,
      name,
      maxDaysPerYear,
      isPaid,
    }),
  );

  if (rows.length === 0) return notFound();

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Semua Tipe Cuti",
    data: rows,
  });
};

export const tipeCutiMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/tipe-cuti" && method === "GET") {
    if (!can(MENU.TIPE_CUTI, "VIEW") && !can(MENU.CUTI, "VIEW")) {
      return denied();
    }

    return ddl(url);
  }

  if (path !== "/tipe-cuti" && !path.startsWith("/tipe-cuti/")) return null;

  const code = path.match(/^\/tipe-cuti\/([^/]+)$/)?.[1];

  if (!can(MENU.TIPE_CUTI, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_TIPE_CUTI_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/tipe-cuti" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      LEAVE_TYPE.filter(
        (item) =>
          isLiveLeaveType(item) && item.name.toLowerCase().includes(filter),
      )
        .sort(byName)
        .map(view),
      url,
      "Tipe Cuti",
      "Tipe Cuti",
    );
  }

  if (path === "/tipe-cuti" && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.name)) return fieldError(409, "name", TAKEN);

    const id = nextId();
    const created: LeaveTypeRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `TCT-${String(id).padStart(4, "0")}`,
      name: parsed.name,
      maxDaysPerYear: parsed.maxDaysPerYear,
      isPaid: parsed.isPaid,
      isActive: parsed.isActive,
      deletedAt: null,
    };
    LEAVE_TYPE.push(created);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Tipe Cuti",
        data: view(created),
      },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const found = findRow(code);
    if (!found) return notFound();

    // Duplikat ditanyakan hanya bila namanya berpindah; tanpa itu ia menemukan
    // baris ini sendiri dan menolak suntingan yang mengubah hal lain.
    const isRenamed = parsed.name.toLowerCase() !== found.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.name, found.id)) {
      return fieldError(409, "name", TAKEN);
    }

    found.name = parsed.name;
    found.maxDaysPerYear = parsed.maxDaysPerYear;
    found.isPaid = parsed.isPaid;
    found.isActive = parsed.isActive;

    return json({
      status: 200,
      message: "Berhasil Mengubah Tipe Cuti",
      data: view(found),
    });
  }

  const found = findRow(code);
  if (!found) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Tipe Cuti",
      data: view(found),
    });
  }

  if (method === "DELETE") {
    if (process.env.MOCK_TIPE_CUTI_IN_USE) {
      return json({ status: 400, error: IN_USE }, 400);
    }

    found.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Tipe Cuti",
      data: view(found),
    });
  }

  return null;
};
