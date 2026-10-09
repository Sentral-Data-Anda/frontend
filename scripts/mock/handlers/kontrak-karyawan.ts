/**
 * Tiruan `/api/v1/kontrak-karyawan` (be-sada modul `kontrak_karyawan`).
 * Kunci path `code` (`KTR-0001`), cocok tanpa peduli huruf besar-kecil.
 *
 *   MOCK_500=1                      → daftar menjawab 500
 *   MOCK_EMPTY=1                    → daftar kosong (404, lewat `list`)
 *   MOCK_FAIL_PAGE=3                → halaman 3 daftar menjawab 500
 *   MOCK_KTR_STEPUP=1               → bacaan pertama 403 STEP_UP_REQUIRED,
 *                                     lalu terbuka selama MOCK_STEPUP_EXPIRE_MS
 *   MOCK_KTR_SAVE_ERROR=500         → simpan menjawab 500 (galat tingkat form)
 *                              =karyawan → 404 "Karyawan Tidak Ditemukan"
 *                              =tumpang  → 409 kontrak tumpang-tindih
 *   MOCK_KTR_DELETE_ERROR=1         → hapus menjawab 409 sudah dipakai slip gaji
 *                                     (be-sada `bc20690`)
 *
 * Hibah step-up dev-mock hidup di `scripts/dev-mock.ts` dan tidak sampai ke
 * handler, jadi flag di atas hanya meniru "ditanya sekali per proses".
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { TODAY } from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { KARYAWAN } from "./karyawan";

type ContractType = "TETAP" | "KONTRAK" | "PARUH_WAKTU" | "HONORER";

type Row = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  contractType: ContractType;
  position: string;
  basicSalary: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  weeklyDayOff: number[];
  note: string | null;
  deletedAt: string | null;
};

const YEAR = Number(TODAY.slice(0, 4));

let stepUpUntil = 0;

const contract = (
  id: number,
  karyawanId: number,
  contractType: ContractType,
  position: string,
  salary: string,
  effectiveFrom: string,
  effectiveTo: string | null,
  weeklyDayOff: number[],
  note: string | null = null,
): Row => ({
  id,
  publicId: `ktr-${id}`,
  code: `KTR-${String(id).padStart(4, "0")}`,
  karyawanId,
  contractType,
  position,
  basicSalary: salary,
  effectiveFrom,
  effectiveTo,
  weeklyDayOff,
  note,
  deletedAt: null,
});

const seedRows = (): Row[] => [
  contract(
    1,
    1,
    "TETAP",
    "Koster",
    "4500000.00",
    `${YEAR}-01-01`,
    null,
    [1],
    "Perpanjangan dari masa kerja sebelumnya.",
  ),
  contract(
    2,
    2,
    "TETAP",
    "Administrasi Kantor",
    "3200000.00",
    `${YEAR}-01-01`,
    null,
    [1, 2],
  ),
  contract(
    3,
    3,
    "KONTRAK",
    "Petugas Keamanan",
    "5750000.00",
    `${YEAR}-03-01`,
    `${YEAR}-12-31`,
    [6, 0],
  ),
  // Dicatat sebelum kolom libur mingguan ada: larik kosong, dan layarnya
  // menandainya supaya dilengkapi.
  contract(
    4,
    4,
    "PARUH_WAKTU",
    "Pengasuh Sekolah Minggu",
    "1800000.00",
    `${YEAR}-04-01`,
    null,
    [],
  ),
  contract(
    5,
    1,
    "KONTRAK",
    "Staf Administrasi",
    "3900000.00",
    `${YEAR - 1}-01-01`,
    `${YEAR - 1}-12-31`,
    [1],
  ),
  contract(
    6,
    3,
    "TETAP",
    "Petugas Keamanan",
    "6250000.00",
    `${YEAR + 1}-01-01`,
    null,
    [6, 0],
  ),
];

export const KARYAWAN_CONTRACT: Row[] = seedRows();

// Benih dimiliki modul yang menyemainya: berkas test memanggil ini, bukan
// menyimpan snapshot sendiri (pedoman §7.2).
export const resetKontrakKaryawan = () => {
  stepUpUntil = 0;
  KARYAWAN_CONTRACT.splice(0, KARYAWAN_CONTRACT.length, ...seedRows());
};

const isLive = (row: Row) => row.deletedAt === null;

const nextId = (rows: Row[]) =>
  rows.reduce((top, row) => Math.max(top, row.id), 0) + 1;

const asDate = (value: string) => `${value}T00:00:00.000Z`;

const karyawanOf = (id: number) =>
  KARYAWAN.find((person) => person.id === id) ?? null;

const contractView = (row: Row) => {
  const person = karyawanOf(row.karyawanId);

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    karyawanId: row.karyawanId,
    contractType: row.contractType,
    position: row.position,
    basicSalary: row.basicSalary,
    effectiveFrom: asDate(row.effectiveFrom),
    effectiveTo: row.effectiveTo === null ? null : asDate(row.effectiveTo),
    weeklyDayOff: row.weeklyDayOff,
    note: row.note,
    karyawan: person
      ? { publicId: person.publicId, code: person.code, name: person.name }
      : null,
  };
};

const fail = (status: number, error: string, path?: string) =>
  json(
    path
      ? { status, error, issues: [{ path, message: error }] }
      : { status, error },
    status,
  );

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const CONTRACT_TYPES: ContractType[] = [
  "TETAP",
  "KONTRAK",
  "PARUH_WAKTU",
  "HONORER",
];

const MONEY_MAX = 9_999_999_999_999;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const isStepUpBlocked = () => {
  if (!process.env.MOCK_KTR_STEPUP) return false;
  if (Date.now() < stepUpUntil) return false;

  stepUpUntil =
    Date.now() + Number(process.env.MOCK_STEPUP_EXPIRE_MS ?? 300_000);

  return true;
};

const stepUpRequired = () =>
  json(
    {
      status: 403,
      error: "Verifikasi Password Diperlukan",
      code: "STEP_UP_REQUIRED",
    },
    403,
  );

type Body = {
  karyawanId?: unknown;
  contractType?: unknown;
  position?: unknown;
  basicSalary?: unknown;
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  weeklyDayOff?: unknown;
  note?: unknown;
};

const readDays = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseBody = (body: Body) => {
  const karyawanId = Number(body.karyawanId);

  if (!Number.isInteger(karyawanId) || karyawanId <= 0) {
    return { failure: fail(400, "Mohon Lengkapi Karyawan", "karyawanId") };
  }

  if (!CONTRACT_TYPES.includes(body.contractType as ContractType)) {
    return {
      failure: fail(400, "Mohon Lengkapi Jenis Kontrak", "contractType"),
    };
  }

  const position = collapseSpaces(String(body.position ?? ""));

  if (!position)
    return { failure: fail(400, "Mohon Lengkapi Jabatan", "position") };
  if (position.length > 100) {
    return {
      failure: fail(
        400,
        "Jabatan tidak boleh lebih dari 100 karakter",
        "position",
      ),
    };
  }

  const salary = Number(body.basicSalary);

  if (
    body.basicSalary === null ||
    body.basicSalary === undefined ||
    body.basicSalary === "" ||
    Number.isNaN(salary)
  ) {
    return { failure: fail(400, "Mohon Lengkapi Gaji Pokok", "basicSalary") };
  }
  if (salary <= 0) {
    return {
      failure: fail(400, "Gaji Pokok harus lebih dari 0", "basicSalary"),
    };
  }
  if (salary > MONEY_MAX) {
    return {
      failure: fail(
        400,
        `Gaji Pokok tidak boleh lebih dari ${MONEY_MAX.toLocaleString("id-ID")}`,
        "basicSalary",
      ),
    };
  }
  if ((String(body.basicSalary).split(".")[1] ?? "").length > 2) {
    return {
      failure: fail(
        400,
        "Gaji Pokok maksimal 2 angka di belakang koma",
        "basicSalary",
      ),
    };
  }

  const effectiveFrom = String(body.effectiveFrom ?? "").slice(0, 10);

  if (!DATE_ONLY.test(effectiveFrom)) {
    return {
      failure: fail(400, "Mohon Lengkapi Berlaku Dari", "effectiveFrom"),
    };
  }

  const effectiveTo =
    body.effectiveTo === null ||
    body.effectiveTo === undefined ||
    body.effectiveTo === ""
      ? null
      : String(body.effectiveTo).slice(0, 10);

  if (effectiveTo !== null && !DATE_ONLY.test(effectiveTo)) {
    return {
      failure: fail(400, "Format Berlaku Sampai tidak valid", "effectiveTo"),
    };
  }
  if (effectiveTo !== null && effectiveTo < effectiveFrom) {
    return {
      failure: fail(
        400,
        "Berlaku Sampai tidak boleh sebelum Berlaku Dari",
        "effectiveTo",
      ),
    };
  }

  const days = readDays(body.weeklyDayOff);

  if (!Array.isArray(days) || days.length === 0) {
    return {
      failure: fail(400, "Mohon Lengkapi Libur Mingguan", "weeklyDayOff"),
    };
  }

  const weeklyDayOff = days.map(Number);

  if (
    weeklyDayOff.some(
      (day) =>
        !Number.isInteger(day) || day < 0 || day > 6 || Number.isNaN(day),
    )
  ) {
    return {
      failure: fail(400, "Libur Mingguan tidak valid", "weeklyDayOff"),
    };
  }
  if (new Set(weeklyDayOff).size !== weeklyDayOff.length) {
    return {
      failure: fail(
        400,
        "Libur Mingguan tidak boleh memuat hari yang sama dua kali",
        "weeklyDayOff",
      ),
    };
  }

  const note =
    body.note === null || body.note === undefined || body.note === ""
      ? null
      : collapseSpaces(String(body.note));

  if (note !== null && note.length > 250) {
    return {
      failure: fail(400, "Catatan tidak boleh lebih dari 250 karakter", "note"),
    };
  }

  return {
    row: {
      karyawanId,
      contractType: body.contractType as ContractType,
      position,
      basicSalary: salary.toFixed(2),
      effectiveFrom,
      effectiveTo,
      weeklyDayOff,
      note,
    },
  };
};

const isOverlapping = (
  row: {
    karyawanId: number;
    effectiveFrom: string;
    effectiveTo: string | null;
  },
  skipId: number | null,
) =>
  KARYAWAN_CONTRACT.some((other) => {
    if (!isLive(other) || other.id === skipId) return false;
    if (other.karyawanId !== row.karyawanId) return false;

    const endsAfterStart =
      other.effectiveTo === null || other.effectiveTo >= row.effectiveFrom;
    const startsBeforeEnd =
      row.effectiveTo === null || other.effectiveFrom <= row.effectiveTo;

    return endsAfterStart && startsBeforeEnd;
  });

const overlapError = () =>
  json(
    {
      status: 409,
      error:
        "Karyawan ini sudah memiliki kontrak pada periode yang dipilih. Ubah periodenya atau hapus kontrak yang lama",
    },
    409,
  );

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const BASE = "/kontrak-karyawan";

export const kontrakKaryawanMock: MockHandler = async (context) => {
  const { request, url, path, method, can } = context;

  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  if (!can(MENU.EMPLOYEE_CONTRACT, actionOf(method))) return denied();

  if (method === "GET" && isStepUpBlocked()) return stepUpRequired();

  if (method !== "GET" && process.env.MOCK_KTR_SAVE_ERROR === "500") {
    return serverError();
  }

  if (path === BASE && method === "GET") {
    if (process.env.MOCK_500) return serverError();
    if (
      process.env.MOCK_FAIL_PAGE &&
      url.searchParams.get("page") === process.env.MOCK_FAIL_PAGE
    ) {
      return serverError();
    }

    const karyawanId = Number(url.searchParams.get("karyawanId")) || 0;
    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    const rows = KARYAWAN_CONTRACT.filter((row) => {
      if (!isLive(row)) return false;
      if (karyawanId && row.karyawanId !== karyawanId) return false;
      if (!filter) return true;

      const name = karyawanOf(row.karyawanId)?.name ?? "";

      return (
        row.code.toLowerCase().includes(filter) ||
        row.position.toLowerCase().includes(filter) ||
        name.toLowerCase().includes(filter)
      );
    })
      .slice()
      .sort(
        (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.id - a.id,
      )
      .map(contractView);

    return list(rows, url, "Kontrak Karyawan", "Kontrak Karyawan");
  }

  if (path === BASE && method === "POST") {
    const parsed = parseBody(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    if (
      process.env.MOCK_KTR_SAVE_ERROR === "karyawan" ||
      !karyawanOf(parsed.row.karyawanId)
    ) {
      return fail(404, "Karyawan Tidak Ditemukan");
    }

    if (
      process.env.MOCK_KTR_SAVE_ERROR === "tumpang" ||
      isOverlapping(parsed.row, null)
    ) {
      return overlapError();
    }

    const id = nextId(KARYAWAN_CONTRACT);
    const row: Row = {
      id,
      publicId: crypto.randomUUID(),
      code: `KTR-${String(id).padStart(4, "0")}`,
      ...parsed.row,
      deletedAt: null,
    };
    KARYAWAN_CONTRACT.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Kontrak Karyawan",
        data: contractView(row),
      },
      201,
    );
  }

  const code = path.match(/^\/kontrak-karyawan\/([^/]+)$/)?.[1];
  if (!code) return null;

  const row = KARYAWAN_CONTRACT.find(
    (item) =>
      isLive(item) &&
      item.code.toLowerCase() === decodeURIComponent(code).toLowerCase(),
  );
  if (!row) return fail(404, "Kontrak Karyawan Tidak Ditemukan");

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Kontrak Karyawan",
      data: contractView(row),
    });
  }

  if (method === "PUT") {
    const parsed = parseBody(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    if (parsed.row.karyawanId !== row.karyawanId) {
      return fail(
        400,
        "Kontrak Ini Tidak Dapat Dipindahkan Ke Karyawan Lain. Hapus Kontrak Ini Dan Buat Yang Baru",
      );
    }

    if (
      process.env.MOCK_KTR_SAVE_ERROR === "tumpang" ||
      isOverlapping(parsed.row, row.id)
    ) {
      return overlapError();
    }

    Object.assign(row, parsed.row);

    return json({
      status: 200,
      message: "Berhasil Mengubah Kontrak Karyawan",
      data: contractView(row),
    });
  }

  if (method === "DELETE") {
    if (process.env.MOCK_KTR_DELETE_ERROR) {
      return fail(
        409,
        "Kontrak Ini Sudah Dipakai Oleh Slip Gaji Dan Tidak Dapat Dihapus",
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Kontrak Karyawan",
      data: contractView(row),
    });
  }

  return null;
};
