/**
 * Tiruan `/api/v1/program` (kontrak Anggaran §4). Larik `PROGRAM` milik
 * handler ini.
 *
 *   MOCK_EMPTY=1          → daftar kosong (404)
 *   MOCK_500=1            → daftar menjawab 500
 *   MOCK_SAVE_ERROR=1     → POST/PUT/DELETE menjawab 500
 *   MOCK_NO_CEILING=1     → ajukan ditolak: tahun itu tanpa pagu
 *   MOCK_CEILING_FULL=1   → ajukan ditolak: melebihi sisa pagu
 *   MOCK_NO_WORKFLOW=1    → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_NO_PENGURUS=1    → ajukan ditolak: komisi tanpa pemegang jabatan
 */
import { MENU } from "../../../src/config/menu";
import { addDays, monthLabel } from "../../../src/lib/date";
import { sumAmounts } from "../../../src/lib/number";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  BUDGET_USAGE_REPORT,
  PROGRAM,
  TODAY,
  budgetYearRange,
  codeOf,
  currentBudgetYear,
  heldBy,
  isLive,
  isVisibleBapel,
  isWithinCeiling,
  komisiScopeOf,
  nextId,
  programItem,
  programOpenApproval,
  programView,
  remainingFor,
  type KomisiScope,
  type ProgramApprovalRow,
  type ProgramItemRow,
  type ProgramRow,
} from "../anggaran-store";
import { accountOf } from "../keuangan-store";
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

const NOT_FOUND = "Program Tidak Ditemukan";

const MONEY_MAX = 9_999_999_999_999;

const APPROVAL_STEPS = [
  "Ketua Majelis Jemaat",
  "Sekretaris Majelis Jemaat",
  "Bendahara Majelis Jemaat",
];

export const programFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string; remaining?: string | null } = {},
) => json({ status, error, ...extra }, status);

const invalid = (issues: Issue[], status = 400) =>
  programFailure(status, issues[0]?.message ?? "Data tidak valid", { issues });

/**
 * Penolakan pengajuan, atau null bila lolos. Urutannya sama dengan be-sada:
 * pagu lebih dulu, lalu alur, lalu pemegang jabatan — dan layar mencabangkan
 * pada `code`, bukan pada kalimatnya.
 */
export const submitFailureOf = (row: {
  id: number;
  bapelId: number;
  year: number;
  items: { quantity: string; unitPrice: string }[];
}) => {
  const proposed = heldBy(row as Parameters<typeof heldBy>[0]);

  if (process.env.MOCK_NO_CEILING) {
    return {
      status: 400,
      code: "CEILING_MISSING" as const,
      error: `Majelis Jemaat Belum Menetapkan Pagu Anggaran Komisi Ini Untuk Tahun ${row.year}`,
    };
  }

  if (
    process.env.MOCK_CEILING_FULL ||
    !isWithinCeiling(row.bapelId, row.year, proposed, row.id)
  ) {
    const remaining = remainingFor(row.bapelId, row.year, row.id);

    return remaining === null
      ? {
          status: 400,
          code: "CEILING_MISSING" as const,
          error: `Majelis Jemaat Belum Menetapkan Pagu Anggaran Komisi Ini Untuk Tahun ${row.year}`,
        }
      : {
          status: 400,
          code: "CEILING_EXCEEDED" as const,
          error: `Pengajuan Ini Melebihi Pagu Anggaran Komisi Untuk Tahun ${row.year}. Sisa Pagu: ${remaining}`,
          remaining,
        };
  }

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
      error: "Komisi Ini Belum Punya Pengurus Berjabatan Ketua",
    };
  }

  return null;
};

/**
 * Dua angka belanja, dua sumber, dan sisa tak-bertandanya di sebelahnya.
 *
 * Atribusi program hanya ada di baris LPJ yang sudah disetujui: Program tidak
 * ada di Kas Keluar, jadi tidak ada jalur yang tahu berapa yang dicairkan untuk
 * satu program. Baris LPJ komisi ini yang TIDAK menyebut program adalah sisa
 * tak-bertandanya, dan ia dikembalikan walaupun nol.
 */
const reportedUsageOf = (row: ProgramRow) => {
  const { from, to } = budgetYearRange(row.year);
  const reports = BUDGET_USAGE_REPORT.filter(
    (report) =>
      isLive(report) &&
      report.bapelId === row.bapelId &&
      report.status === "APPROVED" &&
      report.lines.some(
        (line) => line.spentDate >= from && line.spentDate <= to,
      ),
  );

  const parts = reports.flatMap((report) => {
    const amount = sumAmounts(
      report.lines
        .filter((line) => line.programId === row.id)
        .map((line) => line.amount),
    );

    return Number(amount) === 0
      ? []
      : [
          {
            publicId: report.publicId,
            code: report.code,
            label: monthLabel(
              `${report.year}-${String(report.month).padStart(2, "0")}`,
            ),
            amount,
          },
        ];
  });

  const untagged = sumAmounts(
    reports.flatMap((report) =>
      report.lines
        .filter((line) => line.programId === null)
        .map((line) => line.amount),
    ),
  );

  return { parts, untagged };
};

const detailView = (row: ProgramRow) => ({
  ...programView(row, true),
  reportedUsage: reportedUsageOf(row),
});

const textIssue = (
  value: unknown,
  path: string,
  noun: string,
  max: number,
): Issue | null => {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return { path, message: `Mohon Lengkapi ${noun}` };
  if (text.length > max) {
    return { path, message: `${noun} maksimal ${max} karakter` };
  }

  return null;
};

const amountIssue = (
  value: unknown,
  path: string,
  noun: string,
): Issue | null => {
  const text = typeof value === "number" ? String(value) : String(value ?? "");
  const amount = Number(text);

  if (!text) return { path, message: `Mohon Lengkapi ${noun}` };
  if (Number.isNaN(amount) || amount <= 0) {
    return { path, message: `${noun} harus lebih dari 0` };
  }
  if (amount > MONEY_MAX) {
    return {
      path,
      message: `${noun} tidak boleh lebih dari 9.999.999.999.999`,
    };
  }
  if ((text.split(".")[1] ?? "").length > 2) {
    return { path, message: `${noun} maksimal 2 angka di belakang koma` };
  }

  return null;
};

const dateText = (value: unknown) =>
  typeof value === "string" && value ? value : null;

type Parsed = {
  name: string;
  year: number;
  bapelId: number;
  startDate: string | null;
  endDate: string | null;
  isUnplanned: boolean;
  description: string | null;
  items: Body[];
};

const parseProgram = (body: Body): { issues: Issue[] } | Parsed => {
  const issues: Issue[] = [];
  const name = textIssue(body.name, "name", "Nama Program", 150);
  const year = Number(body.year);
  const bapelId = Number(body.bapelId);
  const startDate = dateText(body.startDate);
  const endDate = dateText(body.endDate);
  const items = Array.isArray(body.items) ? (body.items as Body[]) : [];

  if (name) issues.push(name);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    issues.push({ path: "year", message: "Tahun tidak valid" });
  }
  if (!Number.isInteger(bapelId) || bapelId <= 0) {
    issues.push({ path: "bapelId", message: "Mohon Lengkapi Komisi" });
  }
  if (startDate && endDate && endDate < startDate) {
    issues.push({
      path: "endDate",
      message: "Tanggal Selesai Tidak Boleh Sebelum Tanggal Mulai",
    });
  }
  if (items.length === 0) {
    issues.push({
      path: "items",
      message: "Program harus memiliki minimal 1 rincian anggaran",
    });
  }

  items.forEach((item, index) => {
    const description = textIssue(
      item.description,
      `items.${index}.description`,
      "Uraian",
      250,
    );
    const quantity = amountIssue(
      item.quantity,
      `items.${index}.quantity`,
      "Jumlah",
    );
    const unitPrice = amountIssue(
      item.unitPrice,
      `items.${index}.unitPrice`,
      "Harga Satuan",
    );

    if (description) issues.push(description);
    if (quantity) issues.push(quantity);
    if (unitPrice) issues.push(unitPrice);
  });

  return issues.length > 0
    ? { issues }
    : {
        name: String(body.name).trim(),
        year,
        bapelId,
        startDate,
        endDate,
        isUnplanned: body.isUnplanned === true,
        description:
          typeof body.description === "string" && body.description.trim()
            ? body.description.trim()
            : null,
        items,
      };
};

/**
 * Akun RAB wajib hidup, aktif, dan bertipe Beban atau Aset: belanja inventaris
 * komisi dibukukan ke Aset Tetap, dan sebuah RAB tidak boleh menunjuk pos
 * Pendapatan. Soft delete dijawab 404, sama dengan tidak ada.
 */
const accountFailure = (items: Body[]) => {
  for (const [index, item] of items.entries()) {
    const path = `items.${index}.accountId`;
    const account = accountOf(Number(item.accountId) || null);

    if (!account || !isLive(account)) {
      return programFailure(404, "Akun Tidak Ditemukan");
    }
    if (!account.isActive) {
      return programFailure(
        400,
        `Akun ${account.code} ${account.name} Sudah Nonaktif`,
        { code: "ACCOUNT_INACTIVE" },
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

const toItemRows = (items: Body[]): ProgramItemRow[] =>
  items.map((item) =>
    programItem(
      Number(item.accountId),
      String(item.description).trim(),
      String(item.quantity),
      String(item.unitPrice),
      typeof item.note === "string" && item.note.trim()
        ? item.note.trim()
        : null,
    ),
  );

const lockFailure = (row: ProgramRow) => {
  if (row.status === "APPROVED") {
    return programFailure(400, "Program Ini Sudah Disetujui", {
      code: "ALREADY_APPROVED",
    });
  }
  if (row.status === "CANCELLED") {
    return programFailure(400, "Program Ini Sudah Dibatalkan", {
      code: "ALREADY_APPROVED",
    });
  }
  if (programOpenApproval(row)) {
    return programFailure(
      400,
      "Program Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Lebih Dulu",
      { code: "UNDER_APPROVAL" },
    );
  }

  return null;
};

const onCreate = async (request: Request) => {
  const parsed = parseProgram(await readBody<Body>(request));
  if ("issues" in parsed) return invalid(parsed.issues);

  if (!bapelOf(parsed.bapelId)) {
    return programFailure(404, "Komisi Tidak Ditemukan");
  }

  const accountFail = accountFailure(parsed.items);
  if (accountFail) return accountFail;

  const id = nextId(PROGRAM);
  const row: ProgramRow = {
    id,
    publicId: `prg-${String(id).padStart(4, "0")}`,
    code: codeOf("PRG", { yearly: true }),
    name: parsed.name,
    year: parsed.year,
    bapelId: parsed.bapelId,
    status: "DRAFT",
    isUnplanned: parsed.isUnplanned,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    description: parsed.description,
    cancelReason: null,
    cancelledById: null,
    cancelledAt: null,
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    items: toItemRows(parsed.items),
    approvals: [],
  };

  PROGRAM.push(row);

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Program",
      data: detailView(row),
    },
    201,
  );
};

const onUpdate = async (request: Request, row: ProgramRow) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  const parsed = parseProgram(await readBody<Body>(request));
  if ("issues" in parsed) return invalid(parsed.issues);

  if (!bapelOf(parsed.bapelId)) {
    return programFailure(404, "Komisi Tidak Ditemukan");
  }

  const accountFail = accountFailure(parsed.items);
  if (accountFail) return accountFail;

  row.name = parsed.name;
  row.year = parsed.year;
  row.bapelId = parsed.bapelId;
  row.startDate = parsed.startDate;
  row.endDate = parsed.endDate;
  row.isUnplanned = parsed.isUnplanned;
  row.description = parsed.description;
  // Rincian selalu diganti utuh; itu yang menjaga nominal usulan sejalan
  // dengan barisnya, dan be-sada tidak punya endpoint per baris.
  row.items = toItemRows(parsed.items);

  return json({
    status: 200,
    message: "Berhasil Mengubah Program",
    data: detailView(row),
  });
};

const onDelete = (row: ProgramRow) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  row.deletedAt = `${TODAY}T02:00:00.000Z`;

  return json({ status: 200, message: "Berhasil Menghapus Program" });
};

const onSubmit = (row: ProgramRow) => {
  const locked = lockFailure(row);
  if (locked) return locked;

  const failure = submitFailureOf(row);
  if (failure) {
    const { status, error, ...extra } = failure;

    return programFailure(status, error, extra);
  }

  row.approvals.push({
    publicId: `apr-prg-${String(row.approvals.length + 1).padStart(2, "0")}-${row.publicId}`,
    code: codeOf("APR", { yearly: true }),
    status: "PENDING",
    currentOrder: 1,
    submittedById: SESSION_USER_ID,
    steps: APPROVAL_STEPS.map((roleName, index) => ({
      order: index + 1,
      roleName,
      status: "PENDING",
      note: null,
      actedAt: null,
      actedById: null,
    })),
  });

  return json({
    status: 200,
    message: "Berhasil Mengajukan Program",
    data: detailView(row),
  });
};

const onWithdraw = (row: ProgramRow) => {
  const approval = programOpenApproval(row);

  if (!approval) {
    return programFailure(400, "Program Ini Tidak Sedang Menunggu Persetujuan");
  }
  if (approval.submittedById !== SESSION_USER_ID) {
    return programFailure(
      403,
      "Hanya Pengaju Yang Dapat Menarik Pengajuan Ini",
    );
  }

  approval.status = "CANCELLED";
  approval.steps.forEach((step) => {
    if (step.status === "PENDING") step.status = "CANCELLED";
  });

  return json({
    status: 200,
    message: "Berhasil Menarik Pengajuan Program",
    data: detailView(row),
  });
};

const onCancel = async (request: Request, row: ProgramRow) => {
  if (row.status === "CANCELLED") {
    return programFailure(400, "Program Ini Sudah Dibatalkan", {
      code: "ALREADY_APPROVED",
    });
  }
  if (programOpenApproval(row)) {
    return programFailure(
      400,
      "Program Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Lebih Dulu",
      { code: "UNDER_APPROVAL" },
    );
  }

  const body = await readBody<Body>(request);
  const reason = textIssue(body.cancelReason, "cancelReason", "Alasan", 250);

  if (reason) return invalid([reason]);

  row.status = "CANCELLED";
  row.cancelReason = String(body.cancelReason).trim();
  row.cancelledById = SESSION_USER_ID;
  row.cancelledAt = `${TODAY}T02:00:00.000Z`;

  return json({
    status: 200,
    message: "Berhasil Membatalkan Program",
    data: detailView(row),
  });
};

const listRows = (url: URL, scope: KomisiScope) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const status = url.searchParams.get("status") ?? "";
  const pending = url.searchParams.get("isPendingApproval") ?? "";
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return PROGRAM.filter((row) => {
    if (!isLive(row)) return false;
    if (!isVisibleBapel(scope, row.bapelId)) return false;
    if (year && row.year !== year) return false;
    if (bapelId && row.bapelId !== bapelId) return false;
    if (status && row.status !== status) return false;

    const isPending = programOpenApproval(row) !== null;
    if (pending === "1" && !isPending) return false;
    if (pending === "0" && isPending) return false;

    return (
      !filter ||
      row.name.toLowerCase().includes(filter) ||
      row.code.toLowerCase().includes(filter)
    );
  })
    .map((row) => programView(row))
    .sort(
      (left, right) =>
        right.year - left.year || right.code.localeCompare(left.code),
    );
};

export const programMock: MockHandler = (ctx) => {
  const match = ctx.path.match(
    /^\/program(?:\/([^/]+))?(?:\/(pengajuan|tarik|batal))?$/,
  );
  if (!match) return null;

  const [, id, segment] = match;
  const can = (action: MockAction) => ctx.can(MENU.PROGRAM, action);
  const scope = komisiScopeOf(ctx.isAdmin, ctx.can(MENU.PAGU_ANGGARAN, "VIEW"));
  const isWrite = ctx.method !== "GET";

  if (isWrite && process.env.MOCK_SAVE_ERROR) {
    return programFailure(500, "Kesalahan server.");
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (!id) {
      if (process.env.MOCK_500) {
        return programFailure(500, "Internal Server Error");
      }

      return list(listRows(ctx.url, scope), ctx.url, "Program", "Program");
    }

    // Di luar lingkup komisi dijawab 404, sama dengan tidak ada — bentuk yang
    // sama dengan Permintaan Persetujuan, dan sengaja tidak dibedakan.
    const row = PROGRAM.find(
      (item) =>
        isLive(item) &&
        item.publicId === id &&
        isVisibleBapel(scope, item.bapelId),
    );

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Program",
          data: detailView(row),
        })
      : programFailure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !segment) {
    if (id) return null;
    if (!can("CREATE")) return denied();

    // Membuat usulan sengaja TIDAK di-scope: siapa pun dengan CREATE boleh
    // mengusulkan untuk komisi mana pun, dan gema tulisannya kembali padanya.
    return onCreate(ctx.request);
  }

  if (!id) return null;

  // Jalur tulis ikut di-scope: tanpa itu mengetahui sebuah publicId cukup
  // untuk membatalkan usulan komisi lain, dan pembatalan membebaskan pagunya.
  const row = PROGRAM.find(
    (item) =>
      isLive(item) &&
      item.publicId === id &&
      isVisibleBapel(scope, item.bapelId),
  );

  if (segment === "pengajuan") {
    if (ctx.method !== "POST") return null;
    if (!can("UPDATE")) return denied();

    return row ? onSubmit(row) : programFailure(404, NOT_FOUND);
  }

  if (segment === "tarik") {
    if (ctx.method !== "PUT") return null;
    if (!can("UPDATE")) return denied();

    return row ? onWithdraw(row) : programFailure(404, NOT_FOUND);
  }

  if (segment === "batal") {
    if (ctx.method !== "PUT") return null;
    if (!can("DELETE")) return denied();

    return row ? onCancel(ctx.request, row) : programFailure(404, NOT_FOUND);
  }

  if (ctx.method === "PUT") {
    if (!can("UPDATE")) return denied();

    return row ? onUpdate(ctx.request, row) : programFailure(404, NOT_FOUND);
  }

  if (ctx.method === "DELETE") {
    if (!can("DELETE")) return denied();

    return row ? onDelete(row) : programFailure(404, NOT_FOUND);
  }

  return null;
};

// ---------------------------------------------------------------------------
// Seed. Tanggalnya diturunkan dari rentang tahun pelayanan, bukan dituliskan
// tetap: dengan bulan mulai Juli, Juni 2027 adalah tahun pelayanan 2026, dan
// seed bertanggal tetap akan jatuh di luar tahunnya sendiri.

const YEAR = currentBudgetYear();

const RANGE = budgetYearRange(YEAR);

const PREVIOUS = budgetYearRange(YEAR - 1);

const stamp = (date: string) => `${date}T02:00:00.000Z`;

const step = (
  order: number,
  roleName: string,
  status: ProgramApprovalRow["steps"][number]["status"],
  extra: Partial<ProgramApprovalRow["steps"][number]> = {},
) => ({
  order,
  roleName,
  status,
  note: null,
  actedAt: null,
  actedById: null,
  ...extra,
});

const approval = (
  publicId: string,
  status: ProgramApprovalRow["status"],
  currentOrder: number,
  steps: ProgramApprovalRow["steps"],
  submittedById = SESSION_USER_ID,
): ProgramApprovalRow => ({
  publicId,
  code: codeOf("APR", { yearly: true }),
  status,
  currentOrder,
  submittedById,
  steps,
});

const pendingSteps = () =>
  APPROVAL_STEPS.map((roleName, index) => step(index + 1, roleName, "PENDING"));

const seed = (
  id: number,
  name: string,
  bapelId: number,
  year: number,
  items: ProgramItemRow[],
  extra: Partial<ProgramRow> = {},
): ProgramRow => {
  const range = year === YEAR ? RANGE : PREVIOUS;

  return {
    id,
    publicId: `prg-${String(id).padStart(4, "0")}`,
    code: codeOf("PRG", { yearly: true }),
    name,
    year,
    bapelId,
    status: "DRAFT",
    isUnplanned: false,
    startDate: addDays(range.from, 60),
    endDate: addDays(range.from, 70),
    description: null,
    cancelReason: null,
    cancelledById: null,
    cancelledAt: null,
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    items,
    approvals: [],
    ...extra,
  };
};

const eightLines = () => [
  programItem(23, "Sewa aula sekolah minggu", "1", "4000000"),
  programItem(23, "Konsumsi peserta", "120", "25000"),
  programItem(23, "Alat tulis dan prakarya", "1", "2500000"),
  programItem(23, "Cetak buku panduan", "150", "12000"),
  programItem(22, "Listrik tambahan selama acara", "1", "750000"),
  programItem(23, "Transportasi pengajar", "6", "150000"),
  programItem(23, "Hadiah lomba", "1", "1800000"),
  programItem(8, "Papan tulis putih", "2", "875000"),
];

PROGRAM.push(
  seed(1, "Retret Pemuda Regional", 2, YEAR, [
    programItem(23, "Sewa vila dan aula", "1", "4000000"),
    programItem(
      23,
      "Konsumsi dua hari",
      "2",
      "1000000",
      "Sarapan sampai makan malam",
    ),
  ]),
  seed(
    2,
    "Pelatihan Pemusik Muda",
    2,
    YEAR,
    [programItem(23, "Honor pelatih enam sesi", "1", "9000000")],
    { approvals: [approval("apr-prg-01", "PENDING", 1, pendingSteps())] },
  ),
  seed(
    3,
    "Kemah Paskah Pemuda",
    2,
    YEAR,
    [programItem(23, "Sewa bumi perkemahan dan logistik", "1", "12000000")],
    {
      approvals: [
        approval("apr-prg-02", "REJECTED", 1, [
          step(1, APPROVAL_STEPS[0]!, "REJECTED", {
            note: "Nominal konsumsi jauh di atas kegiatan sejenis tahun lalu. Mohon pecah per pos dan sesuaikan dengan sisa pagu komisi, lalu ajukan lagi.",
            actedAt: stamp(addDays(TODAY, -6)),
            actedById: 13,
          }),
          step(2, APPROVAL_STEPS[1]!, "PENDING"),
          step(3, APPROVAL_STEPS[2]!, "PENDING"),
        ]),
      ],
    },
  ),
  seed(
    4,
    "Perlengkapan Ibadah Pemuda",
    2,
    YEAR,
    [programItem(8, "Sound system portabel", "1", "15000000")],
    {
      status: "APPROVED",
      isUnplanned: true,
      approvedById: 13,
      approvedAt: stamp(addDays(TODAY, -20)),
      approvals: [
        approval(
          "apr-prg-03",
          "APPROVED",
          3,
          APPROVAL_STEPS.map((roleName, index) =>
            step(index + 1, roleName, "APPROVED", {
              actedAt: stamp(addDays(TODAY, -22 + index)),
              actedById: 13,
            }),
          ),
        ),
      ],
    },
  ),
  seed(5, "Bakti Sosial Pemuda", 2, YEAR, [
    programItem(23, "Paket sembako dan transportasi", "1", "3000000"),
  ]),
  seed(6, "Seminar Keluarga Muda", 3, YEAR, [
    programItem(23, "Honor pembicara dan sewa ruang", "1", "30000001"),
  ]),
  seed(7, "Sekolah Minggu Ceria", 4, YEAR, eightLines()),
  seed(
    8,
    "Lomba Anak Natal",
    4,
    YEAR,
    [programItem(23, "Hadiah, dekorasi, dan konsumsi", "1", "10000000")],
    {
      status: "CANCELLED",
      cancelReason:
        "Jadwal berbenturan dengan perayaan Natal gabungan jemaat, dan panitia sepakat kegiatan ini dilebur ke acara gabungan. Pagunya dikembalikan supaya bisa dipakai usulan lain tahun ini.",
      cancelledById: 12,
      cancelledAt: stamp(addDays(TODAY, -9)),
    },
  ),
  seed(
    9,
    "Kursus Vokal Dasar",
    5,
    YEAR,
    [programItem(23, "Honor pengajar dan materi", "1", "5000000")],
    { startDate: null, endDate: null },
  ),
  seed(
    10,
    "Pengadaan Keyboard Pengiring",
    5,
    YEAR,
    [programItem(8, "Keyboard 61 tuts dan stand", "1", "4000000")],
    {
      approvals: [approval("apr-prg-04", "PENDING", 2, pendingSteps(), 12)],
    },
  ),
  seed(11, "Kunjungan Diakonia Lansia", 6, YEAR, [
    programItem(23, "Paket kunjungan dan transportasi", "1", "4000000"),
  ]),
  seed(
    12,
    "Natal Pemuda",
    2,
    YEAR - 1,
    [programItem(23, "Dekorasi, konsumsi, dan kado", "1", "20000000")],
    {
      status: "APPROVED",
      approvedById: 13,
      approvedAt: stamp(addDays(PREVIOUS.from, 90)),
      approvals: [
        approval(
          "apr-prg-05",
          "APPROVED",
          3,
          APPROVAL_STEPS.map((roleName, index) =>
            step(index + 1, roleName, "APPROVED", {
              actedAt: stamp(addDays(PREVIOUS.from, 85 + index)),
              actedById: 13,
            }),
          ),
        ),
      ],
    },
  ),
  seed(
    13,
    "Persiapan Paskah Lintas Tahun",
    2,
    YEAR - 1,
    [programItem(23, "Latihan paduan suara dan properti", "1", "7000000")],
    {
      startDate: addDays(PREVIOUS.to, -10),
      endDate: addDays(PREVIOUS.to, 20),
    },
  ),
  seed(
    14,
    "Perlengkapan Kantor Majelis",
    1,
    YEAR,
    [programItem(8, "Lemari arsip dan meja rapat", "1", "50000000")],
    {
      status: "APPROVED",
      approvedById: 13,
      approvedAt: stamp(addDays(TODAY, -30)),
      approvals: [
        approval(
          "apr-prg-06",
          "APPROVED",
          3,
          APPROVAL_STEPS.map((roleName, index) =>
            step(index + 1, roleName, "APPROVED", {
              actedAt: stamp(addDays(TODAY, -32 + index)),
              actedById: 13,
            }),
          ),
        ),
      ],
    },
  ),
  seed(
    15,
    "Usulan Lama Yang Dihapus",
    2,
    YEAR,
    [programItem(23, "Pos yang sudah tidak dipakai", "1", "1000000")],
    { deletedAt: stamp(addDays(TODAY, -40)) },
  ),
);
