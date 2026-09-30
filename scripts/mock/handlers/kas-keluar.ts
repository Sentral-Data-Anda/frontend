/**
 * Tiruan `/api/v1/kas-keluar` (kontrak Keuangan §11). Mengubah hanya larik
 * `CASH_EXPENSE` di berkas ini; persetujuan dibaca sebagai `approval` supaya
 * "Menunggu persetujuan" bisa diturunkan tanpa status dokumen baru.
 *
 *   MOCK_EMPTY=1            → daftar kosong (404)
 *   MOCK_500=1              → daftar menjawab 500
 *   MOCK_PERIOD_CLOSED=1    → bayar ditolak: periode tertutup
 *   MOCK_NO_WORKFLOW=1      → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_MEDIA_EXPIRED=1    → nota 403 (media.ts)
 */
import { MENU } from "../../../src/config/menu";
import type { ApprovalStatus } from "../../../src/types/persetujuan";
import { SESSION_USER_ID } from "../../mock-dashboard";
import { bapelOf } from "../fasilitas-store";
import {
  TODAY,
  accountOf,
  codeOf,
  isLive,
  monthLabel,
  nextId,
  periodOf,
  userNameOf,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  filesOf,
  mediaUrl,
  putMedia,
  readMultipart,
  seedImage,
  seedPdf,
} from "../media";

type Issue = { path: string; message: string };

type Note = {
  publicId: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

type LineRow = {
  publicId: string;
  accountId: number;
  amount: number;
  description: string | null;
};

type ApprovalRow = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  note: string | null;
  submittedBy: number;
};

type ExpenseRow = {
  id: number;
  publicId: string;
  code: string;
  deletedAt: string | null;
  expenseDate: string;
  description: string;
  payee: string;
  paidFromAccountId: number;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  status: "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";
  approvals: ApprovalRow[];
  approvedById: number | null;
  approvedAt: string | null;
  journalCode: string | null;
  lines: LineRow[];
  notes: Note[];
};

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

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

const money = (value: number) => String(Number(value.toFixed(2)));

const totalOf = (row: ExpenseRow) =>
  row.lines.reduce((sum, line) => sum + line.amount, 0);

let lineCount = 0;

const lineOf = (
  accountId: number,
  amount: number,
  description: string | null = null,
): LineRow => {
  lineCount += 1;

  return {
    publicId: `cel-${pad(lineCount)}`,
    accountId,
    amount,
    description,
  };
};

let noteCount = 0;

const seedNote = (label: string, kind: "image" | "pdf"): Note => {
  noteCount += 1;
  const path = `cash-expense/seed-${noteCount}.${kind === "pdf" ? "pdf" : "jpeg"}`;

  return {
    publicId: `cen-${pad(noteCount)}`,
    path,
    name: label,
    mimeType: kind === "pdf" ? "application/pdf" : "image/jpeg",
    size:
      kind === "pdf"
        ? seedPdf(path)
        : seedImage(path, label, 25 + noteCount * 40),
  };
};

const approvalOf = (
  id: number,
  status: ApprovalStatus,
  submittedBy: number,
  note: string | null = null,
): ApprovalRow => ({
  publicId: `0b5e7a00-0000-4000-a000-${pad(id, 12)}`,
  code: `PST-2026-${pad(id)}`,
  status,
  note,
  submittedBy,
});

const monthStart = (back: number) => {
  const month = Number(TODAY.slice(5, 7)) - back;
  const year = Number(TODAY.slice(0, 4)) + Math.floor((month - 1) / 12);
  const wrapped = ((month - 1 + 12) % 12) + 1;

  return `${year}-${pad(wrapped, 2)}-05`;
};

const day = (back: number) => {
  const date = new Date(`${TODAY}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - back);

  return date.toISOString().slice(0, 10);
};

// `publicId` mengikuti dokumen permintaan persetujuan di mock Persetujuan
// (`doc-<id>`) supaya tautan dua arah hidup di peramban.
export const CASH_EXPENSE: ExpenseRow[] = [
  {
    id: 1,
    publicId: "doc-7",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(1),
    description: "Perbaikan pompa air gedung serbaguna",
    payee: "CV Tirta Nusantara",
    paidFromAccountId: 4,
    bapelId: null,
    method: "Transfer",
    reference: "PSN-2026-0012",
    status: "DRAFT",
    approvals: [approvalOf(7, "PENDING", SESSION_USER_ID)],
    approvedById: null,
    approvedAt: null,
    journalCode: null,
    lines: [lineOf(22, 3_200_000, "Servis dan penggantian impeler")],
    notes: [],
  },
  {
    id: 2,
    publicId: "doc-2",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(3),
    description: "Konsumsi rapat majelis Oktober",
    payee: "Katering Bunda Sari",
    paidFromAccountId: 2,
    bapelId: 1,
    method: "Tunai",
    reference: null,
    status: "DRAFT",
    approvals: [approvalOf(2, "PENDING", 12)],
    approvedById: null,
    approvedAt: null,
    journalCode: null,
    lines: [
      lineOf(23, 3_000_000, "Makan siang 60 porsi"),
      lineOf(23, 1_500_000, "Snack dan minuman"),
    ],
    notes: [],
  },
  {
    id: 3,
    publicId: "doc-17",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(10),
    description: "Bunga dan dekorasi Minggu Syukur",
    payee: "Florist Anggrek Indah",
    paidFromAccountId: 2,
    bapelId: 3,
    method: "Tunai",
    reference: "NOTA/2026/1187",
    status: "APPROVED",
    approvals: [approvalOf(17, "APPROVED", 14)],
    approvedById: 15,
    approvedAt: `${day(9)}T03:20:00.000Z`,
    journalCode: null,
    lines: [lineOf(23, 1_250_000, "Rangkaian altar dan mimbar")],
    notes: [seedNote("Nota florist", "image")],
  },
  {
    id: 4,
    publicId: "doc-19",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(7),
    description: "Sewa tenda retret pemuda",
    payee: "Sewa Tenda Barito",
    paidFromAccountId: 4,
    bapelId: 2,
    method: "Transfer",
    reference: "PSN-2026-0019",
    status: "DRAFT",
    approvals: [
      approvalOf(
        19,
        "REJECTED",
        16,
        "Kas komisi belum cukup bulan ini. Ajukan kembali awal bulan depan.",
      ),
    ],
    approvedById: null,
    approvedAt: null,
    journalCode: null,
    lines: [
      lineOf(23, 5_800_000, "Tenda 4 unit, 3 hari"),
      lineOf(23, 1_500_000, "Kursi dan panggung"),
    ],
    notes: [],
  },
  {
    id: 5,
    publicId: "doc-22",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(25),
    description: "Servis pendingin ruang ibadah",
    payee: "PT Adem Sejahtera",
    paidFromAccountId: 4,
    bapelId: 1,
    method: "Transfer",
    reference: "PSN-2026-0004",
    status: "PAID",
    approvals: [approvalOf(22, "APPROVED", 12)],
    approvedById: 13,
    approvedAt: `${day(24)}T02:00:00.000Z`,
    journalCode: `JRN-2026-${pad(31)}`,
    lines: [
      lineOf(22, 2_600_000, "Servis 4 unit AC"),
      lineOf(23, 1_000_000, "Penggantian filter"),
    ],
    notes: [seedNote("Invoice servis AC", "pdf")],
  },
  {
    id: 6,
    publicId: "ce-0006-draft-open",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(0),
    description: "Tagihan listrik gedung ibadah September",
    payee: "PLN UP3 Medan",
    paidFromAccountId: 2,
    bapelId: null,
    method: "QRIS",
    reference: "IDPEL 512300998877",
    status: "DRAFT",
    approvals: [],
    approvedById: null,
    approvedAt: null,
    journalCode: null,
    lines: [
      lineOf(22, 1_850_000, "Listrik September"),
      lineOf(23, 12_500, "Biaya admin"),
    ],
    notes: [
      seedNote("Struk PLN", "image"),
      seedNote("Rincian tagihan", "image"),
      seedNote("Bukti QRIS", "pdf"),
    ],
  },
  {
    id: 7,
    publicId: "ce-0007-closed-month",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: monthStart(3),
    description: "Honor pemusik tamu bulan lalu",
    payee: "Samuel Lumbantobing",
    paidFromAccountId: 2,
    bapelId: 5,
    method: "Transfer",
    reference: null,
    status: "APPROVED",
    approvals: [approvalOf(13, "APPROVED", 14)],
    approvedById: 15,
    approvedAt: `${monthStart(3)}T04:00:00.000Z`,
    journalCode: null,
    lines: [lineOf(23, 2_100_000, "Honor 3 kebaktian")],
    notes: [],
  },
  {
    id: 8,
    publicId: "ce-0008-cancelled",
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: day(18),
    description: "Pembelian alat tulis sekretariat",
    payee: "Toko Buku Immanuel",
    paidFromAccountId: 2,
    bapelId: null,
    method: "Tunai",
    reference: "NOTA/2026/0904",
    status: "CANCELLED",
    approvals: [approvalOf(11, "APPROVED", SESSION_USER_ID)],
    approvedById: 13,
    approvedAt: `${day(17)}T02:00:00.000Z`,
    journalCode: `JRN-2026-${pad(28)}`,
    lines: [lineOf(23, 780_000, "Kertas, tinta, dan map")],
    notes: [],
  },
];

const expenseOf = (publicId: string) =>
  CASH_EXPENSE.find((row) => isLive(row) && row.publicId === publicId);

const openApprovalOf = (row: ExpenseRow) =>
  row.approvals.at(-1)?.status === "PENDING" ? row.approvals.at(-1)! : null;

const noteView = (note: Note) => ({
  publicId: note.publicId,
  name: note.name,
  mimeType: note.mimeType,
  size: note.size,
  showOnWebsite: false,
  url: mediaUrl(note.path),
});

const accountRefOf = (id: number) => {
  const account = accountOf(id);

  return account
    ? { id: account.id, code: account.code, name: account.name }
    : { id, code: "?", name: "Akun terhapus" };
};

const expenseView = (row: ExpenseRow, isDetail = false) => {
  const approval = row.approvals.at(-1) ?? null;
  const bapel = row.bapelId === null ? null : bapelOf(row.bapelId);
  const base = {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    expenseDate: `${row.expenseDate}T00:00:00.000Z`,
    description: row.description,
    payee: row.payee,
    paidFromAccountId: row.paidFromAccountId,
    paidFromAccount: accountRefOf(row.paidFromAccountId),
    bapelId: row.bapelId,
    bapel: bapel ? { code: bapel.code, name: bapel.name } : null,
    method: row.method,
    reference: row.reference,
    totalAmount: money(totalOf(row)),
    status: row.status,
    programId: null,
    approval: approval
      ? {
          publicId: approval.publicId,
          code: approval.code,
          status: approval.status,
          note: approval.note,
          isSubmittedByViewer: approval.submittedBy === SESSION_USER_ID,
        }
      : null,
    approvedBy: userNameOf(row.approvedById),
    approvedAt: row.approvedAt,
  };

  if (!isDetail) return { ...base, lineCount: row.lines.length };

  return {
    ...base,
    lines: row.lines.map((line) => ({
      publicId: line.publicId,
      accountId: line.accountId,
      account: accountRefOf(line.accountId),
      amount: money(line.amount),
      description: line.description,
    })),
    attachments: row.notes.map(noteView),
    journal: row.journalCode
      ? { code: row.journalCode, status: "POSTED" as const }
      : null,
  };
};

const ok = (message: string, row: ExpenseRow, status = 200) =>
  json({ status, message, data: expenseView(row, true) }, status);

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

  if (!accountId)
    issues.push({ path: at("accountId"), message: "Mohon Lengkapi Pos" });
  else {
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
  const bapelId = Number(text(form, "bapelId")) || null;
  const method = text(form, "method") || null;
  const reference = text(form, "reference") || null;
  const rawLines = jsonOf(
    form.get("lines") === null ? "[]" : String(form.get("lines")),
  );
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

  if (!payee)
    issues.push({ path: "payee", message: "Mohon Lengkapi Penerima" });
  else if (payee.length > 150) {
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

  if (bapelId !== null && !bapelOf(bapelId)) {
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
    bapelId,
    method,
    reference,
    lines,
    kept: kept as string[] | null,
    files,
  };
};

const writableFailure = (row: ExpenseRow): Response | null => {
  if (openApprovalOf(row)) {
    return failure(
      400,
      `${NAME} Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu`,
    );
  }

  return row.status === "DRAFT"
    ? null
    : failure(400, `Hanya ${NAME} Berstatus Draft Yang Bisa Diubah`);
};

const noteFailure = (parsed: Parsed, current: readonly Note[]) => {
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

const storeNote = async (file: File): Promise<Note> => ({
  publicId: crypto.randomUUID(),
  ...(await putMedia(file, "cash-expense")),
});

const toLines = (lines: ParsedLine[]) =>
  lines.map((line) => lineOf(line.accountId, line.amount, line.description));

const onCreate = async (request: Request) => {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form, false);
  if (Array.isArray(parsed)) return invalid(parsed);

  const row: ExpenseRow = {
    id: nextId(CASH_EXPENSE),
    publicId: crypto.randomUUID(),
    code: codeOf("BKK", { yearly: true }),
    deletedAt: null,
    expenseDate: parsed.expenseDate,
    description: parsed.description,
    payee: parsed.payee,
    paidFromAccountId: parsed.paidFromAccountId,
    bapelId: parsed.bapelId,
    method: parsed.method,
    reference: parsed.reference,
    status: "DRAFT",
    approvals: [],
    approvedById: null,
    approvedAt: null,
    journalCode: null,
    lines: toLines(parsed.lines),
    notes: await Promise.all(parsed.files.map(storeNote)),
  };
  CASH_EXPENSE.push(row);

  return ok(`Berhasil Menambahkan ${NAME}`, row, 201);
};

const onUpdate = async (request: Request, row: ExpenseRow) => {
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

const onDelete = (row: ExpenseRow) => {
  const rejected = writableFailure(row);
  if (rejected) return rejected;

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: `Berhasil Menghapus ${NAME}`,
    data: { publicId: row.publicId, code: row.code },
  });
};

const onSubmit = (row: ExpenseRow) => {
  if (openApprovalOf(row)) {
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

  const approval = approvalOf(
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

const onWithdraw = (row: ExpenseRow) => {
  const approval = openApprovalOf(row);

  if (!approval) {
    return failure(400, "Permintaan Persetujuan Ini Sudah Selesai");
  }
  if (approval.submittedBy !== SESSION_USER_ID) {
    return failure(403, "Hanya Pengaju Yang Dapat Menarik Permintaan Ini");
  }

  approval.status = "CANCELLED";

  return ok(`Berhasil Menarik Pengajuan ${NAME}`, row);
};

const periodFailure = (date: string) => {
  const period = periodOf(date);
  const label = `${monthLabel(Number(date.slice(0, 4)), Number(date.slice(5, 7)))}`;

  if (!period) {
    return failure(400, `Periode Fiskal ${label} Belum Dibuka`, {
      code: "PERIOD_NOT_OPEN",
    });
  }

  return period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED
    ? failure(400, `Periode Fiskal ${label} Sudah Ditutup`, {
        code: "PERIOD_CLOSED",
      })
    : null;
};

const onPay = (row: ExpenseRow) => {
  if (row.status === "PAID") return failure(400, `${NAME} Ini Sudah Dibayar`);
  if (row.status !== "APPROVED") {
    return failure(400, `${NAME} Ini Belum Disetujui`);
  }

  const rejected = periodFailure(row.expenseDate);
  if (rejected) return rejected;

  row.status = "PAID";
  row.journalCode = codeOf("JRN-2026");

  return ok(`Berhasil Mencatat Pembayaran ${NAME}`, row);
};

const onCancel = async (request: Request, row: ExpenseRow) => {
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
    const rejected = periodFailure(TODAY);
    if (rejected) return rejected;
  }

  row.status = "CANCELLED";

  return ok(`Berhasil Membatalkan ${NAME}`, row);
};

const jakartaMatches = (row: ExpenseRow, filter: string) =>
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

      return (openApprovalOf(row) !== null) === (pending === "1");
    })
    .filter((row) => !filter || jakartaMatches(row, filter))
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.id - a.id)
    .map((row) => expenseView(row));
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
