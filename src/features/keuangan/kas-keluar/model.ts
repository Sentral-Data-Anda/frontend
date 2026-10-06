import type { ComponentProps } from "react";
import { z } from "zod";

import type { Badge } from "@/components/common/display";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { fromServerAttachment, newAttachments } from "@/lib/attachment";
import { monthRange, todayJakarta } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { collapseSpaces } from "@/lib/name";
import type { AttachmentValue } from "@/types/attachment";
import {
  BAPEL_CHOICES,
  CASH_EXPENSE_STATUS_LABEL,
  type BapelChoice,
} from "@/types/keuangan";

import type { CashExpenseDetail, ExpenseState } from "./types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export const EXPENSE_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.KAS_KELUAR);

export const EXPENSE_CREATE_PATH = createHref(MENU.KEUANGAN, MENU.KAS_KELUAR);

export const expenseHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.KAS_KELUAR, publicId);

export const expenseEditHref = (publicId: string) =>
  editHref(MENU.KEUANGAN, MENU.KAS_KELUAR, publicId);

export const approvalHref = (publicId: string) =>
  detailHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN, publicId);

// Rute Jurnal hanya menerima publicId; kodenya untuk dibaca, bukan dirute.
export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const accountHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.AKUN, code);

export const PERIOD_PATH = menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL);

const REPORT_PATH = menuHref(MENU.ANGGARAN, MENU.LAPORAN_BUDGET);

/** M−1 dari `expenseDate`, dengan Januari mundur ke Desember tahun sebelumnya. */
export const previousMonthOf = (expenseDate: string) => {
  const year = Number(expenseDate.slice(0, 4));
  const month = Number(expenseDate.slice(5, 7));

  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
};

// Tautan ke LPJ bulan itu, tersaring komisi — bukan ke daftar penuh. Ketua
// komisi yang ditolak tidak boleh disuruh mencari sendiri laporan mana.
export const reportFilterHref = (
  bapelId: number,
  year: number,
  month: number,
) => `${REPORT_PATH}?komisi=${bapelId}&tahun=${year}&bulan=${month}`;

export const reportCreateHref = (
  bapelId: number,
  year: number,
  month: number,
) =>
  `${createHref(MENU.ANGGARAN, MENU.LAPORAN_BUDGET)}?komisi=${bapelId}&tahun=${year}&bulan=${month}`;

export const ACCOUNT_PATH = menuHref(MENU.KEUANGAN, MENU.AKUN);

export const NO_VIEW =
  "Hubungi administrator bila Anda memang seharusnya memegang akses ini.";

export const EMPTY_TITLE = "Belum ada kas keluar";

export const EMPTY_DESCRIPTION =
  "Catat pengeluaran gereja di sini, lalu ajukan supaya uangnya boleh keluar.";

export const LINE_NOTE =
  "Untuk pembelian barang inventaris, pilih pos aset tetap, bukan pos beban.";

export const NOTE_HINT =
  "Foto atau PDF nota. Penanda tangan melihatnya saat menyetujui.";

export const REFERENCE_HINT =
  "Kode pesanan pembelian, nomor nota, atau dokumen lain.";

const BAPEL_CHOICE_LABEL: Record<BapelChoice, string> = {
  KOMISI: "Untuk badan pelayanan",
  BUKAN_KOMISI: "Bukan belanja badan pelayanan",
};

export const BAPEL_CHOICE_OPTIONS = BAPEL_CHOICES.map((value) => ({
  value,
  label: BAPEL_CHOICE_LABEL[value],
}));

export const BAPEL_CHOICE_HINT =
  "Pilih 'Untuk badan pelayanan' bila uang ini milik anggaran badan pelayanan itu. Laporan pemakaian bulan sebelumnya harus sudah disetujui sebelum pencairannya bisa dibayar.";

export const BAPEL_HINT = "Badan pelayanan yang menerima pencairan ini.";

export const EXPENSE_STATE_LABEL: Record<ExpenseState, string> = {
  ...CASH_EXPENSE_STATUS_LABEL,
  PENDING_APPROVAL: "Menunggu persetujuan",
};

export const EXPENSE_STATE_VARIANT: Record<ExpenseState, BadgeVariant> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "draft",
  APPROVED: "wait",
  PAID: "success",
  CANCELLED: "neutral",
};

const REASON_MAX = 40;

export const expenseStateOf = (expense: {
  status: CashExpenseDetail["status"];
  approval: CashExpenseDetail["approval"];
}): ExpenseState =>
  expense.status === "DRAFT" && expense.approval?.status === "PENDING"
    ? "PENDING_APPROVAL"
    : expense.status;

export const isRejected = (expense: {
  status: CashExpenseDetail["status"];
  approval: CashExpenseDetail["approval"];
}) => expense.status === "DRAFT" && expense.approval?.status === "REJECTED";

export const rejectionMarkOf = (expense: {
  status: CashExpenseDetail["status"];
  approval: CashExpenseDetail["approval"];
}): string | null => {
  if (!isRejected(expense)) return null;

  const reason = collapseSpaces(expense.approval?.note ?? "");
  if (!reason) return "Ditolak";

  return reason.length > REASON_MAX
    ? `Ditolak · ${reason.slice(0, REASON_MAX).trimEnd()}…`
    : `Ditolak · ${reason}`;
};

export const isLocked = (expense: {
  status: CashExpenseDetail["status"];
  approval: CashExpenseDetail["approval"];
}) => expenseStateOf(expense) === "PENDING_APPROVAL";

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "PENDING_APPROVAL", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "PAID", label: "Dibayar" },
] as const;

export const ALL_MONTHS = "semua";

export const currentMonth = (today = todayJakarta()) => today.slice(0, 7);

const TAB_QUERY: Record<string, { status: string; isPending?: string }> = {
  DRAFT: { status: "DRAFT", isPending: "0" },
  PENDING_APPROVAL: { status: "DRAFT", isPending: "1" },
  APPROVED: { status: "APPROVED" },
  PAID: { status: "PAID" },
};

export const toExpenseQuery = (
  status: string,
  filters: Record<string, string>,
) => {
  const month = filters.bulan ?? "";
  const { startDate, endDate } = monthRange(
    month === ALL_MONTHS ? "" : month || currentMonth(),
  );
  const tab = TAB_QUERY[status];

  return {
    status: tab?.status ?? "",
    apiFilters: {
      startDate,
      endDate,
      bapelId: filters.badan ?? "",
      isPendingApproval: tab?.isPending ?? "",
    },
  };
};

export const MAX_LINES = 50;
export const MAX_NOTES = 3;
const PAYEE_MAX = 150;
const DESCRIPTION_MAX = 250;
const METHOD_MAX = 30;

export const expenseFormSchema = z
  .object({
    expenseDate: z.string(),
    payee: z.string(),
    paidFromAccountId: z.string(),
    method: z.string(),
    reference: z.string(),
    bapelChoice: z.string(),
    bapelId: z.string(),
    description: z.string(),
    lines: z.array(
      z.object({
        accountId: z.string(),
        amount: z.string(),
        description: z.string(),
      }),
    ),
    attachments: z.array(z.custom<AttachmentValue>()),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.expenseDate) addIssue(["expenseDate"], "Isi tanggal");
    else if (values.expenseDate > todayJakarta()) {
      addIssue(["expenseDate"], "Tanggal tidak boleh di masa depan");
    }

    const payee = collapseSpaces(values.payee);
    if (!payee) addIssue(["payee"], "Isi penerima pembayaran");
    else if (payee.length > PAYEE_MAX) {
      addIssue(["payee"], `Penerima maksimal ${PAYEE_MAX} karakter`);
    }

    if (!values.paidFromAccountId) {
      addIssue(["paidFromAccountId"], "Pilih akun sumber dana");
    }

    if (!values.bapelChoice) {
      addIssue(
        ["bapelChoice"],
        "Jawab dulu: untuk badan pelayanan, atau bukan",
      );
    } else if (values.bapelChoice === "KOMISI" && !values.bapelId) {
      addIssue(["bapelId"], "Pilih badan pelayanan");
    }

    if (collapseSpaces(values.method).length > METHOD_MAX) {
      addIssue(["method"], `Cara bayar maksimal ${METHOD_MAX} karakter`);
    }

    const description = collapseSpaces(values.description);
    if (!description) addIssue(["description"], "Isi keterangan");
    else if (description.length > DESCRIPTION_MAX) {
      addIssue(
        ["description"],
        `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
      );
    }

    if (values.lines.length === 0) {
      addIssue(["lines"], "Tambahkan minimal satu baris");
    } else if (values.lines.length > MAX_LINES) {
      addIssue(["lines"], `Maksimal ${MAX_LINES} baris per kas keluar`);
    }

    values.lines.forEach((line, index) => {
      if (!line.accountId) addIssue(["lines", index, "accountId"], "Pilih pos");
      if (!(Number(line.amount) > 0)) {
        addIssue(["lines", index, "amount"], "Isi nominal, lebih dari 0");
      }
    });

    if (values.attachments.length > MAX_NOTES) {
      addIssue(["attachments"], `Nota maksimal ${MAX_NOTES} berkas`);
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export type ExpenseLineValues = ExpenseFormValues["lines"][number];

export const emptyLine = (): ExpenseLineValues => ({
  accountId: "",
  amount: "",
  description: "",
});

export const emptyExpenseForm = (
  today = todayJakarta(),
): ExpenseFormValues => ({
  expenseDate: today,
  payee: "",
  paidFromAccountId: "",
  method: "",
  reference: "",
  bapelChoice: "",
  bapelId: "",
  description: "",
  lines: [emptyLine()],
  attachments: [],
});

export const toExpenseForm = (
  detail: CashExpenseDetail,
): ExpenseFormValues => ({
  expenseDate: detail.expenseDate.slice(0, 10),
  payee: detail.payee,
  paidFromAccountId: String(detail.paidFromAccountId),
  method: detail.method ?? "",
  reference: detail.reference ?? "",
  // Baris lama tidak punya jawaban; kolomnya dibiarkan kosong, tanpa backfill.
  bapelChoice: detail.bapelChoice ?? "",
  bapelId: detail.bapelId === null ? "" : String(detail.bapelId),
  description: detail.description,
  lines: detail.lines.map((line) => ({
    accountId: String(line.accountId),
    amount: String(Number(line.amount)),
    description: line.description ?? "",
  })),
  attachments: detail.attachments.map(fromServerAttachment),
});

export const toExpenseFormData = (values: ExpenseFormValues, isEdit: boolean) =>
  toFormData(
    {
      expenseDate: values.expenseDate,
      payee: collapseSpaces(values.payee),
      paidFromAccountId: values.paidFromAccountId,
      bapelChoice: values.bapelChoice,
      bapelId: values.bapelId,
      method: collapseSpaces(values.method),
      reference: collapseSpaces(values.reference),
      description: collapseSpaces(values.description),
      lines: JSON.stringify(
        values.lines.map((line) => ({
          accountId: Number(line.accountId),
          amount: Number(line.amount),
          description: collapseSpaces(line.description) || null,
        })),
      ),
      keepFiles: isEdit
        ? JSON.stringify(
            values.attachments
              .filter((item) => item.file === null)
              .map((item) => ({ publicId: item.key })),
          )
        : null,
    },
    newAttachments(values.attachments).map((item) => ({
      field: "image",
      file: item.file,
    })),
  );

const NOTE_PATHS = new Set(["image", "keepFiles"]);

export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: NOTE_PATHS.has(issue.path) ? "attachments" : issue.path,
        })),
        error.code,
      )
    : error;

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/unsupported file type/i, "attachments", "Pilih berkas JPG, PNG, atau PDF"],
  [/file too large/i, "attachments", "Ukuran berkas maksimal 10 MB"],
  [/unexpected field|too many files/i, "attachments", "Nota maksimal 3 berkas"],
];

export function serverFieldError(message: string) {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

const REASON_MIN = 1;
const REASON_LIMIT = 250;

export const waiveSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(REASON_MIN, "Tulis alasan pembebasannya")
    .max(REASON_LIMIT, `Alasan maksimal ${REASON_LIMIT} karakter`),
});

export type WaiveValues = z.infer<typeof waiveSchema>;

// Menyebut komisi DAN bulannya, supaya tidak ada yang salah kira pembebasan
// ini global. Satu pembebasan = satu komisi, satu bulan.
export const waiveText = (bapelName: string, label: string) =>
  `Pencairan ${bapelName} bulan ${label} akan dibebaskan walaupun laporan pemakaiannya belum disetujui. Tulis alasannya — alasan ini tersimpan dan terlihat di laporan badan pelayanan.`;

export type ErrorFix = { menu: MenuSlug; href: string; label: string };

const ERROR_FIX: Record<string, ErrorFix> = {
  PERIOD_NOT_OPEN: {
    menu: MENU.PERIODE_FISKAL,
    href: PERIOD_PATH,
    label: "Buka periode fiskal",
  },
  PERIOD_CLOSED: {
    menu: MENU.PERIODE_FISKAL,
    href: PERIOD_PATH,
    label: "Lihat Periode Fiskal",
  },
  PERIOD_CLOSED_UNDER_LOCK: {
    menu: MENU.PERIODE_FISKAL,
    href: PERIOD_PATH,
    label: "Lihat Periode Fiskal",
  },
  ACCOUNT_INACTIVE: {
    menu: MENU.AKUN,
    href: ACCOUNT_PATH,
    label: "Lihat Akun",
  },
  // Tanpa tautan tetap: `errorFixOf` menggantinya dengan tautan tersaring
  // komisi + bulan begitu pemanggilnya tahu dokumennya.
  BUDGET_REPORT_PENDING: {
    menu: MENU.LAPORAN_BUDGET,
    href: REPORT_PATH,
    label: "Lihat Laporan Budget",
  },
};

export const errorFixOf = (error: unknown): ErrorFix | null =>
  error instanceof FetchError && error.code
    ? (ERROR_FIX[error.code] ?? null)
    : null;
