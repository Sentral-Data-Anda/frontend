/**
 * State mock bersama grup Anggaran (docs/design/anggaran/README.md §4a TL-7).
 * Larik diisi agent fitur saat runtime; bentuk tampilan dan aturan milik TL.
 *
 * Dua arti `year` hidup di sini, dan itu disengaja (README §2.3):
 * pagu dan program bersumbu TAHUN PELAYANAN (diturunkan `BUDGET_SETTING`),
 * laporan budget bersumbu BULAN KALENDER — karena gerbang pencairan mencari
 * laporan dengan pasangan kalender, dan menyatukan keduanya akan membuatnya
 * mengambil baris yang salah untuk setiap bulan sebelum bulan mulai.
 */
import {
  addDays,
  addMonths,
  monthLabel,
  startOfMonth,
} from "../../src/lib/date";
import { lineAmount, sumAmounts } from "../../src/lib/number";
import type {
  BapelRef,
  BudgetReportStatus,
  BudgetYear,
  CeilingUsage,
  ComplianceState,
  GateWaiver,
  ProgramStatus,
} from "../../src/types/anggaran";
import type { ApprovalStatus } from "../../src/types/persetujuan";
import {
  PERSONA_KEY,
  PERSONA_POSITIONS,
  SESSION_USER_ID,
} from "../mock-dashboard";

import {
  CASH_EXPENSE,
  TODAY,
  accountRef,
  cashExpenseTotal,
  codeOf,
  isLive,
  nextId,
  userNameOf,
} from "./keuangan-store";
import { bapelOf } from "./pelayanan-store";

export { TODAY, isLive, nextId, userNameOf };

const pad = (value: number, size = 2) => String(value).padStart(size, "0");

/**
 * Komisi dalam bentuk yang dikembalikan be-sada: `publicId`, bukan `id`.
 * `bapelOf` milik store Pelayanan mengembalikan `id` karena ddl memang
 * memakainya sebagai nilai pilihan; bacaan Anggaran tidak. Id numeriknya tetap
 * ada di bacaan detail sebagai `bapelId`, untuk mengisi awal form.
 */
export const bapelRef = (id: number): BapelRef | null => {
  const row = bapelOf(id);

  return row
    ? { publicId: `bpl-${pad(id, 4)}`, code: row.code, name: row.name }
    : null;
};

// ---------------------------------------------------------------------------
// Siapa melihat komisi mana.
//
// Tidak ada persona peran di kode — seed membuat satu role admin, sisanya
// RoleMenuAccess saat runtime — dan `RoleJemaat.name` teks bebas tanpa enum.
// Jadi "majelis dan bendahara melihat semuanya" tidak bisa diuji oleh kode apa
// pun. Yang bisa: sebuah KAPABILITAS yang dibaca dari hibah menu, terlihat di
// editor role. Polanya sama dengan `isTreasury` di handler Pembayaran.
//
// Menyempitkan lewat "punya RoleJemaat ber-bapelId" ditolak: itu akan
// mempersempit setiap Majelis Pendamping ke satu komisi yang ia dampingi —
// kebalikan dari maksud aturannya.

export type KomisiScope =
  { isAll: true } | { isAll: false; bapelIds: number[] };

/** Jabatan hidup yang dipegang persona ini, sebagai id komisi. */
export const myBapelIds = (): number[] => [
  ...new Set((PERSONA_POSITIONS[PERSONA_KEY] ?? []).map((row) => row.bapelId)),
];

/**
 * `isCanViewPagu` = `ctx.can(MENU.PAGU_ANGGARAN, "VIEW")`.
 *
 * Tanpa kapabilitas itu dan tanpa jabatan, hasilnya himpunan kosong — **gagal
 * tertutup**, bukan terbuka.
 */
export const komisiScopeOf = (
  isAdmin: boolean,
  isCanViewPagu: boolean,
): KomisiScope =>
  isAdmin || isCanViewPagu
    ? { isAll: true }
    : { isAll: false, bapelIds: myBapelIds() };

export const isVisibleBapel = (scope: KomisiScope, bapelId: number) =>
  scope.isAll || scope.bapelIds.includes(bapelId);

// ---------------------------------------------------------------------------
// Setelan tahun pelayanan. Satu baris, dan setiap label tahun membacanya.

export type BudgetSettingRow = { startMonth: number };

export const BUDGET_SETTING: BudgetSettingRow = {
  startMonth: process.env.MOCK_BUDGET_START_JULY ? 7 : 1,
};

/**
 * Tahun pelayanan sebuah tanggal. Bulan sebelum bulan mulai masih milik tahun
 * sebelumnya: dengan bulan mulai Juli, Juni 2027 adalah tahun pelayanan 2026.
 *
 * Ditulis sekali di sini dan dipakai setiap pembaca, alasan yang sama dengan
 * `previousMonth` di be-sada: di-inline-kan, ia akan membebaskan satu batas
 * tahun diam-diam dan tidak ada yang akan tahu.
 */
export const budgetYearOf = (date: string): number => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));

  return month >= BUDGET_SETTING.startMonth ? year : year - 1;
};

export const budgetYearRange = (year: number) => {
  const from = `${year}-${pad(BUDGET_SETTING.startMonth)}-01`;

  return { from, to: addDays(addMonths(from, 12), -1) };
};

export const budgetYearView = (year: number): BudgetYear => {
  const { from, to } = budgetYearRange(year);
  const isCalendar = BUDGET_SETTING.startMonth === 1;

  return {
    year,
    startMonth: BUDGET_SETTING.startMonth,
    from,
    to,
    label: isCalendar
      ? String(year)
      : `${year}/${year + 1} (${monthLabel(from.slice(0, 7))} – ${monthLabel(to.slice(0, 7))})`,
  };
};

export const currentBudgetYear = () => budgetYearOf(TODAY);

const isWithinBudgetYear = (date: string, year: number) => {
  const { from, to } = budgetYearRange(year);

  return date >= from && date <= to;
};

// ---------------------------------------------------------------------------
// Pagu Anggaran. Satu angka per komisi per tahun pelayanan, tanpa status,
// tanpa kode, tanpa kolom soft delete — hapusnya keras.

export type BudgetAllocationRow = {
  id: number;
  publicId: string;
  bapelId: number;
  year: number;
  amount: string;
};

export const BUDGET_ALLOCATION: BudgetAllocationRow[] = [];

export const allocationOf = (bapelId: number, year: number) =>
  BUDGET_ALLOCATION.find(
    (row) => row.bapelId === bapelId && row.year === year,
  ) ?? null;

// ---------------------------------------------------------------------------
// Program dan rincian anggarannya (RAB).

export type ProgramItemRow = {
  id: number;
  publicId: string;
  accountId: number;
  description: string;
  quantity: string;
  unitPrice: string;
  note: string | null;
};

export type ProgramApprovalRow = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  currentOrder: number;
  submittedById: number;
  steps: {
    order: number;
    roleName: string;
    status: ApprovalStatus;
    note: string | null;
    actedAt: string | null;
    actedById: number | null;
  }[];
};

export type ProgramRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  year: number;
  bapelId: number;
  status: ProgramStatus;
  isUnplanned: boolean;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  cancelReason: string | null;
  cancelledById: number | null;
  cancelledAt: string | null;
  approvedById: number | null;
  approvedAt: string | null;
  deletedAt: string | null;
  items: ProgramItemRow[];
  approvals: ProgramApprovalRow[];
};

export const PROGRAM: ProgramRow[] = [];

let programItemId = 0;

export const programItem = (
  accountId: number,
  description: string,
  quantity: string,
  unitPrice: string,
  note: string | null = null,
): ProgramItemRow => {
  programItemId += 1;

  return {
    id: programItemId,
    publicId: `pbi-${pad(programItemId, 4)}`,
    accountId,
    description,
    quantity,
    unitPrice,
    note,
  };
};

export const itemAmount = (
  item: Pick<ProgramItemRow, "quantity" | "unitPrice">,
) => String(lineAmount(item.quantity, item.unitPrice) ?? 0);

export const programTotal = (row: Pick<ProgramRow, "items">) =>
  sumAmounts(row.items.map(itemAmount));

/** Yang dipegang program terhadap pagu: yang diberikan, bukan yang diminta. */
export const heldBy = (row: ProgramRow) => programTotal(row);

export const programOpenApproval = (row: ProgramRow) =>
  row.approvals.find((approval) => approval.status === "PENDING") ?? null;

export const liveProgramsOf = (bapelId: number, year: number) =>
  PROGRAM.filter(
    (row) =>
      isLive(row) &&
      row.bapelId === bapelId &&
      row.year === year &&
      row.status !== "CANCELLED",
  );

// ---------------------------------------------------------------------------
// Laporan pemakaian budget (LPJ). Sumbunya BULAN KALENDER.

export type ReportLineRow = {
  id: number;
  publicId: string;
  accountId: number;
  programId: number | null;
  spentDate: string;
  description: string;
  amount: string;
  cashExpenseId: number | null;
};

export type BudgetReportRow = {
  id: number;
  publicId: string;
  code: string;
  bapelId: number;
  year: number;
  month: number;
  status: BudgetReportStatus;
  note: string | null;
  approvedById: number | null;
  approvedAt: string | null;
  deletedAt: string | null;
  lines: ReportLineRow[];
  receipts: {
    publicId: string;
    path: string;
    name: string;
    mimeType: string;
  }[];
  approvals: ProgramApprovalRow[];
};

export const BUDGET_USAGE_REPORT: BudgetReportRow[] = [];

let reportLineId = 0;

export const reportLine = (
  accountId: number,
  spentDate: string,
  description: string,
  amount: string,
  programId: number | null = null,
  cashExpenseId: number | null = null,
): ReportLineRow => {
  reportLineId += 1;

  return {
    id: reportLineId,
    publicId: `lpl-${pad(reportLineId, 4)}`,
    accountId,
    programId,
    spentDate,
    description,
    amount,
    cashExpenseId,
  };
};

export const reportTotal = (row: Pick<BudgetReportRow, "lines">) =>
  sumAmounts(row.lines.map((line) => line.amount));

export const reportOf = (bapelId: number, year: number, month: number) =>
  BUDGET_USAGE_REPORT.find(
    (row) =>
      isLive(row) &&
      row.bapelId === bapelId &&
      row.year === year &&
      row.month === month,
  ) ?? null;

export const reportOpenApproval = (row: BudgetReportRow) =>
  row.approvals.find((approval) => approval.status === "PENDING") ?? null;

// ---------------------------------------------------------------------------
// Pembebasan gerbang. Satu komisi, satu bulan, alasan wajib.

export type GateWaiverRow = {
  id: number;
  bapelId: number;
  year: number;
  month: number;
  reason: string;
  createdById: number;
  createdAt: string;
  deletedAt: string | null;
};

export const GATE_WAIVER: GateWaiverRow[] = [];

export const waiverOf = (bapelId: number, year: number, month: number) =>
  GATE_WAIVER.find(
    (row) =>
      isLive(row) &&
      row.bapelId === bapelId &&
      row.year === year &&
      row.month === month,
  ) ?? null;

export const waiverView = (row: GateWaiverRow | null): GateWaiver | null =>
  row
    ? {
        reason: row.reason,
        createdBy: userNameOf(row.createdById),
        createdAt: row.createdAt,
      }
    : null;

// ---------------------------------------------------------------------------
// SATU fungsi untuk "pencairan komisi di bulan itu".
//
// Gerbang pencairan, daftar Belum lapor, dan prefill LPJ semuanya memakai ini.
// Kalau ketiganya menghitung sendiri-sendiri mereka akan berbeda pendapat dan
// tidak ada yang akan tahu yang mana yang benar — dan salah satunya memblokir
// uang. Pemicunya `bapelId`, BUKAN `programId`: Program tidak ada di Kas Keluar
// (keputusan user U4), jadi pemicu lama tidak akan pernah menyala lagi.

export const disbursementsIn = (bapelId: number, year: number, month: number) =>
  CASH_EXPENSE.filter(
    (row) =>
      isLive(row) &&
      row.status === "PAID" &&
      row.bapelId === bapelId &&
      row.expenseDate.slice(0, 7) === `${year}-${pad(month)}`,
  );

/** M−1, dengan Januari mundur ke Desember tahun sebelumnya. */
export const previousMonth = (year: number, month: number) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

export const complianceStateOf = (
  bapelId: number,
  year: number,
  month: number,
): ComplianceState => {
  if (waiverOf(bapelId, year, month)) return "WAIVED";
  if (disbursementsIn(bapelId, year, month).length === 0) return "NOT_DUE";

  const report = reportOf(bapelId, year, month);
  if (!report) return "MISSING";

  return report.status === "APPROVED" ? "APPROVED" : "DRAFT";
};

/** Penolakan gerbang untuk sebuah pencairan, atau null bila lolos. */
export const gateFailureOf = (bapelId: number | null, expenseDate: string) => {
  if (bapelId === null) return null;

  const { year, month } = previousMonth(
    Number(expenseDate.slice(0, 4)),
    Number(expenseDate.slice(5, 7)),
  );
  const state = complianceStateOf(bapelId, year, month);

  if (state === "APPROVED" || state === "NOT_DUE" || state === "WAIVED") {
    return null;
  }

  return {
    code: "BUDGET_REPORT_PENDING" as const,
    message: `Komisi Ini Belum Menyelesaikan Laporan Pemakaian Budget Bulan ${monthLabel(`${year}-${pad(month)}`)}. Laporan Harus Disetujui Lengkap Sebelum Pencairan Bulan Berikutnya`,
    bapel: bapelRef(bapelId),
    year,
    month,
  };
};

// ---------------------------------------------------------------------------
// Pagu terpakai. Satu bentuk (CeilingUsage) dipakai store dan layar, dan
// `untagged` tidak opsional: angka per komisi tanpa sisa tak-bertandanya
// terbaca sebagai keseluruhan.

const untaggedIn = (year: number) =>
  sumAmounts(
    CASH_EXPENSE.filter(
      (row) =>
        isLive(row) &&
        row.status === "PAID" &&
        row.bapelId === null &&
        isWithinBudgetYear(row.expenseDate, year),
    ).map((row) => cashExpenseTotal(row)),
  );

export const ceilingUsage = (bapelId: number, year: number): CeilingUsage => {
  const allocation = allocationOf(bapelId, year);
  const ceiling = allocation ? allocation.amount : null;
  const committed = sumAmounts(liveProgramsOf(bapelId, year).map(heldBy));
  const disbursed = sumAmounts(
    CASH_EXPENSE.filter(
      (row) =>
        isLive(row) &&
        row.status === "PAID" &&
        row.bapelId === bapelId &&
        isWithinBudgetYear(row.expenseDate, year),
    ).map((row) => cashExpenseTotal(row)),
  );
  const reported = sumAmounts(
    BUDGET_USAGE_REPORT.filter(
      (row) =>
        isLive(row) &&
        row.bapelId === bapelId &&
        row.status === "APPROVED" &&
        isWithinBudgetYear(`${row.year}-${pad(row.month)}-01`, year),
    ).map((row) => reportTotal(row)),
  );

  return {
    year,
    ceiling,
    committed,
    remaining:
      ceiling === null ? null : String(Number(ceiling) - Number(committed)),
    isWithinCeiling: ceiling !== null && Number(committed) <= Number(ceiling),
    disbursed,
    reported,
    untagged: untaggedIn(year),
  };
};

/** Apakah satu usulan lagi masih muat? Inklusif: tepat di pagu diterima. */
export const isWithinCeiling = (
  bapelId: number,
  year: number,
  proposed: string,
  exceptProgramId?: number,
) => {
  const allocation = allocationOf(bapelId, year);
  if (!allocation) return false;

  const committed = sumAmounts(
    liveProgramsOf(bapelId, year)
      .filter((row) => row.id !== exceptProgramId)
      .map(heldBy),
  );

  return Number(committed) + Number(proposed) <= Number(allocation.amount);
};

export const remainingFor = (
  bapelId: number,
  year: number,
  exceptProgramId?: number,
) => {
  const allocation = allocationOf(bapelId, year);
  if (!allocation) return null;

  const committed = sumAmounts(
    liveProgramsOf(bapelId, year)
      .filter((row) => row.id !== exceptProgramId)
      .map(heldBy),
  );

  return String(Number(allocation.amount) - Number(committed));
};

// ---------------------------------------------------------------------------
// Bentuk tampilan.

export const allocationView = (row: BudgetAllocationRow, isDetail = false) => ({
  publicId: row.publicId,
  year: row.year,
  budgetYear: budgetYearView(row.year),
  amount: row.amount,
  bapel: bapelRef(row.bapelId),
  ...(isDetail ? { bapelId: row.bapelId } : {}),
  usage: ceilingUsage(row.bapelId, row.year),
});

export const programItemView = (item: ProgramItemRow) => ({
  publicId: item.publicId,
  accountId: item.accountId,
  account: accountRef(item.accountId),
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  amount: itemAmount(item),
  approvedAmount: null,
  note: item.note,
});

const approvalView = (row: ProgramApprovalRow, total: string) => ({
  publicId: row.publicId,
  code: row.code,
  status: row.status,
  currentOrder: row.currentOrder,
  amount: total,
  isSubmittedByViewer: row.submittedById === SESSION_USER_ID,
  steps: row.steps.map((step) => ({
    order: step.order,
    approverRoleName: step.roleName,
    approverBapel: null,
    status: step.status,
    note: step.note,
    actedAt: step.actedAt,
    actor: userNameOf(step.actedById),
  })),
});

const latestApproval = (rows: ProgramApprovalRow[]) =>
  rows.length > 0 ? rows[rows.length - 1] : null;

export const programView = (row: ProgramRow, isDetail = false) => {
  const total = programTotal(row);
  const approval = latestApproval(row.approvals);

  return {
    publicId: row.publicId,
    code: row.code,
    name: row.name,
    year: row.year,
    budgetYear: budgetYearView(row.year),
    status: row.status,
    isUnplanned: row.isUnplanned,
    startDate: row.startDate,
    endDate: row.endDate,
    bapel: bapelRef(row.bapelId),
    proposedAmount: total,
    budgetAmount: null,
    approval: approval ? approvalView(approval, total) : null,
    ...(isDetail
      ? {
          bapelId: row.bapelId,
          description: row.description,
          items: row.items.map(programItemView),
          ceiling: ceilingUsage(row.bapelId, row.year),
          approvedBy: userNameOf(row.approvedById),
          approvedAt: row.approvedAt,
          cancelReason: row.cancelReason,
          cancelledBy: userNameOf(row.cancelledById),
          cancelledAt: row.cancelledAt,
        }
      : { itemCount: row.items.length }),
  };
};

export const reportLineView = (line: ReportLineRow) => {
  const program = line.programId
    ? (PROGRAM.find((row) => row.id === line.programId) ?? null)
    : null;
  const expense = line.cashExpenseId
    ? (CASH_EXPENSE.find((row) => row.id === line.cashExpenseId) ?? null)
    : null;

  return {
    publicId: line.publicId,
    accountId: line.accountId,
    account: accountRef(line.accountId),
    program: program
      ? { publicId: program.publicId, code: program.code, name: program.name }
      : null,
    spentDate: line.spentDate,
    description: line.description,
    amount: line.amount,
    cashExpense: expense
      ? { publicId: expense.publicId, code: expense.code }
      : null,
  };
};

export const reportView = (row: BudgetReportRow, isDetail = false) => {
  const total = reportTotal(row);
  const approval = latestApproval(row.approvals);

  return {
    publicId: row.publicId,
    code: row.code,
    bapel: bapelRef(row.bapelId),
    year: row.year,
    month: row.month,
    label: monthLabel(`${row.year}-${pad(row.month)}`),
    status: row.status,
    totalAmount: total,
    approval: approval ? approvalView(approval, total) : null,
    waiver: waiverView(waiverOf(row.bapelId, row.year, row.month)),
    ...(isDetail
      ? {
          bapelId: row.bapelId,
          note: row.note,
          lines: row.lines.map(reportLineView),
          listReceipt: row.receipts,
          approvedBy: userNameOf(row.approvedById),
          approvedAt: row.approvedAt,
        }
      : { lineCount: row.lines.length, receiptCount: row.receipts.length }),
  };
};

export const complianceRows = (
  year: number,
  month: number,
  scope: KomisiScope = { isAll: true },
) =>
  bapelIds()
    .filter((bapelId) => isVisibleBapel(scope, bapelId))
    .map((bapelId) => {
      const report = reportOf(bapelId, year, month);
      const paid = disbursementsIn(bapelId, year, month);

      return {
        bapel: bapelRef(bapelId),
        state: complianceStateOf(bapelId, year, month),
        report: report
          ? { publicId: report.publicId, code: report.code }
          : null,
        disbursementCount: paid.length,
        disbursementTotal: sumAmounts(paid.map((row) => cashExpenseTotal(row))),
        waiver: waiverView(waiverOf(bapelId, year, month)),
      };
    });

/** Baris LPJ yang diisi awal dari Kas Keluar yang sudah dibayar bulan itu. */
export const prefillLines = (bapelId: number, year: number, month: number) => {
  const lines = disbursementsIn(bapelId, year, month).flatMap((expense) =>
    expense.lines.map((line) => ({
      cashExpense: { publicId: expense.publicId, code: expense.code },
      accountId: line.accountId,
      account: accountRef(line.accountId),
      programId: null,
      spentDate: expense.expenseDate,
      description: line.description ?? expense.description,
      amount: line.amount,
    })),
  );

  return { lines, total: sumAmounts(lines.map((line) => line.amount)) };
};

export const programDdl = (params: URLSearchParams) => {
  const bapelId = Number(params.get("bapelId")) || 0;
  const year = Number(params.get("year")) || currentBudgetYear();
  const filter = (params.get("filter") ?? "").toLowerCase();

  return PROGRAM.filter(
    (row) =>
      isLive(row) &&
      row.status !== "CANCELLED" &&
      (!bapelId || row.bapelId === bapelId) &&
      row.year === year &&
      (!filter ||
        row.name.toLowerCase().includes(filter) ||
        row.code.toLowerCase().includes(filter)),
  ).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    isActive: true,
  }));
};

function bapelIds(): number[] {
  const ids = new Set<number>();
  for (const row of BUDGET_ALLOCATION) ids.add(row.bapelId);
  for (const row of PROGRAM) if (isLive(row)) ids.add(row.bapelId);
  for (const row of BUDGET_USAGE_REPORT) if (isLive(row)) ids.add(row.bapelId);
  for (const row of CASH_EXPENSE) {
    if (isLive(row) && row.bapelId !== null) ids.add(row.bapelId);
  }

  return [...ids].sort((left, right) => left - right);
}

export { codeOf, startOfMonth };
