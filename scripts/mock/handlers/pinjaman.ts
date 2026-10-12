/**
 * Tiruan `/api/v1/pinjaman` dan `/api/v1/ddl/pinjaman` (be-sada
 * `modules/pinjaman`). Store-nya di berkas ini karena tidak ada modul lain
 * yang menulis pinjaman.
 *
 *   MOCK_EMPTY=1  → daftar kosong (404)
 *   MOCK_500=1    → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Direction = "BORROWED" | "LENT";

type InterestMode = "NONE" | "FLAT_TOTAL" | "FLAT_MONTHLY" | "DECLINING";

type Status = "ACTIVE" | "SETTLED" | "CANCELLED";

type LoanRow = {
  id: number;
  publicId: string;
  code: string;
  direction: Direction;
  counterpartyName: string;
  jemaatId: number | null;
  jemaat: { code: string; name: string } | null;
  principal: string;
  agreementDate: string;
  dueDate: string | null;
  termMonths: number;
  interestMode: InterestMode;
  interestPercent: string | null;
  interestAmount: string;
  status: Status;
  notes: string | null;
};

const amount = (value: number) => String(Number(value.toFixed(2)));

/** Rumus yang sama dengan `loanRules.ts` di be-sada. */
const interestOf = (
  principal: number,
  months: number,
  mode: InterestMode,
  percent: number | null,
) => {
  if (mode === "NONE" || percent === null) return 0;

  const rate = percent / 100;

  if (mode === "FLAT_TOTAL") return principal * rate;
  if (mode === "FLAT_MONTHLY") return principal * rate * months;

  return (principal * rate * (months + 1)) / 2;
};

const scheduleOf = (loan: LoanRow) => {
  const principal = Number(loan.principal);
  const months = loan.termMonths;
  const total = Number(loan.interestAmount);
  const rate =
    loan.interestPercent === null ? 0 : Number(loan.interestPercent) / 100;

  const perMonth = Number((principal / months).toFixed(2));
  const flatPerMonth = Number((total / months).toFixed(2));

  const rows = [];
  let principalLeft = principal;
  let interestLeft = total;

  for (let month = 1; month <= months; month += 1) {
    const isLast = month === months;
    const principalDue = isLast ? principalLeft : perMonth;
    const interestDue = isLast
      ? interestLeft
      : loan.interestMode === "DECLINING"
        ? Number((principalLeft * rate).toFixed(2))
        : flatPerMonth;

    principalLeft = Number((principalLeft - principalDue).toFixed(2));
    interestLeft = Number((interestLeft - interestDue).toFixed(2));

    rows.push({
      month,
      principal: amount(principalDue),
      interest: amount(interestDue),
      total: amount(principalDue + interestDue),
    });
  }

  return rows;
};

const loan = (
  id: number,
  overrides: Partial<LoanRow> & Pick<LoanRow, "counterpartyName">,
): LoanRow => {
  const base: LoanRow = {
    id,
    publicId: `loan-${id}`,
    code: `PJM-2026-${String(id).padStart(4, "0")}`,
    direction: "BORROWED",
    jemaatId: null,
    jemaat: null,
    principal: "10000000",
    agreementDate: "2026-01-10T00:00:00.000Z",
    dueDate: null,
    termMonths: 12,
    interestMode: "NONE",
    interestPercent: null,
    interestAmount: "0",
    status: "ACTIVE",
    notes: null,
    ...overrides,
  };

  return {
    ...base,
    interestAmount: amount(
      interestOf(
        Number(base.principal),
        base.termMonths,
        base.interestMode,
        base.interestPercent === null ? null : Number(base.interestPercent),
      ),
    ),
  };
};

export const LOAN: LoanRow[] = [
  loan(1, {
    counterpartyName: "GKPI Medan Kota",
    principal: "50000000",
    termMonths: 24,
    interestMode: "FLAT_TOTAL",
    interestPercent: "5",
    notes: "Pinjaman renovasi atap gedung ibadah.",
  }),
  loan(2, {
    counterpartyName: "Bapak Wibowo",
    direction: "LENT",
    principal: "6000000",
    termMonths: 6,
    interestMode: "NONE",
  }),
  loan(3, {
    counterpartyName: "Koperasi Jemaat Sejahtera",
    principal: "10000000",
    termMonths: 12,
    interestMode: "DECLINING",
    interestPercent: "1.5",
    status: "SETTLED",
  }),
];

let nextId = LOAN.length + 1;

const detailOf = (row: LoanRow) => ({
  ...row,
  schedule: scheduleOf(row),
  settlement: {
    disbursed: row.status === "ACTIVE" ? row.principal : "0",
    principalPaid: "0",
    principalOutstanding: row.status === "ACTIVE" ? row.principal : "0",
    interestPaid: "0",
    interestOutstanding: row.interestAmount,
    isFullyDisbursed: row.status === "ACTIVE",
  },
  lines: { receipts: [], expenses: [] },
});

export const pinjamanMock: MockHandler = async (ctx) => {
  const { path, method, url, can } = ctx;

  if (path === "/ddl/pinjaman" && method === "GET") {
    if (!can(MENU.LOAN, "VIEW")) return denied();

    const rows = LOAN.filter((row) => row.status === "ACTIVE").map((row) => ({
      id: row.id,
      code: row.code,
      name: row.counterpartyName,
      direction: row.direction,
    }));

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Pinjaman",
      data: rows,
    });
  }

  if (path !== "/pinjaman" && !path.startsWith("/pinjaman/")) return null;

  if (!can(MENU.LOAN, "VIEW")) return denied();

  if (method === "GET" && path === "/pinjaman") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Internal Server Error" }, 500);
    }

    const direction = url.searchParams.get("direction");
    const status = url.searchParams.get("status");
    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    const rows = LOAN.filter(
      (row) =>
        (!direction || row.direction === direction) &&
        (!status || row.status === status) &&
        (!filter ||
          row.code.toLowerCase().includes(filter) ||
          row.counterpartyName.toLowerCase().includes(filter)),
    );

    return list(rows, url, "Pinjaman", "Pinjaman");
  }

  const publicId = path.slice("/pinjaman/".length).replace("/status", "");
  const found = LOAN.find((row) => row.publicId === publicId);

  if (method === "GET") {
    if (!found) {
      return json({ status: 404, error: "Pinjaman Tidak Ditemukan" }, 404);
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Pinjaman",
      data: detailOf(found),
    });
  }

  if (method === "POST") {
    if (!can(MENU.LOAN, "CREATE")) return denied();

    const body = await readBody<Partial<LoanRow>>(ctx.request);
    const created = loan(nextId, {
      counterpartyName: String(body.counterpartyName ?? "Tanpa nama"),
      direction: (body.direction ?? "BORROWED") as Direction,
      principal: String(body.principal ?? "0"),
      agreementDate: `${String(body.agreementDate ?? "2026-01-01").slice(0, 10)}T00:00:00.000Z`,
      termMonths: Number(body.termMonths ?? 12),
      interestMode: (body.interestMode ?? "NONE") as InterestMode,
      interestPercent:
        body.interestPercent === null || body.interestPercent === undefined
          ? null
          : String(body.interestPercent),
      notes: body.notes ?? null,
    });

    nextId += 1;
    LOAN.unshift(created);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Pinjaman",
        data: created,
      },
      201,
    );
  }

  if (!found) {
    return json({ status: 404, error: "Pinjaman Tidak Ditemukan" }, 404);
  }

  if (method === "PUT" && path.endsWith("/status")) {
    if (!can(MENU.LOAN, "UPDATE")) return denied();

    const body = await readBody<{ status: Status }>(ctx.request);
    found.status = body.status;

    return json({
      status: 200,
      message: "Berhasil Mengubah Status Pinjaman",
      data: found,
    });
  }

  if (method === "PUT") {
    if (!can(MENU.LOAN, "UPDATE")) return denied();

    const body = await readBody<Partial<LoanRow>>(ctx.request);

    Object.assign(found, {
      counterpartyName: String(body.counterpartyName ?? found.counterpartyName),
      direction: (body.direction ?? found.direction) as Direction,
      principal: String(body.principal ?? found.principal),
      termMonths: Number(body.termMonths ?? found.termMonths),
      interestMode: (body.interestMode ?? found.interestMode) as InterestMode,
      interestPercent:
        body.interestPercent === null || body.interestPercent === undefined
          ? null
          : String(body.interestPercent),
      notes: body.notes ?? null,
    });

    found.interestAmount = amount(
      interestOf(
        Number(found.principal),
        found.termMonths,
        found.interestMode,
        found.interestPercent === null ? null : Number(found.interestPercent),
      ),
    );

    return json({
      status: 200,
      message: "Berhasil Mengubah Pinjaman",
      data: found,
    });
  }

  if (method === "DELETE") {
    if (!can(MENU.LOAN, "DELETE")) return denied();

    LOAN.splice(LOAN.indexOf(found), 1);

    return json({ status: 200, message: "Berhasil Menghapus Pinjaman" });
  }

  return null;
};
