/**
 * Tiruan `/api/v1/kas-keluar` (kontrak Keuangan §11). Larik dan bentuk bacaan
 * ada di keuangan-store; berkas ini hanya HTTP, guard, dan urutan penolakan.
 * Jurnal ditulis lewat pintu bersama supaya tautan entrinya nyata.
 *
 *   MOCK_EMPTY=1            → daftar kosong (404)
 *   MOCK_500=1              → daftar menjawab 500
 *   MOCK_PERIOD_CLOSED=1    → bayar ditolak: periode tertutup
 *   MOCK_NO_WORKFLOW=1      → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_MEDIA_EXPIRED=1    → nota 403 (media.ts)
 */
import { MENU } from "../../../src/config/menu";
import { BAPEL_CHOICES, type BapelChoice } from "../../../src/types/keuangan";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  CASH_EXPENSE,
  CASH_EXPENSE_SOURCE,
  TODAY,
  accountOf,
  cashExpenseApproval,
  cashExpenseEntryLines,
  cashExpenseLine,
  cashExpenseOpenApproval,
  cashExpenseView,
  codeOf,
  isLive,
  nextId,
  postDocumentEntry,
  reverseDocumentEntry,
  type CashExpenseNoteRow,
  type CashExpenseRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";
import { bapelOf } from "../pelayanan-store";

type Issue = { path: string; message: string };

const NAME = "Kas Keluar";
const NOT_FOUND = `${NAME} Tidak Ditemukan`;
const MAX_NOTES = 3;
const MAX_AMOUNT = 9_999_999_999_999;

const failure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

const invalid = (issues: Issue[], status = 400) =>
  failure(status, issues[0]!.message, { issues });

const serverError = () => failure(500, "Internal Server Error");

const ok = (message: string, row: CashExpenseRow, status = 200) =>
  json({ status, message, data: cashExpenseView(row, true) }, status);

const expenseOf = (publicId: string) =>
  CASH_EXPENSE.find((row) => isLive(row) && row.publicId === publicId);

const collapse = (value: string) => value.trim().replace(/\s+/g, " ");

const text = (form: FormData, key: string) => {
  const value = form.get(key);

  return typeof value === "string" ? collapse(value) : "";
};

const jsonOf = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

type ParsedLine = {
  accountId: number;
  amount: number;
  description: string | null;
};

type Parsed = {
  expenseDate: string;
  payee: string;
  description: string;
  paidFromAccountId: number;
  bapelChoice: BapelChoice;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  lines: ParsedLine[];
  kept: string[] | null;
  files: File[];
};

const accountIssue = (
  path: string,
  id: number,
  type?: "ASSET",
): Issue | null => {
  const account = accountOf(id);

  if (!account || !isLive(account)) {
    return { path, message: "Akun Tidak Ditemukan" };
  }
  if (!account.isActive) {
    return { path, message: `Akun ${account.code} Tidak Aktif` };
  }

  return type && account.type !== type
    ? { path, message: "Akun Harus Bertipe Aset" }
    : null;
};

const parsedLineOf = (raw: unknown, index: number, issues: Issue[]) => {
  const line = (raw ?? {}) as Record<string, unknown>;
  const at = (field: string) => `lines.${index}.${field}`;
  const accountId = Number(line.accountId) || 0;
  const amount = Number(line.amount);

  if (!accountId) {
    issues.push({ path: at("accountId"), message: "Mohon Lengkapi Pos" });
  } else {
    const rejected = accountIssue(at("accountId"), accountId);
    if (rejected) issues.push(rejected);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    issues.push({ path: at("amount"), message: "Nominal harus lebih dari 0" });
  } else if (amount > MAX_AMOUNT) {
    issues.push({ path: at("amount"), message: "Nominal Terlalu Besar" });
  } else if (Number(amount.toFixed(2)) !== amount) {
    issues.push({
      path: at("amount"),
      message: "Nominal maksimal 2 angka di belakang koma",
    });
  }

  return {
    accountId,
    amount,
    description: line.description ? collapse(String(line.description)) : null,
  };
};

const keptOf = (form: FormData, isUpdate: boolean): string[] | null | "bad" => {
  const raw = isUpdate ? form.get("keepFiles") : null;
  if (typeof raw !== "string") return null;

  const parsed = jsonOf(raw);

  return Array.isArray(parsed) &&
    parsed.every((item) => typeof item?.publicId === "string")
    ? parsed.map((item: { publicId: string }) => item.publicId)
    : "bad";
};

const parse = (form: FormData, isUpdate: boolean): Parsed | Issue[] => {
  const issues: Issue[] = [];
  const expenseDate = text(form, "expenseDate");
  const payee = text(form, "payee");
  const description = text(form, "description");
  const paidFromAccountId = Number(text(form, "paidFromAccountId")) || 0;
  const bapelChoice = text(form, "bapelChoice");
  const bapelId = Number(text(form, "bapelId")) || null;
  const method = text(form, "method") || null;
  const reference = text(form, "reference") || null;
  const rawLines = jsonOf(text(form, "lines") || "[]");
  const kept = keptOf(form, isUpdate);
  const files = filesOf(form, "image");

  if (!expenseDate) {
    issues.push({ path: "expenseDate", message: "Mohon Lengkapi Tanggal" });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    issues.push({ path: "expenseDate", message: "Tanggal Tidak Valid" });
  } else if (expenseDate > TODAY) {
    issues.push({
      path: "expenseDate",
      message: "Tanggal Tidak Boleh Di Masa Depan",
    });
  }

  if (!payee) {
    issues.push({ path: "payee", message: "Mohon Lengkapi Penerima" });
  } else if (payee.length > 150) {
    issues.push({
      path: "payee",
      message: "Penerima tidak boleh lebih dari 150 karakter",
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

  if (!paidFromAccountId) {
    issues.push({
      path: "paidFromAccountId",
      message: "Mohon Lengkapi Akun Sumber Dana",
    });
  } else {
    const rejected = accountIssue(
      "paidFromAccountId",
      paidFromAccountId,
      "ASSET",
    );
    if (rejected) issues.push(rejected);
  }

  if (method && method.length > 30) {
    issues.push({
      path: "method",
      message: "Cara Bayar tidak boleh lebih dari 30 karakter",
    });
  }

  // Kosong bukan lagi jawaban: payload yang belum dijawab ditolak di sini,
  // persis seperti validator server, dan kesepakatan jawaban dengan `bapelId`
  // dinyatakan lewat `issues[].path` — bukan lewat sebuah `code`.
  if (!(BAPEL_CHOICES as readonly string[]).includes(bapelChoice)) {
    issues.push({
      path: "bapelChoice",
      message: "Mohon Pilih Untuk Komisi Atau Bukan Belanja Komisi",
    });
  } else if (bapelChoice === "KOMISI" && bapelId === null) {
    issues.push({ path: "bapelId", message: "Mohon Lengkapi Komisi" });
  } else if (bapelChoice === "BUKAN_KOMISI" && bapelId !== null) {
    issues.push({
      path: "bapelId",
      message: "Bukan Belanja Komisi Tidak Boleh Membawa Komisi",
    });
  } else if (bapelId !== null && !bapelOf(bapelId)) {
    issues.push({
      path: "bapelId",
      message: "Badan Pelayanan Tidak Ditemukan",
    });
  }

  const rows = Array.isArray(rawLines) ? rawLines : [];
  if (!Array.isArray(rawLines)) {
    issues.push({ path: "lines", message: "Format Rincian Tidak Valid" });
  } else if (rows.length === 0) {
    issues.push({
      path: "lines",
      message: "Kas Keluar harus memiliki minimal 1 rincian",
    });
  }
  const lines = rows.map((raw, index) => parsedLineOf(raw, index, issues));

  if (kept === "bad") {
    issues.push({
      path: "keepFiles",
      message: "Format Nota Yang Dipertahankan Tidak Valid",
    });
  } else if ((kept?.length ?? 0) + files.length > MAX_NOTES) {
    issues.push({ path: "image", message: "Nota Maksimal 3" });
  }

  if (issues.length > 0) return issues;

  return {
    expenseDate,
    payee,
    description,
    paidFromAccountId,
    bapelChoice: bapelChoice as BapelChoice,
    bapelId,
    method,
    reference,
    lines,
    kept: kept as string[] | null,
    files,
  };
};

const writableFailure = (row: CashExpenseRow): Response | null => {
  if (cashExpenseOpenApproval(row)) {
    return failure(
      400,
      `${NAME} Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu`,
    );
  }

  return row.status === "DRAFT"
    ? null
    : failure(400, `Hanya ${NAME} Berstatus Draft Yang Bisa Diubah`);
};

const noteFailure = (
  parsed: Parsed,
  current: readonly CashExpenseNoteRow[],
) => {
  if (
    parsed.kept?.some((id) => !current.some((note) => note.publicId === id))
  ) {
    return invalid([{ path: "image", message: "Nota Tidak Ditemukan" }]);
  }

  const keptCount = parsed.kept?.length ?? current.length;

  return keptCount + parsed.files.length > MAX_NOTES
    ? invalid([{ path: "image", message: "Nota Maksimal 3" }])
    : null;
};

const storeNote = async (file: File): Promise<CashExpenseNoteRow> => ({
  publicId: crypto.randomUUID(),
  ...(await putMedia(file, "cash-expense")),
});

const toLines = (lines: ParsedLine[]) =>
  lines.map((line) =>
    cashExpenseLine(line.accountId, String(line.amount), line.description),
  );

const onCreate = async (request: Request) => {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form, false);
  if (Array.isArray(parsed)) return invalid(parsed);

  const row: CashExpenseRow = {
    id: nextId(CASH_EXPENSE),
    publicId: crypto.randomUUID(),
    code: codeOf("BKK", { yearly: true }),
    expenseDate: parsed.expenseDate,
    description: parsed.description,
    payee: parsed.payee,
    paidFromAccountId: parsed.paidFromAccountId,
    bapelId: parsed.bapelId,
    bapelChoice: parsed.bapelChoice,
    method: parsed.method,
    reference: parsed.reference,
    status: "DRAFT",
    cancelReason: null,
    approvals: [],
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    lines: toLines(parsed.lines),
    notes: await Promise.all(parsed.files.map(storeNote)),
  };
  CASH_EXPENSE.push(row);

  return ok(`Berhasil Menambahkan ${NAME}`, row, 201);
};

const onUpdate = async (request: Request, row: CashExpenseRow) => {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form, true);
  if (Array.isArray(parsed)) return invalid(parsed);

  const rejected = writableFailure(row) ?? noteFailure(parsed, row.notes);
  if (rejected) return rejected;

  const { kept } = parsed;
  Object.assign(row, {
    expenseDate: parsed.expenseDate,
    description: parsed.description,
    payee: parsed.payee,
    paidFromAccountId: parsed.paidFromAccountId,
    bapelId: parsed.bapelId,
    bapelChoice: parsed.bapelChoice,
    method: parsed.method,
    reference: parsed.reference,
    lines: toLines(parsed.lines),
    notes: [
      ...(kept
        ? row.notes.filter((note) => kept.includes(note.publicId))
        : row.notes),
      ...(await Promise.all(parsed.files.map(storeNote))),
    ],
  });

  return ok(`Berhasil Mengubah ${NAME}`, row);
};

const onDelete = (row: CashExpenseRow) => {
  const rejected = writableFailure(row);
  if (rejected) return rejected;

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: `Berhasil Menghapus ${NAME}`,
    data: { publicId: row.publicId, code: row.code },
  });
};

const onSubmit = (row: CashExpenseRow) => {
  if (cashExpenseOpenApproval(row)) {
    return failure(400, `${NAME} Ini Sudah Diajukan`);
  }
  if (row.status !== "DRAFT") {
    return failure(400, `Hanya ${NAME} Berstatus Draft Yang Bisa Diajukan`);
  }
  if (process.env.MOCK_NO_WORKFLOW) {
    return failure(
      400,
      "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    );
  }

  const approval = cashExpenseApproval(
    90 + row.approvals.length + row.id,
    "PENDING",
    SESSION_USER_ID,
  );
  row.approvals.push(approval);

  return json(
    {
      status: 201,
      message: `Berhasil Mengajukan ${NAME}`,
      data: {
        publicId: approval.publicId,
        code: approval.code,
        status: approval.status,
      },
    },
    201,
  );
};

const onWithdraw = (row: CashExpenseRow) => {
  const approval = cashExpenseOpenApproval(row);

  if (!approval) {
    return failure(400, "Permintaan Persetujuan Ini Sudah Selesai");
  }
  if (approval.submittedBy !== SESSION_USER_ID) {
    return failure(403, "Hanya Pengaju Yang Dapat Menarik Permintaan Ini");
  }

  approval.status = "CANCELLED";

  return ok(`Berhasil Menarik Pengajuan ${NAME}`, row);
};

const onPay = (row: CashExpenseRow) => {
  if (row.status === "PAID") return failure(400, `${NAME} Ini Sudah Dibayar`);
  if (row.status !== "APPROVED") {
    return failure(400, `${NAME} Ini Belum Disetujui`);
  }

  const posted = postDocumentEntry({
    sourceType: CASH_EXPENSE_SOURCE,
    sourceId: row.id,
    entryDate: row.expenseDate,
    description: row.description,
    lines: cashExpenseEntryLines(row),
  });

  if ("failure" in posted) {
    return failure(400, posted.failure.message, { code: posted.failure.code });
  }

  row.status = "PAID";

  return ok(`Berhasil Mencatat Pembayaran ${NAME}`, row);
};

const onCancel = async (request: Request, row: CashExpenseRow) => {
  const body = await readBody<{ cancelReason?: string }>(request).catch(
    () => ({}) as { cancelReason?: string },
  );
  const reason = collapse(String(body.cancelReason ?? ""));

  if (!reason) {
    return invalid([
      { path: "cancelReason", message: "Mohon Lengkapi Alasan Pembatalan" },
    ]);
  }
  if (row.status === "CANCELLED") {
    return failure(400, `${NAME} Ini Sudah Dibatalkan`);
  }
  if (row.status === "DRAFT") {
    return failure(400, `${NAME} Yang Masih Draft Tidak Perlu Dibatalkan`);
  }

  if (row.status === "PAID") {
    const reversed = reverseDocumentEntry(
      CASH_EXPENSE_SOURCE,
      row.id,
      `Pembalikan ${row.code} — ${reason}`,
    );

    if (reversed && "failure" in reversed) {
      return failure(400, reversed.failure.message, {
        code: reversed.failure.code,
      });
    }
  }

  row.status = "CANCELLED";
  row.cancelReason = reason;

  return ok(`Berhasil Membatalkan ${NAME}`, row);
};

const matches = (row: CashExpenseRow, filter: string) =>
  [row.code, row.payee, row.description, row.reference ?? ""].some((value) =>
    value.toLowerCase().includes(filter),
  );

const listRows = (url: URL) => {
  const params = url.searchParams;
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const bapelId = Number(params.get("bapelId")) || null;
  const pending = params.get("isPendingApproval");
  const filter = (params.get("filter") ?? "").toLowerCase();

  return CASH_EXPENSE.filter(isLive)
    .filter((row) => !status || row.status === status)
    .filter((row) => !startDate || row.expenseDate >= startDate)
    .filter((row) => !endDate || row.expenseDate <= endDate)
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .filter((row) => {
      if (pending !== "1" && pending !== "0") return true;

      return (cashExpenseOpenApproval(row) !== null) === (pending === "1");
    })
    .filter((row) => !filter || matches(row, filter))
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.id - a.id)
    .map((row) => cashExpenseView(row));
};

const ACTIONS = {
  pengajuan: { method: "POST", guard: "UPDATE" },
  tarik: { method: "PUT", guard: "UPDATE" },
  bayar: { method: "PUT", guard: "UPDATE" },
  batal: { method: "PUT", guard: "DELETE" },
} as const;

export const kasKeluarMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/kas-keluar(?:\/([^/]+))?(?:\/(pengajuan|tarik|bayar|batal))?$/,
  );
  if (!match) return null;

  const publicId = match[1] ? decodeURIComponent(match[1]) : undefined;
  const actionName = match[2] as keyof typeof ACTIONS | undefined;
  const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
    ctx.can(MENU.KAS_KELUAR, action);

  if (actionName && publicId) {
    const action = ACTIONS[actionName];
    if (ctx.method !== action.method) return null;
    if (!can(action.guard)) return denied();

    const row = expenseOf(publicId);
    if (!row) return failure(404, NOT_FOUND);

    if (actionName === "pengajuan") return onSubmit(row);
    if (actionName === "tarik") return onWithdraw(row);
    if (actionName === "bayar") return onPay(row);

    return onCancel(ctx.request, row);
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();
    if (!publicId) {
      if (process.env.MOCK_500) return serverError();

      return list(
        listRows(ctx.url),
        ctx.url,
        NAME,
        NAME,
        `Berhasil Mendapatkan ${NAME}`,
      );
    }

    const row = expenseOf(publicId);

    return row
      ? ok(`Berhasil Mendapatkan ${NAME}`, row)
      : failure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !publicId) {
    return can("CREATE") ? onCreate(ctx.request) : denied();
  }

  if (ctx.method === "PUT" && publicId) {
    if (!can("UPDATE")) return denied();

    const row = expenseOf(publicId);

    return row ? onUpdate(ctx.request, row) : failure(404, NOT_FOUND);
  }

  if (ctx.method === "DELETE" && publicId) {
    if (!can("DELETE")) return denied();

    const row = expenseOf(publicId);

    return row ? onDelete(row) : failure(404, NOT_FOUND);
  }

  return null;
};
