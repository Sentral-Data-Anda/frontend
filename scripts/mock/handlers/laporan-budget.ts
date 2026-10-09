/**
 * Tiruan `/api/v1/laporan-budget` (kontrak Anggaran §5). Larik
 * `BUDGET_USAGE_REPORT` milik handler ini.
 *
 * Bacaan, `belum-lapor`, dan `prefill` memakai fungsi pencairan yang sama
 * dengan gerbang, supaya layar dan gerbang tidak pernah berbeda pendapat.
 *
 *   MOCK_EMPTY=1          → daftar kosong (404)
 *   MOCK_500=1            → daftar menjawab 500
 *   MOCK_SAVE_ERROR=1     → POST/PUT/DELETE menjawab 500
 *   MOCK_REPORT_PENDING=1 → laporan bulan lalu masih Draf (gerbang menyala)
 *   MOCK_NO_PREFILL=1     → prefill kosong (bukan galat)
 *   MOCK_WAIVED=1         → satu komisi dibebaskan bulan lalu, dengan alasan
 *   MOCK_CEILING_FULL=1   → pagu komisi terpakai penuh oleh laporan disetujui
 *   MOCK_NO_WORKFLOW=1    → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_NO_PENGURUS=1    → ajukan ditolak: komisi tanpa pemegang jabatan
 *   MOCK_MEDIA_EXPIRED=1  → kwitansi 403 (media.ts)
 */
import { MENU } from "../../../src/config/menu";
import { addDays, addMonths, monthLabel } from "../../../src/lib/date";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  BUDGET_USAGE_REPORT,
  approvalStep,
  receiptView,
  GATE_WAIVER,
  PROGRAM,
  TODAY,
  codeOf,
  complianceRows,
  untaggedMonth,
  disbursementsIn,
  isLive,
  isVisibleBapel,
  komisiScopeOf,
  nextId,
  prefillLines,
  previousMonth,
  reportLine,
  reportLineView,
  reportOf,
  reportOpenApproval,
  reportView,
  startOfMonth,
  type BudgetReportRow,
  type KomisiScope,
  type ProgramApprovalRow,
  type ReportLineRow,
} from "../anggaran-store";
import { accountOf, cashExpenseTotal } from "../keuangan-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";
import { filesOf, putMedia, seedImage, seedPdf } from "../media";

type Issue = { path: string; message: string };

const NAME = "Laporan Pemakaian Budget";

const NOT_FOUND = `${NAME} Tidak Ditemukan`;

const MAX_RECEIPTS = 20;

const MONEY_MAX = 9_999_999_999_999;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "application/pdf",
];

const MAX_BYTES = 10_000_000;

// Tiga tanda tangan jabatan; alur bawaannya di-seed migrasi be-sada. Layar
// membaca jumlahnya dari `steps.length`, bukan dari angka ini.
const APPROVAL_STEPS = [
  "Ketua Pengurus",
  "Sekretaris/Bendahara Pengurus",
  "Majelis Pendamping Komisi",
];

// Ukuran berkas tidak punya kolom di baris store, dan bentuk lampiran be-sada
// membawanya. Dicatat di samping, bukan diam-diam dikirim nol.
export const reportFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

const invalid = (issues: Issue[], status = 400) =>
  reportFailure(status, issues[0]?.message ?? "Data tidak valid", { issues });

const pad = (value: number) => String(value).padStart(2, "0");

const monthKeyOf = (year: number, month: number) => `${year}-${pad(month)}`;

/**
 * Bentuk bersama store dipakai apa adanya, lalu ditambah empat hal yang
 * dibutuhkan layar dan belum ada di sana: `programId` dan `bapelId` numerik
 * untuk mengisi awal form, `publicId` tahap untuk QR verifikasi, dan
 * `disbursementTotal` untuk strip selisih — yang dihitung dengan fungsi
 * pencairan yang sama dengan gerbang, bukan kueri keempat.
 */
const detailView = (row: BudgetReportRow) => {
  const view = reportView(row, true);
  const approval = view.approval;

  return {
    ...view,
    bapelId: row.bapelId,
    lines: row.lines.map(reportLineView),
    listReceipt: row.receipts.map(receiptView),
    disbursementTotal: disbursedTotalOf(row),
    approval,
  };
};

const disbursedTotalOf = (row: BudgetReportRow) =>
  String(
    disbursementsIn(row.bapelId, row.year, row.month).reduce(
      (total, expense) => total + Number(cashExpenseTotal(expense)),
      0,
    ),
  );

const listRows = (url: URL, scope: KomisiScope) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const month = Number(url.searchParams.get("month")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const status = url.searchParams.get("status") ?? "";
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return BUDGET_USAGE_REPORT.filter((row) => {
    if (!isLive(row)) return false;
    if (!isVisibleBapel(scope, row.bapelId)) return false;
    if (year && row.year !== year) return false;
    if (month && row.month !== month) return false;
    if (bapelId && row.bapelId !== bapelId) return false;
    if (status === "DRAFT" || status === "APPROVED") {
      if (row.status !== status) return false;
    }

    return true;
  })
    .map((row) => reportView(row))
    .filter(
      (row) =>
        !filter ||
        row.code.toLowerCase().includes(filter) ||
        (row.bapel?.name ?? "").toLowerCase().includes(filter),
    )
    .sort(
      (left, right) =>
        right.year - left.year ||
        right.month - left.month ||
        right.code.localeCompare(left.code),
    );
};

// Bawaan bulan lalu: LPJ ditulis di awal bulan untuk bulan yang baru selesai.
// Bulan KALENDER, bukan tahun pelayanan.
const defaultPeriod = () =>
  previousMonth(Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7)));

const monthParams = (url: URL) => {
  const fallback = defaultPeriod();

  return {
    year: Number(url.searchParams.get("year")) || fallback.year,
    month: Number(url.searchParams.get("month")) || fallback.month,
  };
};

const compliance = (url: URL, scope: KomisiScope) => {
  const { year, month } = monthParams(url);
  const rows = complianceRows(year, month, scope).map((row, index) => ({
    ...row,
    bapelId: bapelIdOf(row, index),
    label: monthLabel(monthKeyOf(year, month)),
  }));

  // `untagged` di SAMPING `data`, seperti `totalData` pada bacaan berpaginasi,
  // dan TANPA 404 pada daftar kosong — berbeda dari ketiga daftar Anggaran:
  // respons ini membawa fakta kedua yang bukan bagian daftarnya, dan 404
  // membuangnya. Tidak di-scope: sisa tak-bertanda bukan milik komisi mana pun.
  return json({
    status: 200,
    message: "Berhasil Mendapatkan Kepatuhan Laporan",
    data: rows,
    untagged: untaggedMonth(year, month),
  });
};

// `complianceRows` mengembalikan komisi sebagai `BapelRef`; id numeriknya
// dibutuhkan untuk mengisi awal form Tambah laporan dari baris Belum lapor.
const bapelIdOf = (
  row: { bapel: { code: string } | null },
  index: number,
): number => {
  const fromCode = Number((row.bapel?.code ?? "").replace("BPL-", ""));

  return Number.isInteger(fromCode) && fromCode > 0 ? fromCode : index + 1;
};

const prefill = (url: URL, scope: KomisiScope) => {
  const { year, month } = monthParams(url);
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const isEmpty =
    Boolean(process.env.MOCK_NO_PREFILL) ||
    !bapelId ||
    !isVisibleBapel(scope, bapelId);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Rincian Kas Keluar",
    data: isEmpty
      ? { lines: [], total: "0" }
      : prefillLines(bapelId, year, month),
  });
};

type Parsed = {
  bapelId: number;
  year: number;
  month: number;
  note: string | null;
  lines: {
    accountId: number;
    programId: number | null;
    spentDate: string;
    description: string;
    amount: string;
  }[];
  kept: string[] | null;
  files: File[];
};

const text = (form: FormData, key: string) => {
  const value = form.get(key);

  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
};

const jsonOf = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const amountIssue = (value: unknown, path: string): Issue | null => {
  const raw = typeof value === "number" ? String(value) : String(value ?? "");
  const amount = Number(raw);

  if (!raw) return { path, message: "Mohon Lengkapi Nominal" };
  if (Number.isNaN(amount) || amount <= 0) {
    return { path, message: "Nominal Harus Lebih Dari 0" };
  }
  if (amount > MONEY_MAX) return { path, message: "Nominal Terlalu Besar" };
  if ((raw.split(".")[1] ?? "").length > 2) {
    return { path, message: "Nominal Maksimal 2 Angka Di Belakang Koma" };
  }

  return null;
};

const monthBounds = (year: number, month: number) => {
  const from = `${monthKeyOf(year, month)}-01`;

  return { from, to: addDays(addMonths(from, 1), -1) };
};

const spentDateIssue = (
  value: unknown,
  path: string,
  year: number,
  month: number,
): Issue | null => {
  const date = typeof value === "string" ? value : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { path, message: "Tanggal Pemakaian Tidak Valid" };
  }
  if (date > TODAY) {
    return { path, message: "Tanggal Pemakaian Tidak Boleh Di Masa Depan" };
  }

  const bounds = monthBounds(year, month);

  return date < bounds.from || date > bounds.to
    ? { path, message: "Tanggal Pemakaian Harus Berada Di Bulan Laporan" }
    : null;
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
  const bapelId = Number(text(form, "bapelId")) || 0;
  const year = Number(text(form, "year")) || 0;
  const month = Number(text(form, "month")) || 0;
  const note = text(form, "note") || null;
  const rawLines = jsonOf(text(form, "lines") || "[]");
  const kept = keptOf(form, isUpdate);
  const files = filesOf(form, "receipt");

  if (!bapelId) {
    issues.push({ path: "bapelId", message: "Mohon Lengkapi Komisi" });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    issues.push({ path: "year", message: "Tahun Tidak Valid" });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    issues.push({ path: "month", message: "Bulan Tidak Valid" });
  }
  if (note && note.length > 250) {
    issues.push({
      path: "note",
      message: "Keterangan tidak boleh lebih dari 250 karakter",
    });
  }

  const current = startOfMonth(TODAY).slice(0, 7);
  if (month >= 1 && month <= 12 && monthKeyOf(year, month) > current) {
    issues.push({
      path: "month",
      message: "Bulan Laporan Tidak Boleh Di Masa Depan",
    });
  }

  const rows = Array.isArray(rawLines) ? rawLines : [];

  if (!Array.isArray(rawLines)) {
    issues.push({ path: "lines", message: "Format Rincian Tidak Valid" });
  } else if (rows.length === 0) {
    issues.push({
      path: "lines",
      message: `${NAME} harus memiliki minimal 1 baris pemakaian`,
    });
  }

  const lines = rows.map((raw, index) => {
    const line = (raw ?? {}) as Record<string, unknown>;
    const at = (field: string) => `lines.${index}.${field}`;
    const accountId = Number(line.accountId) || 0;
    const description = String(line.description ?? "")
      .trim()
      .replace(/\s+/g, " ");

    if (!accountId) {
      issues.push({ path: at("accountId"), message: "Mohon Lengkapi Pos" });
    }
    if (!description) {
      issues.push({
        path: at("description"),
        message: "Mohon Lengkapi Uraian",
      });
    } else if (description.length > 250) {
      issues.push({
        path: at("description"),
        message: "Uraian tidak boleh lebih dari 250 karakter",
      });
    }

    const amount = amountIssue(line.amount, at("amount"));
    if (amount) issues.push(amount);

    const spent = spentDateIssue(line.spentDate, at("spentDate"), year, month);
    if (spent) issues.push(spent);

    return {
      accountId,
      programId: Number(line.programId) || null,
      spentDate: String(line.spentDate ?? ""),
      description,
      amount: String(line.amount ?? ""),
    };
  });

  if (kept === "bad") {
    issues.push({
      path: "keepFiles",
      message: "Format Kwitansi Yang Dipertahankan Tidak Valid",
    });
  }

  // Jumlah berkas diperiksa sebelum satu pun diunggah: batas yang diperiksa
  // sesudah loop unggah meninggalkan objek sampah di bucket.
  if (
    (kept === "bad" ? 0 : (kept?.length ?? 0)) + files.length >
    MAX_RECEIPTS
  ) {
    issues.push({
      path: "receipt",
      message: `Kwitansi Tidak Boleh Lebih Dari ${MAX_RECEIPTS} File`,
    });
  }

  return issues.length > 0
    ? issues
    : {
        bapelId,
        year,
        month,
        note,
        lines,
        kept: kept as string[] | null,
        files,
      };
};

const fileFailure = (files: readonly File[]) => {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return reportFailure(415, "Unsupported file type");
    }
    if (file.size > MAX_BYTES) return reportFailure(400, "File too large");
  }

  return null;
};

const accountFailure = (lines: Parsed["lines"]) => {
  for (const [index, line] of lines.entries()) {
    const path = `lines.${index}.accountId`;
    const account = accountOf(line.accountId);

    if (!account || !isLive(account)) {
      return reportFailure(404, "Akun Tidak Ditemukan");
    }
    if (!account.isActive) {
      return reportFailure(
        400,
        `Akun ${account.code} ${account.name} Sudah Nonaktif`,
        {
          code: "ACCOUNT_INACTIVE",
          issues: [{ path, message: "Pos nonaktif" }],
        },
      );
    }
    if (account.type !== "EXPENSE" && account.type !== "ASSET") {
      return invalid([
        { path, message: "Pilih pos beban atau pos aset tetap" },
      ]);
    }
  }

  return null;
};

const programFailure = (lines: Parsed["lines"], bapelId: number) => {
  for (const [index, line] of lines.entries()) {
    if (line.programId === null) continue;

    const program = PROGRAM.find(
      (row) => isLive(row) && row.id === line.programId,
    );

    if (!program) return reportFailure(404, "Program Tidak Ditemukan");

    if (program.bapelId !== bapelId) {
      return reportFailure(
        400,
        `Program ${program.code} Bukan Milik Komisi Ini`,
        {
          code: "PROGRAM_FOREIGN_BAPEL",
          issues: [
            {
              path: `lines.${index}.programId`,
              message: "Program bukan milik komisi ini",
            },
          ],
        },
      );
    }
  }

  return null;
};

const duplicateFailure = (parsed: Parsed, exceptId?: number) => {
  const existing = reportOf(parsed.bapelId, parsed.year, parsed.month);

  if (!existing || existing.id === exceptId) return null;

  return reportFailure(
    409,
    `${NAME} Komisi Ini Untuk Bulan ${parsed.month}/${parsed.year} Sudah Ada`,
    {
      issues: [{ path: "month", message: "Laporan bulan ini sudah ada" }],
    },
  );
};

const lockFailure = (row: BudgetReportRow) => {
  if (row.status === "APPROVED") {
    return reportFailure(400, "Laporan Ini Sudah Disetujui", {
      code: "ALREADY_APPROVED",
    });
  }
  if (reportOpenApproval(row)) {
    return reportFailure(
      400,
      "Laporan Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Lebih Dulu",
      { code: "UNDER_APPROVAL" },
    );
  }

  return null;
};

const toLineRows = (lines: Parsed["lines"]): ReportLineRow[] =>
  lines.map((line) =>
    reportLine(
      line.accountId,
      line.spentDate,
      line.description,
      line.amount,
      line.programId,
      null,
    ),
  );

const storeReceipt = async (file: File) => {
  const publicId = crypto.randomUUID();
  const stored = await putMedia(file, "budget-usage-report");

  return {
    publicId,
    path: stored.path,
    name: stored.name,
    size: stored.size,
    mimeType: stored.mimeType,
  };
};

const onCreate = async (request: Request, scope: KomisiScope) => {
  const form = await request.formData();
  const parsed = parse(form, false);

  if (Array.isArray(parsed)) return invalid(parsed);

  // Membuat LPJ di-scope, dan jawabannya 404 — bukan 403. Baris LPJ unik per
  // komisi-bulan, jadi create yang tidak di-scope menempati satu-satunya slot
  // komisi lain untuk bulan itu dan memblokir pencairannya.
  if (!isVisibleBapel(scope, parsed.bapelId)) {
    return reportFailure(404, "Komisi Tidak Ditemukan", {
      issues: [{ path: "bapelId", message: "Komisi tidak ditemukan" }],
    });
  }

  const failure =
    duplicateFailure(parsed) ??
    fileFailure(parsed.files) ??
    accountFailure(parsed.lines) ??
    programFailure(parsed.lines, parsed.bapelId);

  if (failure) return failure;

  const id = nextId(BUDGET_USAGE_REPORT);
  const row: BudgetReportRow = {
    id,
    publicId: `lpb-${String(id).padStart(4, "0")}`,
    code: codeOf("LPB", { yearly: true }),
    bapelId: parsed.bapelId,
    year: parsed.year,
    month: parsed.month,
    status: "DRAFT",
    note: parsed.note,
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    lines: toLineRows(parsed.lines),
    receipts: await Promise.all(parsed.files.map(storeReceipt)),
    approvals: [],
  };

  BUDGET_USAGE_REPORT.push(row);

  return json(
    {
      status: 201,
      message: `Berhasil Menambahkan ${NAME}`,
      data: detailView(row),
    },
    201,
  );
};

const onUpdate = async (
  request: Request,
  row: BudgetReportRow,
  scope: KomisiScope,
) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  const form = await request.formData();
  const parsed = parse(form, true);

  if (Array.isArray(parsed)) return invalid(parsed);

  // Pencarian row sudah berlingkup, jadi yang dijaga di sini BUKAN membaca
  // laporan orang lain — melainkan MEMINDAHKAN laporan sendiri ke nama komisi
  // lain. Itu punya akibat uang: LPJ yang disetujui membuka pencairan bulan
  // berikutnya untuk komisi yang namanya tertulis. Dan tulisannya sekali
  // jalan — sesudah mendarat, pencarian berlingkup tidak menemukannya lagi,
  // jadi komisi yang berhak kehilangan laporannya sendiri tanpa jalan kembali.
  //
  // `bapelOf()` yang dulu di sini menjawab "komisinya ada atau tidak", BUKAN
  // "pemanggil boleh memakainya" — di call site ia terbaca seperti penjaga.
  // Bentuk dan kalimatnya kini sama persis dengan `onCreate`.
  if (!isVisibleBapel(scope, parsed.bapelId)) {
    return reportFailure(404, "Komisi Tidak Ditemukan", {
      issues: [{ path: "bapelId", message: "Komisi tidak ditemukan" }],
    });
  }

  const failure =
    duplicateFailure(parsed, row.id) ??
    fileFailure(parsed.files) ??
    accountFailure(parsed.lines) ??
    programFailure(parsed.lines, parsed.bapelId);

  if (failure) return failure;

  const kept = parsed.kept;

  if (kept?.some((id) => !row.receipts.some((item) => item.publicId === id))) {
    return invalid([{ path: "receipt", message: "Kwitansi Tidak Ditemukan" }]);
  }

  row.bapelId = parsed.bapelId;
  row.year = parsed.year;
  row.month = parsed.month;
  row.note = parsed.note;
  row.lines = toLineRows(parsed.lines);
  row.receipts = [
    ...(kept === null
      ? row.receipts
      : row.receipts.filter((item) => kept.includes(item.publicId))),
    ...(await Promise.all(parsed.files.map(storeReceipt))),
  ];

  return json({
    status: 200,
    message: `Berhasil Mengubah ${NAME}`,
    data: detailView(row),
  });
};

const onDelete = (row: BudgetReportRow) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  row.deletedAt = `${TODAY}T02:00:00.000Z`;

  return json({ status: 200, message: `Berhasil Menghapus ${NAME}` });
};

const submitFailureOf = () => {
  if (process.env.MOCK_NO_WORKFLOW) {
    return {
      status: 400,
      code: "NO_WORKFLOW" as const,
      error: "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    };
  }
  if (process.env.MOCK_NO_PENGURUS) {
    return {
      status: 400,
      code: "NO_POSITION_HOLDER" as const,
      error: `Komisi Ini Belum Punya Pengurus Berjabatan ${APPROVAL_STEPS[0]}`,
    };
  }

  return null;
};

const onSubmit = (row: BudgetReportRow) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  const failure = submitFailureOf();

  if (failure) {
    const { status, error, ...extra } = failure;

    return reportFailure(status, error, extra);
  }

  row.approvals.push({
    publicId: `apr-lpb-${String(row.approvals.length + 1).padStart(2, "0")}-${row.publicId}`,
    code: codeOf("APR", { yearly: true }),
    status: "PENDING",
    currentOrder: 1,
    submittedById: SESSION_USER_ID,
    steps: APPROVAL_STEPS.map((roleName, index) =>
      approvalStep(index + 1, roleName, "PENDING"),
    ),
  });

  return json({
    status: 200,
    message: `Berhasil Mengajukan ${NAME}`,
    data: detailView(row),
  });
};

const onWithdraw = (row: BudgetReportRow) => {
  const approval = reportOpenApproval(row);

  if (!approval) {
    return reportFailure(400, "Laporan Ini Tidak Sedang Menunggu Persetujuan");
  }
  if (approval.submittedById !== SESSION_USER_ID) {
    return reportFailure(403, "Hanya Pengaju Yang Dapat Menarik Pengajuan Ini");
  }

  approval.status = "CANCELLED";
  approval.steps.forEach((step) => {
    if (step.status === "PENDING") step.status = "CANCELLED";
  });

  return json({
    status: 200,
    message: `Berhasil Menarik Pengajuan ${NAME}`,
    data: detailView(row),
  });
};

export const laporanBudgetMock: MockHandler = (ctx) => {
  const match = ctx.path.match(
    /^\/laporan-budget(?:\/([^/]+))?(?:\/(pengajuan|tarik))?$/,
  );
  if (!match) return null;

  const [, id, segment] = match;
  const can = (action: MockAction) => ctx.can(MENU.BUDGET_REALIZATION, action);
  const scope = komisiScopeOf(ctx.isAdmin, ctx.can(MENU.BUDGET, "VIEW"));

  if (ctx.method !== "GET" && process.env.MOCK_SAVE_ERROR) {
    return reportFailure(500, "Kesalahan server.");
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (id === "belum-lapor") return compliance(ctx.url, scope);
    if (id === "prefill") return prefill(ctx.url, scope);

    if (!id) {
      if (process.env.MOCK_500) {
        return reportFailure(500, "Internal Server Error");
      }

      return list(listRows(ctx.url, scope), ctx.url, NAME, NAME);
    }

    // Kwitansi LPJ adalah berkas paling sensitif di grup ini; di luar lingkup
    // komisi dijawab 404, sama dengan tidak ada.
    const row = visibleRow(id, scope);

    return row
      ? json({
          status: 200,
          message: `Berhasil Mendapatkan ${NAME}`,
          data: detailView(row),
        })
      : reportFailure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !segment) {
    if (id) return null;
    if (!can("CREATE")) return denied();

    return onCreate(ctx.request, scope);
  }

  if (!id) return null;

  const row = visibleRow(id, scope);

  if (segment === "pengajuan") {
    if (ctx.method !== "POST") return null;
    if (!can("UPDATE")) return denied();

    return row ? onSubmit(row) : reportFailure(404, NOT_FOUND);
  }

  if (segment === "tarik") {
    if (ctx.method !== "PUT") return null;
    if (!can("UPDATE")) return denied();

    return row ? onWithdraw(row) : reportFailure(404, NOT_FOUND);
  }

  if (ctx.method === "PUT") {
    if (!can("UPDATE")) return denied();

    return row
      ? onUpdate(ctx.request, row, scope)
      : reportFailure(404, NOT_FOUND);
  }

  if (ctx.method === "DELETE") {
    if (!can("DELETE")) return denied();

    return row ? onDelete(row) : reportFailure(404, NOT_FOUND);
  }

  return null;
};

function visibleRow(publicId: string, scope: KomisiScope) {
  return BUDGET_USAGE_REPORT.find(
    (row) =>
      isLive(row) &&
      row.publicId === publicId &&
      isVisibleBapel(scope, row.bapelId),
  );
}

// ---------------------------------------------------------------------------
// Seed. Bulannya diturunkan dari TODAY, bukan dituliskan tetap: laporan
// bersumbu bulan KALENDER, dan seed bertanggal tetap akan jatuh di luar bulan
// laporannya sendiri begitu `MOCK_TODAY` bergeser.

type SeedMonth = { year: number; month: number; first: string };

const monthAt = (offset: number): SeedMonth => {
  const first = addMonths(startOfMonth(TODAY), offset);

  return {
    year: Number(first.slice(0, 4)),
    month: Number(first.slice(5, 7)),
    first,
  };
};

const M0 = monthAt(0);

const M1 = monthAt(-1);

const M2 = monthAt(-2);

// Hari ke-n bulan itu, dihitung dari tanggal 1 — tidak ada 28, 29, 30, atau 31
// yang dituliskan di mana pun, jadi Februari kabisat ikut benar.
const dayIn = (month: SeedMonth, day: number) => addDays(month.first, day - 1);

const stamp = (date: string) => `${date}T02:00:00.000Z`;

let receiptId = 0;

const receipt = (name: string, kind: "image" | "pdf" = "image") => {
  receiptId += 1;
  const isPdf = kind === "pdf";
  const publicId = `lpbr-${String(receiptId).padStart(4, "0")}`;
  const path = `budget-usage-report/seed-${receiptId}.${isPdf ? "pdf" : "jpeg"}`;

  const size = isPdf
    ? seedPdf(path)
    : seedImage(path, name, 18 + receiptId * 37);

  return {
    publicId,
    path,
    size,
    name,
    mimeType: isPdf ? "application/pdf" : "image/jpeg",
  };
};

const step = (
  order: number,
  status: ProgramApprovalRow["steps"][number]["status"],
  extra: Partial<Omit<ProgramApprovalRow["steps"][number], "publicId">> = {},
) => approvalStep(order, APPROVAL_STEPS[order - 1] ?? "", status, extra);

const approval = (
  suffix: string,
  status: ProgramApprovalRow["status"],
  currentOrder: number,
  steps: ProgramApprovalRow["steps"],
  submittedById = SESSION_USER_ID,
): ProgramApprovalRow => ({
  publicId: `apr-lpb-${suffix}`,
  code: codeOf("APR", { yearly: true }),
  status,
  currentOrder,
  submittedById,
  steps,
});

// Hanya id user yang punya nama di store; tanpa itu panel akan menampilkan
// tahap yang sudah ditandatangani sebagai masih menunggu.
const SIGNER_IDS = [13, 12, 11];

const signedSteps = (date: string) =>
  APPROVAL_STEPS.map((_, index) =>
    step(index + 1, "APPROVED", {
      actedAt: stamp(addDays(date, index)),
      actedById: SIGNER_IDS[index] ?? 13,
    }),
  );

const seed = (
  id: number,
  bapelId: number,
  month: SeedMonth,
  lines: ReportLineRow[],
  extra: Partial<BudgetReportRow> = {},
): BudgetReportRow => ({
  id,
  publicId: `lpb-${String(id).padStart(4, "0")}`,
  code: codeOf("LPB", { yearly: true }),
  bapelId,
  year: month.year,
  month: month.month,
  status: "DRAFT",
  note: null,
  approvedById: null,
  approvedAt: null,
  deletedAt: null,
  lines,
  receipts: [],
  approvals: [],
  ...extra,
});

const twelveLines = (month: SeedMonth) => [
  reportLine(23, dayIn(month, 2), "Fotokopi materi katekisasi", "180000"),
  reportLine(23, dayIn(month, 3), "Konsumsi rapat pengurus", "350000"),
  reportLine(22, dayIn(month, 5), "Token listrik ruang latihan", "200000"),
  reportLine(23, dayIn(month, 7), "Bensin kunjungan diakonia", "275000"),
  reportLine(23, dayIn(month, 9), "Snack ibadah pemuda", "420000"),
  reportLine(23, dayIn(month, 11), "Cetak banner kegiatan", "650000"),
  reportLine(23, dayIn(month, 13), "Sewa kursi tambahan", "500000"),
  reportLine(23, dayIn(month, 15), "Honor pemusik tamu", "750000"),
  reportLine(8, dayIn(month, 17), "Standing mic", "1250000"),
  reportLine(23, dayIn(month, 19), "Alat tulis sekretariat komisi", "165000"),
  reportLine(23, dayIn(month, 21), "Paket data rapat daring", "100000"),
  reportLine(23, dayIn(month, 23), "Transport pembicara", "300000"),
];

const REJECT_NOTE =
  "Nominal konsumsi di baris ketiga tidak ada kwitansinya, dan dua baris bertanggal di luar bulan laporan. Mohon lampirkan kwitansinya, pindahkan baris yang bukan bulan ini ke laporan bulan yang benar, lalu ajukan lagi.";

const WAIVER_REASON =
  "Pengurus komisi berganti serentak akhir bulan lalu dan belum ada pemegang jabatan penanda tangan, jadi laporannya tidak bisa diselesaikan. Dibebaskan satu bulan ini supaya pencairan tidak membeku, dan laporannya tetap ditagih begitu pengurus baru dilantik.";

// Laporan unggulan: komisi dengan pencairan bulan lalu, baris yang sebagian
// menyebut program dan sebagian TIDAK — tanpa yang kedua, baris "Tanpa
// program" selalu nol dan aturan sisa tak-bertanda tidak pernah teruji.
const SHOWCASE_LINES = () => [
  reportLine(23, dayIn(M1, 8), "Sewa tempat retret", "3500000", 1, 11),
  reportLine(23, dayIn(M1, 8), "Konsumsi retret", "1750000", 1, 11),
  reportLine(23, dayIn(M1, 12), "Konsumsi rapat pengurus komisi", "4850000"),
  reportLine(22, dayIn(M1, 15), "Token listrik ruang latihan", "650000"),
];

const showcase = seed(1, 2, M1, SHOWCASE_LINES(), {
  note: "Pemakaian bulan lalu, termasuk panjar yang dibelanjakan pengurus dan diganti tunai.",
  receipts: [
    receipt("Kwitansi sewa vila"),
    receipt("Nota konsumsi"),
    receipt("Rekap panjar pengurus", "pdf"),
  ],
  ...(process.env.MOCK_REPORT_PENDING
    ? {
        approvals: [
          approval("01-lpb-0001", "PENDING", 2, [
            step(1, "APPROVED", {
              actedAt: stamp(dayIn(M0, 2)),
              actedById: 13,
            }),
            step(2, "PENDING"),
            step(3, "PENDING"),
          ]),
        ],
      }
    : {
        status: "APPROVED" as const,
        approvedById: 11,
        approvedAt: stamp(dayIn(M0, 4)),
        approvals: [
          approval("01-lpb-0001", "APPROVED", 3, signedSteps(dayIn(M0, 2))),
        ],
      }),
});

BUDGET_USAGE_REPORT.push(
  showcase,
  seed(2, 4, M2, [
    reportLine(23, dayIn(M2, 6), "Alat peraga sekolah minggu", "920000"),
  ]),
  seed(
    3,
    3,
    M2,
    [
      reportLine(23, dayIn(M2, 4), "Konsumsi persekutuan wanita", "1250000"),
      reportLine(23, dayIn(M2, 9), "Bunga altar", "600000"),
    ],
    {
      receipts: [receipt("Nota florist")],
      approvals: [
        approval("02-lpb-0003", "REJECTED", 1, [
          step(1, "REJECTED", {
            note: REJECT_NOTE,
            actedAt: stamp(dayIn(M1, 3)),
            actedById: 13,
          }),
          step(2, "PENDING"),
          step(3, "PENDING"),
        ]),
      ],
    },
  ),
  seed(
    4,
    5,
    M1,
    [reportLine(23, dayIn(M1, 10), "Honor pengajar vokal", "1500000")],
    {
      approvals: [
        approval("03-lpb-0004", "PENDING", 1, [
          step(1, "PENDING"),
          step(2, "PENDING"),
          step(3, "PENDING"),
        ]),
      ],
    },
  ),
  seed(
    5,
    1,
    M2,
    [reportLine(22, dayIn(M2, 5), "Servis pendingin ruang ibadah", "3600000")],
    {
      status: "APPROVED",
      approvedById: 11,
      approvedAt: stamp(dayIn(M1, 2)),
      receipts: [receipt("Invoice servis AC", "pdf")],
      approvals: [
        approval("04-lpb-0005", "APPROVED", 3, signedSteps(dayIn(M1, 1))),
      ],
    },
  ),
  seed(6, 6, M2, twelveLines(M2), {
    note: "Pemakaian rutin komisi, dua belas baris.",
    status: "APPROVED",
    approvedById: 11,
    approvedAt: stamp(dayIn(M1, 6)),
    approvals: [
      approval("05-lpb-0006", "APPROVED", 3, signedSteps(dayIn(M1, 4))),
    ],
  }),
  seed(
    7,
    2,
    M2,
    [reportLine(23, dayIn(M2, 14), "Perlengkapan ibadah pemuda", "2400000", 4)],
    {
      note: "Dua puluh kwitansi, untuk menguji tata letaknya.",
      receipts: Array.from({ length: 20 }, (_, index) =>
        receipt(`Kwitansi belanja ${index + 1}`),
      ),
    },
  ),
  seed(
    8,
    4,
    M1,
    [reportLine(23, dayIn(M1, 19), "Perlengkapan Sekolah Minggu", "920000")],
    { deletedAt: stamp(dayIn(M0, 1)) },
  ),
);

// Laporan bulan Januari: `previousMonth` melewati batas tahun di situ, dan
// bugnya hanya terlihat bila ada barisnya. Dilewati bila bulan itu sudah
// terpakai komisi yang sama — seed tidak boleh menabrak keunikan komisi-bulan.
const JANUARY: SeedMonth = {
  year: Number(TODAY.slice(0, 4)),
  month: 1,
  first: `${TODAY.slice(0, 4)}-01-01`,
};

if (JANUARY.first <= TODAY && !reportOf(3, JANUARY.year, 1)) {
  BUDGET_USAGE_REPORT.push(
    seed(
      9,
      3,
      JANUARY,
      [
        reportLine(
          23,
          dayIn(JANUARY, 12),
          "Konsumsi ibadah awal tahun",
          "780000",
        ),
      ],
      {
        status: "APPROVED",
        approvedById: 11,
        approvedAt: stamp(dayIn(JANUARY, 20)),
        approvals: [
          approval(
            "06-lpb-0009",
            "APPROVED",
            3,
            signedSteps(dayIn(JANUARY, 18)),
          ),
        ],
      },
    ),
  );
}

// Pagu terpakai penuh: pembilang batangnya adalah total LPJ yang DISETUJUI,
// jadi ia hanya bisa dibuat nyata dari larik ini.
if (process.env.MOCK_CEILING_FULL && !reportOf(2, M0.year, M0.month)) {
  BUDGET_USAGE_REPORT.push(
    seed(
      10,
      2,
      M0,
      [
        reportLine(
          23,
          dayIn(M0, 2),
          "Belanja program komisi bulan ini",
          "45000000",
          1,
        ),
      ],
      {
        status: "APPROVED",
        approvedById: 11,
        approvedAt: stamp(dayIn(M0, 3)),
        approvals: [
          approval("07-lpb-0010", "APPROVED", 3, signedSteps(dayIn(M0, 2))),
        ],
      },
    ),
  );
}

// Pembebasan gerbang milik layar Kas Keluar; di sini ia hanya di-seed supaya
// keadaan "Dibebaskan" dan alasannya yang tampil penuh bisa dibuktikan.
if (process.env.MOCK_WAIVED) {
  GATE_WAIVER.push({
    id: GATE_WAIVER.length + 1,
    bapelId: 4,
    year: M1.year,
    month: M1.month,
    reason: WAIVER_REASON,
    createdById: 12,
    createdAt: stamp(dayIn(M0, 2)),
    deletedAt: null,
  });
}
