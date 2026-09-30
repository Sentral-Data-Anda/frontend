/**
 * Tiruan `/api/v1/kas-masuk` (kontrak Keuangan §10). `:id` = publicId.
 * Total selalu diturunkan dari baris, `programId` di body diabaikan.
 * Terima dan batal menulis jurnal lewat pintu bersama di store.
 *
 *   MOCK_EMPTY=1          → daftar kosong (404)
 *   MOCK_PERIOD_CLOSED=1  → terima selalu ditolak PERIOD_CLOSED
 *   MOCK_500=1            → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  CASH_RECEIPT,
  CASH_RECEIPT_SOURCE,
  TODAY,
  accountOf,
  cashReceiptEntryLines,
  cashReceiptLine,
  cashReceiptView,
  isLive,
  postDocumentEntry,
  reverseDocumentEntry,
  type CashReceiptRow,
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

type Issue = { path: string; message: string };

const NOT_FOUND = "Kas Masuk Tidak Ditemukan";

const pad = (value: number) => String(value).padStart(4, "0");

const nextRowId = () =>
  CASH_RECEIPT.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;

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

const inactiveFailure = (row: CashReceiptRow) => {
  const ids = [row.intoAccountId, ...row.lines.map((item) => item.accountId)];
  const stale = ids
    .map(accountOf)
    .find((account) => account && !account.isActive);

  return stale
    ? failure(400, `Akun ${stale.code} Sudah Tidak Aktif`, "ACCOUNT_INACTIVE")
    : null;
};

const ok = (message: string, row: CashReceiptRow, status = 200) =>
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

const onWrite = async (ctx: MockContext, row?: CashReceiptRow) => {
  const body = await readBody<Record<string, unknown>>(ctx.request);
  const { issues, parsed } = parse(body);

  if (issues.length > 0) return invalid(issues);

  const lines = parsed.lines.map((item) =>
    cashReceiptLine(item.accountId, item.amount, item.description),
  );

  if (!row) {
    const id = nextRowId();
    const created: CashReceiptRow = {
      id,
      publicId: `bkm-${pad(id)}`,
      code: `BKM-${TODAY.slice(0, 4)}-${pad(id)}`,
      status: "DRAFT",
      cancelReason: null,
      deletedAt: null,
      ...parsed,
      lines,
    };

    CASH_RECEIPT.push(created);

    return ok("Berhasil Menambahkan Kas Masuk", created, 201);
  }

  Object.assign(row, parsed, { lines });

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

    const stale = inactiveFailure(row);

    if (stale) return stale;

    const posted = postDocumentEntry({
      sourceType: CASH_RECEIPT_SOURCE,
      sourceId: row.id,
      entryDate: row.receiptDate,
      description: row.description,
      lines: cashReceiptEntryLines(row),
    });

    if ("failure" in posted) {
      return failure(400, posted.failure.message, posted.failure.code);
    }

    row.status = "PAID";

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

    const reversed = reverseDocumentEntry(
      CASH_RECEIPT_SOURCE,
      row.id,
      `Pembalikan ${row.code} — ${reason}`,
    );

    if (reversed && "failure" in reversed) {
      return failure(400, reversed.failure.message, reversed.failure.code);
    }

    row.status = "CANCELLED";
    row.cancelReason = reason;

    return ok("Berhasil Membatalkan Kas Masuk", row);
  }

  return null;
};
