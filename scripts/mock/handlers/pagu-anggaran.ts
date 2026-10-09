/**
 * Tiruan `/api/v1/pagu-anggaran` (kontrak Anggaran §3). Larik
 * `BUDGET_ALLOCATION` milik handler ini.
 *
 *   MOCK_NO_CEILING=1   → belum ada pagu sama sekali (404)
 *   MOCK_EMPTY=1        → daftar kosong (404)
 *   MOCK_500=1          → daftar menjawab 500
 *   MOCK_SAVE_ERROR=1   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  BUDGET_ALLOCATION,
  allocationOf,
  allocationView,
  currentBudgetYear,
  liveProgramsOf,
  type BudgetAllocationRow,
} from "../anggaran-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";
import { bapelOf } from "../pelayanan-store";

type Issue = { path: string; message: string };

type Body = Record<string, unknown>;

const NOT_FOUND = "Pagu Anggaran Tidak Ditemukan";

const MONEY_MAX = 9_999_999_999_999;

const MAX_BATCH = 50;

export const paguFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

const invalid = (issues: Issue[], status = 400) =>
  paguFailure(status, issues[0]?.message ?? "Data tidak valid", { issues });

/**
 * Pagu yang masih dipakai program tidak bisa dihapus — dan "dipakai" berarti
 * program non-CANCELLED, definisi yang sama dengan perhitungan pagunya. Pagu
 * yang seluruh programnya dibatalkan nol rupiah terpakai, jadi boleh dihapus.
 */
export const isCeilingInUse = (bapelId: number, year: number) =>
  liveProgramsOf(bapelId, year).length > 0;

export const duplicateCeiling = (
  bapelId: number,
  year: number,
  exceptId?: number,
) => {
  const existing = allocationOf(bapelId, year);

  return existing && existing.id !== exceptId ? existing : null;
};

const amountIssue = (value: unknown, path: string): Issue | null => {
  const text = typeof value === "number" ? String(value) : String(value ?? "");
  const amount = Number(text);

  if (!text) return { path, message: "Mohon Lengkapi Pagu Anggaran" };
  if (Number.isNaN(amount) || amount <= 0) {
    return { path, message: "Pagu Anggaran harus lebih dari 0" };
  }
  if (amount > MONEY_MAX) {
    return {
      path,
      message: "Pagu Anggaran tidak boleh lebih dari 9.999.999.999.999",
    };
  }
  if ((text.split(".")[1] ?? "").length > 2) {
    return { path, message: "Pagu Anggaran maksimal 2 angka di belakang koma" };
  }

  return null;
};

const yearIssue = (value: unknown, path = "year"): Issue | null => {
  const year = Number(value);

  if (value === undefined || value === null || value === "") {
    return { path, message: "Mohon Lengkapi Tahun Pelayanan" };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { path, message: "Tahun tidak valid" };
  }

  return null;
};

const bapelIssue = (value: unknown, path = "bapelId"): Issue | null => {
  const bapelId = Number(value);

  if (value === undefined || value === null || value === "") {
    return { path, message: "Mohon Lengkapi Komisi" };
  }
  if (!Number.isInteger(bapelId) || bapelId <= 0) {
    return { path, message: "Komisi tidak valid" };
  }

  return null;
};

const parseAllocation = (body: Body) => {
  const issues = [
    bapelIssue(body.bapelId),
    yearIssue(body.year),
    amountIssue(body.amount, "amount"),
  ].filter((issue): issue is Issue => issue !== null);

  return issues.length > 0
    ? { issues }
    : {
        bapelId: Number(body.bapelId),
        year: Number(body.year),
        amount: String(body.amount),
      };
};

const insert = (bapelId: number, year: number, amount: string) => {
  const id = Math.max(0, ...BUDGET_ALLOCATION.map((row) => row.id)) + 1;
  const row: BudgetAllocationRow = {
    id,
    publicId: `pga-${String(id).padStart(4, "0")}`,
    bapelId,
    year,
    amount,
  };
  BUDGET_ALLOCATION.push(row);

  return row;
};

const listRows = (url: URL) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return BUDGET_ALLOCATION.filter(
    (row) =>
      (!year || row.year === year) && (!bapelId || row.bapelId === bapelId),
  )
    .map((row) => allocationView(row))
    .filter((row) => !filter || row.bapel?.name.toLowerCase().includes(filter))
    .sort(
      (left, right) =>
        right.year - left.year ||
        (left.bapel?.name ?? "").localeCompare(right.bapel?.name ?? ""),
    );
};

const onCreate = async (request: Request) => {
  const parsed = parseAllocation(await readBody<Body>(request));
  if (parsed.issues) return invalid(parsed.issues);

  if (!bapelOf(parsed.bapelId)) {
    return paguFailure(404, "Komisi Tidak Ditemukan");
  }

  if (duplicateCeiling(parsed.bapelId, parsed.year)) {
    return invalid(
      [
        {
          path: "year",
          message: `Pagu Anggaran Komisi Ini Untuk Tahun ${parsed.year} Sudah Ada. Ubah Yang Lama`,
        },
      ],
      409,
    );
  }

  const row = insert(parsed.bapelId, parsed.year, parsed.amount);

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Pagu Anggaran",
      data: allocationView(row, true),
    },
    201,
  );
};

const onCreateBatch = async (request: Request) => {
  const body = await readBody<Body>(request);
  const rows = Array.isArray(body.items) ? (body.items as Body[]) : [];
  const issues: Issue[] = [];
  const year = yearIssue(body.year);

  if (year) issues.push(year);
  if (rows.length === 0) {
    issues.push({
      path: "items",
      message: "Mohon Lengkapi Baris Pagu Anggaran",
    });
  }
  if (rows.length > MAX_BATCH) {
    issues.push({
      path: "items",
      message: `Maksimal ${MAX_BATCH} baris dalam satu kiriman`,
    });
  }

  const seen = new Set<number>();

  rows.forEach((row, index) => {
    const bapel = bapelIssue(row.bapelId, `items.${index}.bapelId`);
    const amount = amountIssue(row.amount, `items.${index}.amount`);

    if (bapel) issues.push(bapel);
    if (amount) issues.push(amount);
    if (bapel) return;

    const bapelId = Number(row.bapelId);

    if (!bapelOf(bapelId)) {
      issues.push({
        path: `items.${index}.bapelId`,
        message: "Komisi Tidak Ditemukan",
      });

      return;
    }
    if (seen.has(bapelId)) {
      issues.push({
        path: `items.${index}.bapelId`,
        message: "Komisi Ini Sudah Ada Di Baris Sebelumnya",
      });

      return;
    }

    seen.add(bapelId);
  });

  if (issues.length > 0) return invalid(issues);

  const taken = rows.flatMap((row, index) =>
    duplicateCeiling(Number(row.bapelId), Number(body.year))
      ? [
          {
            path: `items.${index}.bapelId`,
            message: `Pagu Anggaran Komisi Ini Untuk Tahun ${Number(body.year)} Sudah Ada. Ubah Yang Lama`,
          },
        ]
      : [],
  );

  if (taken.length > 0) return invalid(taken, 409);

  const saved = rows.map((row) =>
    insert(Number(row.bapelId), Number(body.year), String(row.amount)),
  );

  return json(
    {
      status: 201,
      message: `Berhasil Menambahkan ${saved.length} Pagu Anggaran`,
      data: saved.map((row) => allocationView(row)),
    },
    201,
  );
};

const onUpdate = async (request: Request, row: BudgetAllocationRow) => {
  const parsed = parseAllocation(await readBody<Body>(request));
  if (parsed.issues) return invalid(parsed.issues);

  if (!bapelOf(parsed.bapelId)) {
    return paguFailure(404, "Komisi Tidak Ditemukan");
  }

  if (duplicateCeiling(parsed.bapelId, parsed.year, row.id)) {
    return invalid(
      [
        {
          path: "year",
          message: `Pagu Anggaran Komisi Ini Untuk Tahun ${parsed.year} Sudah Ada. Ubah Yang Lama`,
        },
      ],
      409,
    );
  }

  row.bapelId = parsed.bapelId;
  row.year = parsed.year;
  row.amount = parsed.amount;

  return json({
    status: 200,
    message: "Berhasil Mengubah Pagu Anggaran",
    data: allocationView(row, true),
  });
};

const onDelete = (row: BudgetAllocationRow) => {
  if (isCeilingInUse(row.bapelId, row.year)) {
    return paguFailure(
      400,
      "Pagu Anggaran Ini Sudah Dipakai Oleh Program. Ubah Nominalnya, Jangan Dihapus",
      { code: "CEILING_IN_USE" },
    );
  }

  BUDGET_ALLOCATION.splice(BUDGET_ALLOCATION.indexOf(row), 1);

  return json({ status: 200, message: "Berhasil Menghapus Pagu Anggaran" });
};

export const paguAnggaranMock: MockHandler = (ctx) => {
  const match = ctx.path.match(/^\/pagu-anggaran(?:\/([^/]+))?$/);
  if (!match) return null;

  const [, id] = match;
  const can = (action: MockAction) => ctx.can(MENU.BUDGET, action);
  const isWrite = ctx.method !== "GET";

  if (isWrite && process.env.MOCK_SAVE_ERROR) {
    return paguFailure(500, "Kesalahan server.");
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (!id) {
      if (process.env.MOCK_500) {
        return paguFailure(500, "Internal Server Error");
      }

      return list(listRows(ctx.url), ctx.url, "Pagu Anggaran", "Pagu Anggaran");
    }

    const row = BUDGET_ALLOCATION.find((item) => item.publicId === id);

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Pagu Anggaran",
          data: allocationView(row, true),
        })
      : paguFailure(404, NOT_FOUND);
  }

  if (ctx.method === "POST") {
    if (!can("CREATE")) return denied();

    if (id === "batch") return onCreateBatch(ctx.request);
    if (id) return null;

    return onCreate(ctx.request);
  }

  if (!id) return null;

  const row = BUDGET_ALLOCATION.find((item) => item.publicId === id);

  if (ctx.method === "PUT") {
    if (!can("UPDATE")) return denied();
    if (!row) return paguFailure(404, NOT_FOUND);

    return onUpdate(ctx.request, row);
  }

  if (ctx.method === "DELETE") {
    if (!can("DELETE")) return denied();
    if (!row) return paguFailure(404, NOT_FOUND);

    return onDelete(row);
  }

  return null;
};

// Pagu dua tahun pelayanan terakhir: satu komisi sengaja tanpa pagu tahun
// berjalan, karena pagu yang tidak ada adalah penolakan dan layar Program
// harus bisa membuktikannya.
const SEED: [
  bapelId: number,
  current: string | null,
  previous: string | null,
][] = [
  [1, "120000000", "100000000"],
  [2, "45000000", "40000000"],
  [3, "30000000", "28000000"],
  [4, "25000000", "22000000"],
  [5, "18000000", "15000000"],
  [6, null, "35000000"],
];

if (!process.env.MOCK_NO_CEILING) {
  const year = currentBudgetYear();

  for (const [bapelId, current, previous] of SEED) {
    if (previous) insert(bapelId, year - 1, previous);
    if (current) insert(bapelId, year, current);
  }
}
