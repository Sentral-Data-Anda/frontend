import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { FetchError } from "@/lib/api/fetcher";
import { fromServerAttachment, newAttachments } from "@/lib/attachment";
import { addMonths, monthRange, startOfMonth, todayJakarta } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { formatAmount, formatDateTime, formatRupiah } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";
import { sumAmounts } from "@/lib/number";
import type { AttachmentValue } from "@/types/attachment";

import type {
  BudgetReport,
  BudgetReportDetail,
  Prefill,
  PrefillLine,
  ReportApproval,
  ReportApprovalStep,
} from "./types";

export const REPORT_LIST_PATH = menuHref(MENU.REPORT, MENU.BUDGET_REALIZATION);

export const REPORT_CREATE_PATH = createHref(
  MENU.REPORT,
  MENU.BUDGET_REALIZATION,
);

export const reportDetailHref = (publicId: string) =>
  detailHref(MENU.REPORT, MENU.BUDGET_REALIZATION, publicId);

export const reportEditHref = (publicId: string) =>
  editHref(MENU.REPORT, MENU.BUDGET_REALIZATION, publicId);

export const approvalHref = (publicId: string) =>
  detailHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST, publicId);

export const accountHref = (code: string) =>
  detailHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT, code);

export const programHref = (publicId: string) =>
  detailHref(MENU.BUDGETING, MENU.PROGRAM, publicId);

export const expenseHref = (publicId: string) =>
  detailHref(MENU.FINANCE, MENU.KAS_KELUAR, publicId);

export const ROLE_JEMAAT_PATH = menuHref(MENU.KEJEMAATAN, MENU.ROLE_JEMAAT);

export const WORKFLOW_PATH = menuHref(MENU.APPROVAL, MENU.APPROVAL_WORKFLOW);

export const createForHref = (bapelId: number, month: string) =>
  `${REPORT_CREATE_PATH}?komisi=${bapelId}&bulan=${month}`;

export const verificationHref = (origin: string, publicId: string) =>
  `${origin}/api/v1/public/verifikasi/${publicId}`;

export const LIST_FILTERS = {
  tab: { api: "tab" },
  bulan: { api: "month" },
  komisi: { api: "bapelId" },
  status: { api: "status" },
} satisfies ListFilterSchema;

export const PENDING_TAB = "belum-lapor";

export const VIEW_TABS = [
  { value: "", label: "Laporan" },
  { value: PENDING_TAB, label: "Belum lapor" },
] as const;

export const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "DRAFT", label: "Draf" },
  { value: "APPROVED", label: "Disetujui" },
] as const;

export const NO_VIEW =
  "Hubungi administrator bila Anda memang seharusnya memegang akses ini.";

export const EMPTY_TITLE = "Belum ada laporan pemakaian budget";

export const EMPTY_DESCRIPTION =
  "Laporan menutup satu bulan belanja badan pelayanan, dan persetujuannya membuka pencairan bulan berikutnya.";

export const PENDING_EMPTY = "Belum ada badan pelayanan untuk bulan ini.";

export const RECEIPT_NOTE =
  "Foto atau PDF kwitansi. Penanda tangan melihatnya saat menyetujui.";

export const RECEIPT_PRIVACY =
  "Kwitansi hanya bisa dibuka pengurus badan pelayanan ini, Majelis, dan bendahara.";

export const REPORT_NOTE =
  "Laporan disimpan sebagai Draf. Bulan laporan memakai bulan kalender, bukan tahun pelayanan.";

export const LINE_NOTE =
  "Program boleh dikosongkan: konsumsi rapat, fotokopi, dan bensin memang di luar program. Mengganti badan pelayanan mengosongkan pilihan program di semua baris.";

export const PREFILL_EMPTY_TITLE = "Tidak ada Kas Keluar yang bisa diisi awal";

export const PREFILL_EMPTY_MESSAGE =
  "Tidak ada Kas Keluar yang dibayar untuk badan pelayanan ini di bulan tersebut. Tulis pemakaiannya manual.";

export const PREFILL_REFILL_TEXT =
  "Isi ulang rincian dari Kas Keluar badan pelayanan dan bulan yang baru dipilih? Baris yang sekarang ada akan diganti.";

export const REJECTED_FALLBACK = "Penanda tangan tidak menuliskan catatan.";

export const WAIVER_TITLE = "Bulan ini dibebaskan dari gerbang pencairan";

export const MAX_RECEIPTS = 20;

const MONEY_MAX = 9_999_999_999_999;

const TEXT_MAX = 250;

export const previousMonthOf = (today = todayJakarta()) =>
  addMonths(startOfMonth(today), -1).slice(0, 7);

export const currentMonthOf = (today = todayJakarta()) =>
  startOfMonth(today).slice(0, 7);

export const spentDateBounds = (month: string, today = todayJakarta()) => {
  const { startDate, endDate } = monthRange(month);

  if (!startDate) return { min: undefined, max: today };

  return { min: startDate, max: endDate < today ? endDate : today };
};

export const budgetYearOfMonth = (
  years: readonly { year: number; from: string; to: string }[],
  month: string,
) => {
  const first = month ? `${month}-01` : "";
  const found = years.find(
    (budgetYear) => first >= budgetYear.from && first <= budgetYear.to,
  );

  return found ? String(found.year) : "";
};

export const monthValueOf = (report: { year: number; month: number }) =>
  `${report.year}-${String(report.month).padStart(2, "0")}`;

export const toReportQuery = (
  filters: Record<string, string>,
  today = todayJakarta(),
) => {
  const month = filters.bulan ?? "";

  return {
    status: filters.status ?? "",
    apiFilters: {
      year: month ? month.slice(0, 4) : today.slice(0, 4),
      month: month ? String(Number(month.slice(5, 7))) : "",
      bapelId: filters.komisi ?? "",
    },
  };
};

export type ReportState = "DRAFT" | "PENDING_APPROVAL" | "APPROVED";

type StateSource = {
  status: BudgetReport["status"];
  approval: ReportApproval | null;
};

export const reportStateOf = (report: StateSource): ReportState =>
  report.status === "DRAFT" && report.approval?.status === "PENDING"
    ? "PENDING_APPROVAL"
    : report.status;

export const pendingStepText = (approval: ReportApproval) =>
  `Menunggu persetujuan (${approval.currentOrder} dari ${approval.steps.length})`;

const REPORT_STATE_LABEL: Record<ReportState, string> = {
  DRAFT: "Draf",
  PENDING_APPROVAL: "Menunggu persetujuan",
  APPROVED: "Disetujui",
};

export const reportStateLabel = (report: StateSource) => {
  const state = reportStateOf(report);

  return state === "PENDING_APPROVAL" && report.approval
    ? pendingStepText(report.approval)
    : REPORT_STATE_LABEL[state];
};

export const rejectedStepOf = (approval: ReportApproval | null) =>
  approval?.status === "REJECTED"
    ? (approval.steps.find((step) => step.status === "REJECTED") ?? null)
    : null;

export const rejectedTitleOf = (step: ReportApprovalStep) =>
  [
    "Ditolak",
    step.actor?.name,
    step.approverRoleName,
    step.actedAt ? formatDateTime(step.actedAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const rejectedMessageOf = (step: ReportApprovalStep) =>
  `${step.note ?? REJECTED_FALLBACK} Perbaiki lalu ajukan lagi.`;

export const waiverTextOf = (waiver: {
  reason: string;
  createdBy: { name: string } | null;
  createdAt: string;
}) =>
  `${waiver.reason} — dibebaskan ${waiver.createdBy?.name ?? "bendahara"} · ${formatDateTime(waiver.createdAt)}`;

// Ambang 25% hanya menentukan nada spanduk; ia bukan aturan dan tidak pernah
// menolak apa pun.
const LARGE_VARIANCE = 0.25;

export type Variance = {
  disbursed: string;
  reported: string;
  difference: string;
  text: string;
  isLarge: boolean;
};

export const varianceOf = (disbursed: string, reported: string): Variance => {
  const difference = Number(reported) - Number(disbursed);
  const scale = Math.max(Number(disbursed), Number(reported));

  return {
    disbursed,
    reported,
    difference: String(difference),
    text: `Kas Keluar bulan ini ${formatAmount(disbursed)} · Laporan ini ${formatAmount(reported)} · selisih ${formatRupiah(Math.abs(difference))}`,
    isLarge: scale > 0 && Math.abs(difference) / scale > LARGE_VARIANCE,
  };
};

export const VARIANCE_NORMAL =
  "Selisih sebesar ini normal: panjar, uang yang ditalangi pengurus, dan belanja yang dibayar badan pelayanan sendiri tidak lewat Kas Keluar.";

export const VARIANCE_HINT =
  "Kedua angka boleh berbeda. Selisihnya adalah uang yang dipegang badan pelayanan sendiri, bukan kesalahan.";

export const reportDeleteText = (report: Pick<BudgetReportDetail, "label">) =>
  `Apakah Anda ingin menghapus laporan ${report.label}? Laporan yang sudah disetujui tidak bisa dihapus.`;

export const REPORT_SUBMIT_TEXT =
  "Laporan dikirim untuk tanda tangan. Sesudah disetujui lengkap, pencairan bulan berikutnya terbuka.";

export const REPORT_WITHDRAW_TEXT =
  "Apakah Anda ingin menarik pengajuan ini? Laporan kembali menjadi Draf dan bisa disunting.";

export type ErrorFix = { menu: MenuSlug; label: string; href: string };

const ERROR_FIX: Record<string, ErrorFix> = {
  NO_WORKFLOW: {
    menu: MENU.APPROVAL_WORKFLOW,
    label: "Lihat Setelan Alur Persetujuan",
    href: WORKFLOW_PATH,
  },
  NO_POSITION_HOLDER: {
    menu: MENU.ROLE_JEMAAT,
    label: "Lihat Role Jemaat",
    href: ROLE_JEMAAT_PATH,
  },
  ACCOUNT_INACTIVE: {
    menu: MENU.CHART_OF_ACCOUNT,
    label: "Lihat Akun",
    href: menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT),
  },
};

export const errorFixOf = (error: unknown): ErrorFix | null =>
  error instanceof FetchError && error.code
    ? (ERROR_FIX[error.code] ?? null)
    : null;

const numberIssues = (value: string, noun: string): string[] => {
  if (!value) return [`Isi ${noun}`];

  const amount = Number(value);

  if (Number.isNaN(amount) || amount <= 0) {
    return [`${noun} harus lebih dari 0`];
  }
  if (amount > MONEY_MAX) return [`${noun} maksimal 13 digit`];
  if ((value.split(".")[1] ?? "").length > 2) {
    return [`${noun} maksimal 2 angka di belakang koma`];
  }

  return [];
};

export const reportFormSchema = z
  .object({
    bapelId: z.string(),
    month: z.string(),
    note: z.string(),
    prefillKey: z.string(),
    lines: z.array(
      z.object({
        accountId: z.string(),
        programId: z.string(),
        spentDate: z.string(),
        description: z.string(),
        amount: z.string(),
        cashExpenseId: z.string(),
        cashExpenseCode: z.string(),
      }),
    ),
    receipts: z.array(z.custom<AttachmentValue>()),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.bapelId) addIssue(["bapelId"], "Pilih badan pelayanan");

    if (!values.month) addIssue(["month"], "Pilih bulan laporan");
    else if (values.month > currentMonthOf()) {
      addIssue(["month"], "Bulan laporan tidak boleh di masa depan");
    }

    if (collapseSpaces(values.note).length > TEXT_MAX) {
      addIssue(["note"], `Keterangan maksimal ${TEXT_MAX} karakter`);
    }

    if (values.lines.length === 0) {
      addIssue(["lines"], "Laporan harus memiliki minimal 1 baris pemakaian");
    }

    const bounds = spentDateBounds(values.month);

    values.lines.forEach((line, index) => {
      if (!line.accountId) addIssue(["lines", index, "accountId"], "Pilih pos");

      if (!line.spentDate) {
        addIssue(["lines", index, "spentDate"], "Isi tanggal pemakaian");
      } else if (
        bounds.min &&
        (line.spentDate < bounds.min || line.spentDate > bounds.max)
      ) {
        addIssue(
          ["lines", index, "spentDate"],
          "Tanggal pemakaian harus berada di bulan laporan",
        );
      }

      if (!collapseSpaces(line.description)) {
        addIssue(["lines", index, "description"], "Isi uraian");
      } else if (collapseSpaces(line.description).length > TEXT_MAX) {
        addIssue(
          ["lines", index, "description"],
          `Uraian maksimal ${TEXT_MAX} karakter`,
        );
      }

      numberIssues(line.amount, "Nominal").forEach((message) =>
        addIssue(["lines", index, "amount"], message),
      );
    });

    if (values.receipts.length > MAX_RECEIPTS) {
      addIssue(["receipts"], `Kwitansi maksimal ${MAX_RECEIPTS} berkas`);
    }
  });

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export type ReportLineValues = ReportFormValues["lines"][number];

export const emptyLine = (): ReportLineValues => ({
  accountId: "",
  programId: "",
  spentDate: "",
  description: "",
  amount: "",
  cashExpenseId: "",
  cashExpenseCode: "",
});

export const emptyReportForm = (
  month = previousMonthOf(),
  bapelId = "",
): ReportFormValues => ({
  bapelId,
  month,
  note: "",
  prefillKey: "",
  lines: [emptyLine()],
  receipts: [],
});

export const toReportForm = (report: BudgetReportDetail): ReportFormValues => ({
  bapelId: String(report.bapelId),
  month: monthValueOf(report),
  note: report.note ?? "",
  prefillKey: "",
  lines: report.lines.map((line) => ({
    accountId: String(line.accountId),
    programId: line.programId === null ? "" : String(line.programId),
    spentDate: line.spentDate.slice(0, 10),
    description: line.description,
    amount: String(Number(line.amount)),
    cashExpenseId: line.cashExpense?.publicId ?? "",
    cashExpenseCode: line.cashExpense?.code ?? "",
  })),
  receipts: report.listReceipt.map(fromServerAttachment),
});

export const prefillToLines = (prefill: Prefill): ReportLineValues[] =>
  prefill.lines.map((line: PrefillLine) => ({
    accountId: String(line.accountId),
    programId: "",
    spentDate: line.spentDate.slice(0, 10),
    description: line.description,
    amount: String(Number(line.amount)),
    cashExpenseId: line.cashExpense.publicId,
    cashExpenseCode: line.cashExpense.code,
  }));

export const isLinesFilled = (lines: readonly ReportLineValues[]) =>
  lines.some((line) =>
    Boolean(line.accountId || line.description.trim() || line.amount),
  );

export const clearPrograms = (lines: readonly ReportLineValues[]) =>
  lines.map((line) => ({ ...line, programId: "" }));

// Isian yang sudah disunting tidak boleh hilang tanpa ditanya, dan baris yang
// masih kosong tidak layak ditanyakan.
export const isRefillAsked = (input: {
  isEdit: boolean;
  isPrefillReady: boolean;
  prefillKey: string;
  settledKey: string;
  lines: readonly ReportLineValues[];
}) =>
  !input.isEdit &&
  input.isPrefillReady &&
  input.prefillKey !== input.settledKey &&
  isLinesFilled(input.lines);

export const formTotal = (lines: readonly ReportLineValues[]) =>
  sumAmounts(lines.map((line) => line.amount || "0"));

export const toReportFormData = (values: ReportFormValues, isEdit: boolean) =>
  toFormData(
    {
      bapelId: values.bapelId,
      year: values.month.slice(0, 4),
      month: String(Number(values.month.slice(5, 7))),
      note: collapseSpaces(values.note),
      lines: JSON.stringify(
        values.lines.map((line) => ({
          accountId: Number(line.accountId),
          programId: line.programId || null,
          spentDate: line.spentDate,
          description: collapseSpaces(line.description),
          amount: line.amount,
        })),
      ),
      keepFiles: isEdit
        ? JSON.stringify(
            values.receipts
              .filter((item) => item.file === null)
              .map((item) => ({ publicId: item.key })),
          )
        : null,
    },
    newAttachments(values.receipts).map((item) => ({
      field: "receipt",
      file: item.file,
    })),
  );

const RECEIPT_PATHS = new Set(["receipt", "keepFiles"]);

export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: RECEIPT_PATHS.has(issue.path) ? "receipts" : issue.path,
        })),
        error.code,
      )
    : error;

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/unsupported file type/i, "receipts", "Pilih berkas JPG, PNG, atau PDF"],
  [/file too large/i, "receipts", "Ukuran berkas maksimal 10 MB"],
];

export function serverFieldError(message: string) {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}
