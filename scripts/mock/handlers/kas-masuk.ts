/**
 * Tiruan `/api/v1/kas-masuk` (kontrak Keuangan §10). `:id` = publicId.
 * Total selalu diturunkan dari baris, `programId` di body diabaikan.
 *
 *   MOCK_EMPTY=1          → daftar kosong (404)
 *   MOCK_PERIOD_CLOSED=1  → terima selalu ditolak PERIOD_CLOSED
 *   MOCK_500=1            → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import { sumAmounts } from "../../../src/lib/number";
import type { CashStatus } from "../../../src/types/keuangan";
import {
  TODAY,
  accountOf,
  accountRef,
  isLive,
  monthLabel,
  periodOf,
} from "../keuangan-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockContext,
  type MockHandler,
} from "../kit";
import { bapelOf } from "../pelayanan-store";

type Issue = { path: string; message: string };

type LineRow = {
  publicId: string;
  accountId: number;
  amount: string;
  description: string | null;
};

type Row = {
  id: number;
  publicId: string;
  code: string;
  receiptDate: string;
  description: string;
  payer: string;
  intoAccountId: number;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  status: CashStatus;
  journalCode: string | null;
  cancelReason: string | null;
  deletedAt: string | null;
  lines: LineRow[];
};

const YEAR = Number(TODAY.slice(0, 4));

const NOT_FOUND = "Kas Masuk Tidak Ditemukan";

let rowId = 0;
let lineId = 0;
let journalNo = 100;

const pad = (value: number) => String(value).padStart(4, "0");

const nextCode = () => `BKM-${YEAR}-${pad(rowId)}`;

const nextJournalCode = () => {
  journalNo += 1;

  return `JRN-${YEAR}-${pad(journalNo)}`;
};

const line = (
  accountId: number,
  amount: string,
  description: string | null = null,
): LineRow => {
  lineId += 1;

  return { publicId: `bkml-${pad(lineId)}`, accountId, amount, description };
};

const receipt = (
  receiptDate: string,
  payer: string,
  description: string,
  intoAccountId: number,
  lines: LineRow[],
  extra: Partial<Row> = {},
): Row => {
  rowId += 1;

  return {
    id: rowId,
    publicId: `bkm-${pad(rowId)}`,
    code: nextCode(),
    receiptDate,
    description,
    payer,
    intoAccountId,
    bapelId: null,
    method: null,
    reference: null,
    status: "DRAFT",
    journalCode: null,
    cancelReason: null,
    deletedAt: null,
    lines,
    ...extra,
  };
};

export const CASH_RECEIPT: Row[] = [
  receipt(
    addDays(TODAY, -1),
    "Keluarga Santoso",
    "Sewa gedung untuk resepsi pernikahan",
    2,
    [line(20, "3500000", "Sewa aula")],
    { method: "Tunai", reference: "BA-07/IX/2026" },
  ),
  receipt(
    addDays(TODAY, -5),
    "Payment gateway",
    "Pencairan persembahan online dari payment gateway",
    4,
    [
      line(6, "4850000", "Persembahan online bruto"),
      line(23, "72750", "Biaya administrasi payment gateway"),
    ],
    {
      status: "PAID",
      method: "Transfer",
      reference: "XND-SETTLE-0918",
      journalCode: `JRN-${YEAR}-0101`,
    },
  ),
  receipt(
    addDays(TODAY, -8),
    "Toko Rejeki",
    "Penjualan kalender gereja 2027",
    2,
    [line(20, "1250000", "120 kalender")],
    { status: "PAID", method: "Tunai", journalCode: `JRN-${YEAR}-0102` },
  ),
  receipt(
    addDays(TODAY, -11),
    "Panitia Natal",
    "Pengembalian dana panitia yang tidak terpakai",
    3,
    [line(20, "640000", null)],
    { status: "CANCELLED", cancelReason: "Salah akun tujuan, dicatat ulang." },
  ),
  receipt(
    addDays(TODAY, -3),
    "Hitung fisik kolekte 21 September",
    "Selisih lebih hasil hitung fisik kolekte",
    2,
    [line(7, "15000", "Selisih lebih")],
    { reference: "BA-06/IX/2026" },
  ),
  receipt(
    `${YEAR}-01-14`,
    "Bapak Wibowo",
    "Sumbangan non-persembahan untuk perbaikan atap",
    2,
    [line(20, "2000000", null)],
    { method: "Transfer", bapelId: 1 },
  ),
];

const totalOf = (row: Row) => sumAmounts(row.lines.map((item) => item.amount));

const lineView = (item: LineRow) => ({
  publicId: item.publicId,
  accountId: item.accountId,
  account: {
    code: accountOf(item.accountId)?.code ?? "",
    name: accountOf(item.accountId)?.name ?? "",
  },
  amount: item.amount,
  description: item.description,
});

export const cashReceiptView = (row: Row, isDetail = false) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  receiptDate: `${row.receiptDate}T00:00:00.000Z`,
  description: row.description,
  payer: row.payer,
  intoAccountId: row.intoAccountId,
  intoAccount: accountRef(row.intoAccountId),
  bapel: row.bapelId === null ? null : (bapelOf(row.bapelId) ?? null),
  method: row.method,
  reference: row.reference,
  totalAmount: totalOf(row),
  status: row.status,
  ...(isDetail
    ? {
        lines: row.lines.map(lineView),
        journal:
          row.journalCode === null
            ? null
            : { code: row.journalCode, status: "POSTED" },
        cancelReason: row.cancelReason,
      }
    : {}),
});

const failure = (status: number, error: string, code?: string) =>
  json(code ? { status, error, code } : { status, error }, status);

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const findRow = (publicId: string) => {
  const id = decodeURIComponent(publicId).toLowerCase();

  return CASH_RECEIPT.find(
    (row) => isLive(row) && row.publicId.toLowerCase() === id,
  );
};

const isBlank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

const text = (value: unknown) => (isBlank(value) ? "" : String(value).trim());

const accountIssue = (path: string, value: unknown): Issue | null => {
  if (isBlank(value)) return { path, message: "Mohon Lengkapi Akun" };

  const account = accountOf(Number(value));

  if (!account || !isLive(account)) {
    return { path, message: "Akun Tidak Ditemukan" };
  }
  if (!account.isActive) {
    return { path, message: `Akun ${account.code} Sudah Tidak Aktif` };
  }

  return null;
};

type Parsed = {
  receiptDate: string;
  description: string;
  payer: string;
  intoAccountId: number;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  lines: { accountId: number; amount: string; description: string | null }[];
};

const parse = (body: Record<string, unknown>) => {
  const issues: Issue[] = [];
  const receiptDate = text(body.receiptDate).slice(0, 10);
  const payer = text(body.payer);
  const description = text(body.description);
  const method = text(body.method);
  const reference = text(body.reference);

  if (!receiptDate) {
    issues.push({ path: "receiptDate", message: "Mohon Lengkapi Tanggal" });
  } else if (receiptDate > TODAY) {
    issues.push({
      path: "receiptDate",
      message: "Tanggal Tidak Boleh Di Masa Depan",
    });
  }
  if (!payer) {
    issues.push({ path: "payer", message: "Mohon Lengkapi Diterima Dari" });
  } else if (payer.length > 150) {
    issues.push({
      path: "payer",
      message: "Diterima Dari tidak boleh lebih dari 150 karakter",
    });
  }
  if (!description) {
    issues.push({ path: "description", message: "Mohon Lengkapi Keterangan" });
  } else if (description.length > 250) {
    issues.push({
      path: "description",
      message: "Keterangan tidak boleh lebih dari 250 karakter",
    });
  }
  if (method.length > 30) {
    issues.push({
      path: "method",
      message: "Metode tidak boleh lebih dari 30 karakter",
    });
  }

  const intoIssue = accountIssue("intoAccountId", body.intoAccountId);

  if (intoIssue) issues.push(intoIssue);

  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  if (rawLines.length === 0) {
    issues.push({ path: "lines", message: "Mohon Lengkapi Rincian" });
  }

  const lines = rawLines.map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const at = (field: string) => `lines.${index}.${field}`;
    const amount = Number(item.amount);
    const issue = accountIssue(at("accountId"), item.accountId);

    if (issue) issues.push(issue);
    if (!(amount > 0)) {
      issues.push({
        path: at("amount"),
        message: "Nominal Setiap Baris Kas Masuk Harus Lebih Dari 0",
      });
    }

    return {
      accountId: Number(item.accountId),
      amount: String(amount),
      description: isBlank(item.description) ? null : text(item.description),
    };
  });

  const parsed: Parsed = {
    receiptDate,
    description,
    payer,
    intoAccountId: Number(body.intoAccountId),
    bapelId: isBlank(body.bapelId) ? null : Number(body.bapelId),
    method: method || null,
    reference: reference || null,
    lines,
  };

  return { issues, parsed };
};

const periodFailure = (date: string) => {
  const period = periodOf(date);
  const label = monthLabel(Number(date.slice(0, 4)), Number(date.slice(5, 7)));

  if (!period) {
    return failure(
      400,
      `Periode Fiskal ${label} Belum Dibuka`,
      "PERIOD_NOT_OPEN",
    );
  }
  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return failure(
      400,
      `Periode Fiskal ${label} Sudah Ditutup`,
      "PERIOD_CLOSED",
    );
  }

  return null;
};

const inactiveFailure = (row: Row) => {
  const ids = [row.intoAccountId, ...row.lines.map((item) => item.accountId)];
  const stale = ids
    .map(accountOf)
    .find((account) => account && !account.isActive);

  return stale
    ? failure(400, `Akun ${stale.code} Sudah Tidak Aktif`, "ACCOUNT_INACTIVE")
    : null;
};

const ok = (message: string, row: Row, status = 200) =>
  json({ status, message, data: cashReceiptView(row, true) }, status);

const listRows = (ctx: MockContext) => {
  const params = ctx.url.searchParams;
  const status = params.get("status");
  const filter = (params.get("filter") ?? "").toLowerCase();
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";

  return CASH_RECEIPT.filter(
    (row) =>
      isLive(row) &&
      (!status || row.status === status) &&
      (!startDate || row.receiptDate >= startDate) &&
      (!endDate || row.receiptDate <= endDate) &&
      (!filter ||
        row.code.toLowerCase().includes(filter) ||
        row.payer.toLowerCase().includes(filter) ||
        row.description.toLowerCase().includes(filter) ||
        (row.reference ?? "").toLowerCase().includes(filter)),
  )
    .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate))
    .map((row) => cashReceiptView(row));
};

const guard = (ctx: MockContext, action: MockAction) =>
  ctx.can(MENU.KAS_MASUK, action) ? null : denied();

const onWrite = async (ctx: MockContext, row?: Row) => {
  const body = await readBody<Record<string, unknown>>(ctx.request);
  const { issues, parsed } = parse(body);

  if (issues.length > 0) return invalid(issues);

  if (!row) {
    rowId += 1;
    const created: Row = {
      id: rowId,
      publicId: `bkm-${pad(rowId)}`,
      code: nextCode(),
      status: "DRAFT",
      journalCode: null,
      cancelReason: null,
      deletedAt: null,
      ...parsed,
      lines: parsed.lines.map((item) =>
        line(item.accountId, item.amount, item.description),
      ),
    };

    CASH_RECEIPT.push(created);

    return ok("Berhasil Menambahkan Kas Masuk", created, 201);
  }

  Object.assign(row, parsed, {
    lines: parsed.lines.map((item) =>
      line(item.accountId, item.amount, item.description),
    ),
  });

  return ok("Berhasil Memperbarui Kas Masuk", row);
};

export const kasMasukMock: MockHandler = async (ctx) => {
  if (ctx.path !== "/kas-masuk" && !ctx.path.startsWith("/kas-masuk/"))
    return null;

  if (ctx.path === "/kas-masuk") {
    if (ctx.method === "GET") {
      const deniedResponse = guard(ctx, "VIEW");

      if (deniedResponse) return deniedResponse;
      if (process.env.MOCK_500) {
        return failure(500, "Terjadi kesalahan pada server");
      }

      return list(listRows(ctx), ctx.url, "Kas Masuk", "Kas Masuk");
    }

    if (ctx.method === "POST") {
      return guard(ctx, "CREATE") ?? onWrite(ctx);
    }

    return null;
  }

  const [, , id = "", action = ""] = ctx.path.split("/");
  const row = findRow(id);

  if (action === "" && ctx.method === "GET") {
    const deniedResponse = guard(ctx, "VIEW");

    if (deniedResponse) return deniedResponse;
    if (!row) return failure(404, NOT_FOUND);

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Kas Masuk",
      data: cashReceiptView(row, true),
    });
  }

  if (action === "" && ctx.method === "PUT") {
    const deniedResponse = guard(ctx, "UPDATE");

    if (deniedResponse) return deniedResponse;
    if (!row) return failure(404, NOT_FOUND);
    if (row.status !== "DRAFT") {
      return failure(400, "Hanya Draf Kas Masuk Yang Dapat Diubah");
    }

    return onWrite(ctx, row);
  }

  if (action === "" && ctx.method === "DELETE") {
    const deniedResponse = guard(ctx, "DELETE");

    if (deniedResponse) return deniedResponse;
    if (!row) return failure(404, NOT_FOUND);
    if (row.status !== "DRAFT") {
      return failure(400, "Hanya Draf Kas Masuk Yang Dapat Dihapus");
    }

    row.deletedAt = `${TODAY}T03:00:00.000Z`;

    return json({
      status: 200,
      message: "Berhasil Menghapus Kas Masuk",
      data: { publicId: row.publicId, code: row.code },
    });
  }

  if (action === "terima" && ctx.method === "PUT") {
    const deniedResponse = guard(ctx, "UPDATE");

    if (deniedResponse) return deniedResponse;
    if (!row) return failure(404, NOT_FOUND);
    if (row.status !== "DRAFT") {
      return failure(400, "Kas Masuk Ini Sudah Diterima");
    }

    const blocked = periodFailure(row.receiptDate) ?? inactiveFailure(row);

    if (blocked) return blocked;

    row.status = "PAID";
    row.journalCode = nextJournalCode();

    return ok("Berhasil Menerima Kas Masuk", row);
  }

  if (action === "batal" && ctx.method === "PUT") {
    const deniedResponse = guard(ctx, "DELETE");

    if (deniedResponse) return deniedResponse;
    if (!row) return failure(404, NOT_FOUND);
    if (row.status !== "PAID") {
      return failure(
        400,
        "Hanya Kas Masuk Yang Sudah Diterima Yang Dapat Dibatalkan",
      );
    }

    const body = await readBody<{ cancelReason?: unknown }>(ctx.request);
    const reason = text(body.cancelReason);

    if (!reason) {
      return invalid([
        { path: "cancelReason", message: "Mohon Lengkapi Alasan Pembatalan" },
      ]);
    }

    const blocked = periodFailure(TODAY);

    if (blocked) return blocked;

    row.status = "CANCELLED";
    row.cancelReason = reason;

    return ok("Berhasil Membatalkan Kas Masuk", row);
  }

  return null;
};
