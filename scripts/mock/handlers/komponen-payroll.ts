/**
 * Tiruan `/api/v1/komponen-payroll` (katalog + penetapan per karyawan) dan
 * `GET /ddl/komponen-payroll`.
 *
 * Roster karyawan dan `GET /ddl/karyawan` dimiliki `karyawan.ts` — pedoman
 * §7.2, benih dimiliki modul yang menyemainya.
 *
 *   MOCK_EMPTY=1                      → kedua daftar kosong (404)
 *   MOCK_500=1                        → kedua daftar menjawab 500
 *   MOCK_DDL_EMPTY=1                  → /ddl/komponen-payroll kosong (404)
 *   MOCK_KPY_SAVE_ERROR=500           → POST/PUT/DELETE menjawab 500
 *   MOCK_KPY_IN_USE=slip|penetapan    → hapus komponen ditolak dengan alasan itu
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { TODAY, accountOf } from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { KARYAWAN } from "./karyawan";

const PPH21 = "PPH21";

type ComponentType = "EARNING" | "DEDUCTION";

type CalculationType = "FIXED" | "PERCENTAGE";

type ComponentRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: string | null;
  isTaxable: boolean;
  isActive: boolean;
  accountId: number | null;
  deletedAt: string | null;
};

type AssignmentRow = {
  id: number;
  publicId: string;
  karyawanId: number;
  payrollComponentId: number;
  value: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  deletedAt: string | null;
};

const YEAR = TODAY.slice(0, 4);

const component = (
  id: number,
  code: string,
  name: string,
  type: ComponentType,
  calculationType: CalculationType,
  defaultValue: string | null,
  accountId: number | null,
  extra: Partial<ComponentRow> = {},
): ComponentRow => ({
  id,
  publicId: `kpy-${id}`,
  code,
  name,
  type,
  calculationType,
  defaultValue,
  isTaxable: type === "EARNING",
  isActive: true,
  accountId,
  deletedAt: null,
  ...extra,
});

// Baris PPH21 disemai migrasi be-sada, jadi ia ada di mock juga: layarnya
// menampilkannya terkunci, dan itu yang perlu bisa dilihat saat review.
export const PAYROLL_COMPONENT: ComponentRow[] = [
  component(
    1,
    "KPY-0001",
    "Tunjangan Transport",
    "EARNING",
    "FIXED",
    "350000.00",
    23,
  ),
  component(2, "KPY-0002", "Tunjangan Jabatan", "EARNING", "FIXED", null, 23),
  component(
    3,
    "KPY-0003",
    "Tunjangan Beras Keluarga Besar Sekali",
    "EARNING",
    "FIXED",
    "150000.00",
    null,
  ),
  component(
    4,
    "KPY-0004",
    "Iuran BPJS Kesehatan",
    "DEDUCTION",
    "PERCENTAGE",
    "1.00",
    12,
  ),
  component(
    5,
    "KPY-0005",
    "Potongan Koperasi",
    "DEDUCTION",
    "FIXED",
    "100000.00",
    null,
    {
      isActive: false,
    },
  ),
  component(6, PPH21, "PPh21", "DEDUCTION", "FIXED", null, null, {
    isTaxable: false,
  }),
];

export const KARYAWAN_PAYROLL_COMPONENT: AssignmentRow[] = [
  {
    id: 1,
    publicId: "kkp-1",
    karyawanId: 1,
    payrollComponentId: 1,
    value: null,
    effectiveFrom: `${YEAR}-01-01`,
    effectiveTo: null,
    deletedAt: null,
  },
  {
    id: 2,
    publicId: "kkp-2",
    karyawanId: 1,
    payrollComponentId: 2,
    value: "750000.00",
    effectiveFrom: `${YEAR}-01-01`,
    effectiveTo: `${YEAR}-06-30`,
    deletedAt: null,
  },
  {
    id: 3,
    publicId: "kkp-3",
    karyawanId: 2,
    payrollComponentId: 4,
    value: "2.00",
    effectiveFrom: `${YEAR}-02-01`,
    effectiveTo: null,
    deletedAt: null,
  },
  {
    id: 4,
    publicId: "kkp-4",
    karyawanId: 3,
    payrollComponentId: 1,
    value: "500000.00",
    effectiveFrom: `${YEAR}-03-01`,
    effectiveTo: null,
    deletedAt: null,
  },
  // Komponen 5 nonaktif: penetapannya berhenti dibayar tapi tetap terdaftar.
  {
    id: 5,
    publicId: "kkp-5",
    karyawanId: 4,
    payrollComponentId: 5,
    value: null,
    effectiveFrom: `${YEAR}-04-01`,
    effectiveTo: null,
    deletedAt: null,
  },
];

const isLive = (row: { deletedAt: string | null }) => row.deletedAt === null;

const nextId = (rows: { id: number }[]) =>
  rows.reduce((top, row) => Math.max(top, row.id), 0) + 1;

const asDate = (value: string) => `${value}T00:00:00.000Z`;

const componentView = (row: ComponentRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  type: row.type,
  calculationType: row.calculationType,
  defaultValue: row.defaultValue,
  isTaxable: row.isTaxable,
  isActive: row.isActive,
  accountId: row.accountId,
});

const assignmentView = (row: AssignmentRow) => {
  const karyawan = KARYAWAN.find((person) => person.id === row.karyawanId);
  const target = PAYROLL_COMPONENT.find(
    (item) => item.id === row.payrollComponentId,
  );

  return {
    id: row.id,
    publicId: row.publicId,
    karyawanId: row.karyawanId,
    payrollComponentId: row.payrollComponentId,
    value: row.value,
    effectiveFrom: asDate(row.effectiveFrom),
    effectiveTo: row.effectiveTo === null ? null : asDate(row.effectiveTo),
    karyawan: karyawan
      ? {
          publicId: karyawan.publicId,
          code: karyawan.code,
          name: karyawan.name,
        }
      : null,
    payrollComponent: target
      ? {
          publicId: target.publicId,
          code: target.code,
          name: target.name,
          type: target.type,
          calculationType: target.calculationType,
          defaultValue: target.defaultValue,
          isActive: target.isActive,
        }
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

const findComponent = (code: string) =>
  PAYROLL_COMPONENT.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const findAssignment = (publicId: string) =>
  KARYAWAN_PAYROLL_COMPONENT.find(
    (row) => isLive(row) && row.publicId === publicId,
  );

const toMoney = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : Number(value);

type ComponentBody = {
  name?: unknown;
  type?: unknown;
  calculationType?: unknown;
  defaultValue?: unknown;
  isTaxable?: unknown;
  isActive?: unknown;
  accountId?: unknown;
};

const parseComponent = (body: ComponentBody) => {
  const name = collapseSpaces(String(body.name ?? ""));

  if (!name)
    return { failure: fail(400, "Mohon Lengkapi Nama Komponen", "name") };
  if (name.length > 100) {
    return {
      failure: fail(
        400,
        "Nama Komponen tidak boleh lebih dari 100 karakter",
        "name",
      ),
    };
  }

  if (body.type !== "EARNING" && body.type !== "DEDUCTION") {
    return { failure: fail(400, "Mohon Lengkapi Jenis Komponen", "type") };
  }

  if (
    body.calculationType !== "FIXED" &&
    body.calculationType !== "PERCENTAGE"
  ) {
    return {
      failure: fail(400, "Mohon Lengkapi Cara Hitung", "calculationType"),
    };
  }

  const defaultValue = toMoney(body.defaultValue);

  if (defaultValue !== null && !(defaultValue > 0)) {
    return {
      failure: fail(400, "Nilai Default harus lebih dari 0", "defaultValue"),
    };
  }

  if (
    body.calculationType === "PERCENTAGE" &&
    defaultValue !== null &&
    defaultValue > 100
  ) {
    return {
      failure: fail(
        400,
        "Nilai Default untuk komponen persentase tidak boleh lebih dari 100",
        "defaultValue",
      ),
    };
  }

  const accountId =
    body.accountId === null ||
    body.accountId === undefined ||
    body.accountId === ""
      ? null
      : Number(body.accountId);

  if (accountId !== null && !(Number.isInteger(accountId) && accountId > 0)) {
    return { failure: fail(400, "Akun tidak valid", "accountId") };
  }

  if (accountId !== null) {
    const account = accountOf(accountId);

    if (!account)
      return { failure: fail(404, "Akun Tidak Ditemukan", "accountId") };
    if (!account.isActive) {
      return {
        failure: fail(
          400,
          `Akun ${account.code} Sudah Tidak Aktif`,
          "accountId",
        ),
      };
    }
  }

  const type: ComponentType = body.type;
  const calculationType: CalculationType = body.calculationType;

  return {
    row: {
      name,
      type,
      calculationType,
      defaultValue: defaultValue === null ? null : defaultValue.toFixed(2),
      isTaxable: body.isTaxable === true,
      isActive: body.isActive === true,
      accountId,
    },
  };
};

type AssignmentBody = {
  karyawanId?: unknown;
  payrollComponentId?: unknown;
  value?: unknown;
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
};

const parseAssignment = (body: AssignmentBody) => {
  const karyawanId = Number(body.karyawanId);
  const payrollComponentId = Number(body.payrollComponentId);

  if (!Number.isInteger(karyawanId) || karyawanId <= 0) {
    return { failure: fail(400, "Mohon Lengkapi Karyawan", "karyawanId") };
  }
  if (!Number.isInteger(payrollComponentId) || payrollComponentId <= 0) {
    return {
      failure: fail(
        400,
        "Mohon Lengkapi Komponen Payroll",
        "payrollComponentId",
      ),
    };
  }

  const effectiveFrom = String(body.effectiveFrom ?? "").slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
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

  if (effectiveTo !== null && effectiveTo < effectiveFrom) {
    return {
      failure: fail(
        400,
        "Berlaku Sampai tidak boleh sebelum Berlaku Dari",
        "effectiveTo",
      ),
    };
  }

  const value = toMoney(body.value);

  if (value !== null && !(value > 0)) {
    return { failure: fail(400, "Nilai harus lebih dari 0", "value") };
  }

  const target = PAYROLL_COMPONENT.find(
    (row) => isLive(row) && row.id === payrollComponentId,
  );
  if (!target)
    return { failure: fail(404, "Komponen Payroll Tidak Ditemukan") };

  if (!KARYAWAN.some((person) => person.id === karyawanId)) {
    return { failure: fail(404, "Karyawan Tidak Ditemukan") };
  }

  if (value === null && target.defaultValue === null) {
    return {
      failure: fail(
        400,
        "Nilai Komponen Harus Diisi Karena Komponen Ini Tidak Punya Nilai Default",
        "value",
      ),
    };
  }

  return {
    row: {
      karyawanId,
      payrollComponentId,
      value: value === null ? null : value.toFixed(2),
      effectiveFrom,
      effectiveTo,
    },
  };
};

const isOverlapping = (
  row: {
    karyawanId: number;
    payrollComponentId: number;
    effectiveFrom: string;
    effectiveTo: string | null;
  },
  skipId: number | null,
) =>
  KARYAWAN_PAYROLL_COMPONENT.some((other) => {
    if (!isLive(other) || other.id === skipId) return false;
    if (other.karyawanId !== row.karyawanId) return false;
    if (other.payrollComponentId !== row.payrollComponentId) return false;

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
        "Karyawan ini sudah mendapat komponen tersebut pada periode yang dipilih. Ubah periodenya atau akhiri penetapan yang lama",
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

const BASE = "/komponen-payroll";

export const komponenPayrollMock: MockHandler = async (context) => {
  const { request, url, path, method, can } = context;

  if (path === "/ddl/komponen-payroll" && method === "GET") {
    if (!can(MENU.KOMPONEN_PAYROLL, "VIEW")) return denied();
    if (process.env.MOCK_DDL_EMPTY) {
      return json(
        { status: 404, error: "Komponen Payroll Tidak Ditemukan" },
        404,
      );
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const rows = PAYROLL_COMPONENT.filter(
      (row) =>
        isLive(row) &&
        row.isActive &&
        row.code !== PPH21 &&
        (row.name.toLowerCase().includes(filter) ||
          row.code.toLowerCase().includes(filter)),
    );

    if (rows.length === 0) {
      return json(
        { status: 404, error: "Komponen Payroll Tidak Ditemukan" },
        404,
      );
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Komponen Payroll",
      data: rows
        .slice()
        .sort(
          (a, b) =>
            a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "id"),
        )
        .map(({ id, code, name, type, calculationType, defaultValue }) => ({
          id,
          code,
          name,
          type,
          calculationType,
          defaultValue,
        })),
    });
  }

  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  if (!can(MENU.KOMPONEN_PAYROLL, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_KPY_SAVE_ERROR === "500") {
    return serverError();
  }

  const assignmentKey = path.match(
    /^\/komponen-payroll\/karyawan\/([^/]+)$/,
  )?.[1];

  if (path === `${BASE}/karyawan` && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const karyawanId = Number(url.searchParams.get("karyawanId")) || 0;
    const componentId = Number(url.searchParams.get("payrollComponentId")) || 0;

    const rows = KARYAWAN_PAYROLL_COMPONENT.filter(
      (row) =>
        isLive(row) &&
        (!karyawanId || row.karyawanId === karyawanId) &&
        (!componentId || row.payrollComponentId === componentId),
    )
      .slice()
      .sort(
        (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.id - a.id,
      )
      .map(assignmentView);

    return list(rows, url, "Komponen Karyawan", "Komponen Karyawan");
  }

  if (path === `${BASE}/karyawan` && method === "POST") {
    const parsed = parseAssignment(await readBody<AssignmentBody>(request));
    if (parsed.failure) return parsed.failure;
    if (isOverlapping(parsed.row, null)) return overlapError();

    const id = nextId(KARYAWAN_PAYROLL_COMPONENT);
    const row: AssignmentRow = {
      id,
      publicId: crypto.randomUUID(),
      ...parsed.row,
      deletedAt: null,
    };
    KARYAWAN_PAYROLL_COMPONENT.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Komponen Karyawan",
        data: assignmentView(row),
      },
      201,
    );
  }

  if (assignmentKey) {
    const row = findAssignment(assignmentKey);
    if (!row) return fail(404, "Komponen Karyawan Tidak Ditemukan");

    if (method === "GET") {
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Komponen Karyawan",
        data: assignmentView(row),
      });
    }

    if (method === "PUT") {
      const parsed = parseAssignment(await readBody<AssignmentBody>(request));
      if (parsed.failure) return parsed.failure;

      if (
        parsed.row.karyawanId !== row.karyawanId ||
        parsed.row.payrollComponentId !== row.payrollComponentId
      ) {
        return fail(
          400,
          "Karyawan Dan Komponen Pada Penetapan Ini Tidak Dapat Dipindahkan. Hapus Penetapan Ini Dan Buat Yang Baru",
        );
      }

      if (isOverlapping(parsed.row, row.id)) return overlapError();

      row.value = parsed.row.value;
      row.effectiveFrom = parsed.row.effectiveFrom;
      row.effectiveTo = parsed.row.effectiveTo;

      return json({
        status: 200,
        message: "Berhasil Memperbarui Komponen Karyawan",
        data: assignmentView(row),
      });
    }

    if (method === "DELETE") {
      row.deletedAt = new Date().toISOString();

      return json({
        status: 200,
        message: "Berhasil Menghapus Komponen Karyawan",
        data: assignmentView(row),
      });
    }

    return null;
  }

  if (path === BASE && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const type = url.searchParams.get("type") ?? "";

    if (type && type !== "EARNING" && type !== "DEDUCTION") {
      return fail(400, "Jenis Komponen tidak valid");
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const rows = PAYROLL_COMPONENT.filter(
      (row) =>
        isLive(row) &&
        (!type || row.type === type) &&
        (row.name.toLowerCase().includes(filter) ||
          row.code.toLowerCase().includes(filter)),
    )
      .slice()
      .sort(
        (a, b) =>
          a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "id"),
      )
      .map(componentView);

    return list(rows, url, "Komponen Payroll", "Komponen Payroll");
  }

  if (path === BASE && method === "POST") {
    const parsed = parseComponent(await readBody<ComponentBody>(request));
    if (parsed.failure) return parsed.failure;

    if (
      PAYROLL_COMPONENT.some(
        (row) =>
          isLive(row) &&
          row.name.toLowerCase() === parsed.row.name.toLowerCase(),
      )
    ) {
      return fail(409, "Komponen Payroll Sudah Tersedia", "name");
    }

    const id = nextId(PAYROLL_COMPONENT);
    const row: ComponentRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `KPY-${String(id).padStart(4, "0")}`,
      ...parsed.row,
      deletedAt: null,
    };
    PAYROLL_COMPONENT.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Komponen Payroll",
        data: componentView(row),
      },
      201,
    );
  }

  const code = path.match(/^\/komponen-payroll\/([^/]+)$/)?.[1];
  if (!code) return null;

  const row = findComponent(code);
  if (!row) return fail(404, "Komponen Payroll Tidak Ditemukan");

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Komponen Payroll",
      data: componentView(row),
    });
  }

  if (method === "PUT") {
    if (row.code === PPH21) {
      return fail(
        400,
        "Komponen PPh21 Dipakai Oleh Perhitungan Pajak Dan Tidak Dapat Diubah",
      );
    }

    const parsed = parseComponent(await readBody<ComponentBody>(request));
    if (parsed.failure) return parsed.failure;

    if (
      parsed.row.name.toLowerCase() !== row.name.toLowerCase() &&
      PAYROLL_COMPONENT.some(
        (other) =>
          isLive(other) &&
          other.id !== row.id &&
          other.name.toLowerCase() === parsed.row.name.toLowerCase(),
      )
    ) {
      return fail(409, "Komponen Payroll Sudah Tersedia", "name");
    }

    Object.assign(row, parsed.row);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Komponen Payroll",
      data: componentView(row),
    });
  }

  if (method === "DELETE") {
    if (row.code === PPH21) {
      return fail(
        400,
        "Komponen PPh21 Dipakai Oleh Perhitungan Pajak Dan Tidak Dapat Dihapus",
      );
    }

    if (process.env.MOCK_KPY_IN_USE === "slip") {
      return fail(
        400,
        "Komponen Ini Sudah Dipakai Oleh Slip Gaji. Nonaktifkan Saja, Jangan Dihapus",
      );
    }

    if (
      process.env.MOCK_KPY_IN_USE === "penetapan" ||
      KARYAWAN_PAYROLL_COMPONENT.some(
        (other) => isLive(other) && other.payrollComponentId === row.id,
      )
    ) {
      return fail(
        400,
        "Komponen Ini Masih Dipakai Oleh Karyawan. Hapus Penetapannya Dulu",
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Komponen Payroll",
      data: componentView(row),
    });
  }

  return null;
};
