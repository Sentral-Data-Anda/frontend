import { z } from "zod";

import { MENU, createHref, detailHref, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { monthOptions, monthRange, todayJakarta } from "@/lib/date";
import { formatAmount } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";
import { type CashStatus } from "@/types/keuangan";

import type { Transfer, TransferAccountOption, TransferPayload } from "./types";

export const TRANSFER_LIST_PATH = menuHref(MENU.FINANCE, MENU.BANK_DEPOSIT);

export const TRANSFER_CREATE_PATH = createHref(MENU.FINANCE, MENU.BANK_DEPOSIT);

export const transferHref = (code: string) =>
  detailHref(MENU.FINANCE, MENU.BANK_DEPOSIT, code);

export const ACCOUNT_LIST_PATH = menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT);

export const ACCOUNT_CREATE_PATH = createHref(
  MENU.FINANCE,
  MENU.CHART_OF_ACCOUNT,
);

export const PERIOD_LIST_PATH = menuHref(MENU.FINANCE, MENU.FISCAL_PERIOD);

// Rute Jurnal hanya menerima publicId; kodenya untuk dibaca, bukan dirute.
export const journalHref = (publicId: string) =>
  detailHref(MENU.FINANCE, MENU.JOURNAL_ENTRY, publicId);

export const TRANSFER_INFO =
  "Setoran memindahkan uang antar akun gereja sendiri. Uangnya tidak bertambah dan tidak berkurang, jadi setoran tidak pernah muncul sebagai pengeluaran di laporan.";

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Bank Deposit.";

export const EMPTY_ACCOUNT_TITLE = "Belum ada akun kas atau bank";

export const EMPTY_ACCOUNT_DESCRIPTION =
  "Setoran memindahkan uang antar akun bertipe Aset. Buat akun kas dan akun banknya lebih dulu.";

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "PAID", label: "Disetor" },
  { value: "CANCELLED", label: "Dibatalkan" },
] satisfies { value: "" | CashStatus; label: string }[];

export const STATUS_VARIANT = {
  DRAFT: "draft",
  APPROVED: "wait",
  PAID: "success",
  CANCELLED: "neutral",
} as const satisfies Record<CashStatus, string>;

export const MONTH_ALL = "semua";

export const monthFilterOptions = () => [
  { value: "", label: "Bulan ini" },
  { value: MONTH_ALL, label: "Semua bulan" },
  ...monthOptions(),
];

export function toTransferApiFilters(filters: Record<string, string>) {
  const month = filters.bulan ?? "";

  return month === MONTH_ALL
    ? { startDate: "", endDate: "" }
    : monthRange(month || todayJakarta().slice(0, 7));
}

export const transferPathOf = (
  transfer: Pick<Transfer, "fromAccount" | "toAccount">,
) => `${transfer.fromAccount.name} → ${transfer.toAccount.name}`;

export const PREFILL_PARAM = { from: "dari", to: "ke" } as const;

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function pickAccountId(
  rows: readonly TransferAccountOption[],
  term: string,
) {
  const slug = toSlug(term);
  const found = slug
    ? rows.find((row) => toSlug(row.code) === slug || toSlug(row.name) === slug)
    : undefined;

  return found ? String(found.id) : "";
}

export const accountNameOf = (
  rows: readonly TransferAccountOption[],
  id: string,
) => rows.find((row) => String(row.id) === id)?.name ?? "akun";

const DESCRIPTION_MAX = 250;

const REFERENCE_MAX = 100;

export const REFERENCE_HINT = "Nomor slip setoran atau bukti transfer";

export const transferFormSchema = z
  .object({
    transferDate: z.string(),
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.string(),
    reference: z.string(),
    description: z.string(),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!values.transferDate) {
      addIssue("transferDate", "Isi tanggal setoran");
    } else if (values.transferDate > todayJakarta()) {
      addIssue("transferDate", "Tanggal setoran tidak boleh di masa depan");
    }

    if (!values.fromAccountId) addIssue("fromAccountId", "Pilih akun asal");

    if (!values.toAccountId) {
      addIssue("toAccountId", "Pilih akun tujuan");
    } else if (values.toAccountId === values.fromAccountId) {
      addIssue("toAccountId", "Akun tujuan harus berbeda dari akun asal");
    }

    if (Number(values.amount) <= 0) addIssue("amount", "Isi jumlah setoran");

    const description = collapseSpaces(values.description);

    if (!description) {
      addIssue("description", "Isi keterangan");
    } else if (description.length > DESCRIPTION_MAX) {
      addIssue(
        "description",
        `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
      );
    }

    if (values.reference.trim().length > REFERENCE_MAX) {
      addIssue("reference", `Referensi maksimal ${REFERENCE_MAX} karakter`);
    }
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const emptyTransferForm = (): TransferFormValues => ({
  transferDate: todayJakarta(),
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  reference: "",
  description: "",
});

export const toTransferPayload = (
  values: TransferFormValues,
): TransferPayload => ({
  transferDate: values.transferDate,
  fromAccountId: Number(values.fromAccountId),
  toAccountId: Number(values.toAccountId),
  amount: values.amount,
  description: collapseSpaces(values.description),
  reference: values.reference.trim() || null,
  bapelId: null,
});

export const saveTextOf = (
  rows: readonly TransferAccountOption[],
  values: TransferFormValues,
) =>
  `Apakah Anda ingin menyimpan pemindahan ${formatAmount(values.amount)} dari ${accountNameOf(rows, values.fromAccountId)} ke ${accountNameOf(rows, values.toAccountId)}? Pembukuannya baru dibuat saat Anda menekan Setor.`;

export const POST_TEXT =
  "Apakah Anda ingin menyetor pemindahan ini? Pemindahan dicatat dan pembukuannya dibuat. Setelah ini setoran tidak bisa diubah.";

export const CANCEL_TEXT =
  "Apakah Anda ingin membatalkan setoran ini? Pembukuannya dibalik dengan entri bertanggal hari ini, dan setoran ini tetap tersimpan sebagai riwayat.";

export const CANCEL_REASON_REQUIRED = "Isi alasan pembatalan";

export const CANCELLED_NOTE =
  "Setoran ini dibatalkan dan pembukuannya sudah dibalik dengan entri pembalik, jadi saldo kedua akun kembali seperti semula.";

const PERIOD_CODES = [
  "PERIOD_NOT_OPEN",
  "PERIOD_CLOSED",
  "PERIOD_CLOSED_UNDER_LOCK",
];

const codeOf = (error: unknown) =>
  error instanceof FetchError ? (error.code ?? "") : "";

export const isPeriodRejected = (error: unknown) =>
  PERIOD_CODES.includes(codeOf(error));

export const isAccountRejected = (error: unknown) =>
  codeOf(error) === "ACCOUNT_INACTIVE";

export const isReloadNeeded = (error: unknown) =>
  codeOf(error) === "PERIOD_CLOSED_UNDER_LOCK";

export function fixLinkOf(error: unknown) {
  if (isPeriodRejected(error)) {
    return { href: PERIOD_LIST_PATH, label: "Buka Periode Fiskal" };
  }
  if (isAccountRejected(error)) {
    return { href: ACCOUNT_LIST_PATH, label: "Buka Akun" };
  }

  return null;
}
