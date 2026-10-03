import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import {
  monthOptions,
  monthRange,
  startOfMonth,
  todayJakarta,
} from "@/lib/date";
import { collapseSpaces } from "@/lib/name";
import { sumAmounts } from "@/lib/number";
import { CASH_RECEIPT_STATUS_LABEL, type CashStatus } from "@/types/keuangan";

import type { CashReceiptDetail, CashReceiptPayload } from "./types";

export const KAS_MASUK_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.KAS_MASUK);

export const KAS_MASUK_CREATE_PATH = createHref(MENU.KEUANGAN, MENU.KAS_MASUK);

export const GATEWAY_PARAM = "pencairan";

export const KAS_MASUK_GATEWAY_PATH = `${KAS_MASUK_CREATE_PATH}?${GATEWAY_PARAM}=1`;

export const receiptHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.KAS_MASUK, publicId);

export const receiptEditHref = (publicId: string) =>
  editHref(MENU.KEUANGAN, MENU.KAS_MASUK, publicId);

// Rute Jurnal hanya menerima publicId; kodenya untuk dibaca, bukan dirute.
export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const TEXT_LINK =
  "text-primary cursor-pointer rounded-sm underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

export const NOUN = "kas masuk";

export const TITLE = "Kas Masuk";

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Kas Masuk.";

export const EMPTY_TITLE = "Belum ada kas masuk";

export const EMPTY_DESCRIPTION =
  "Catat penerimaan di luar persembahan: sewa gedung, penjualan, pengembalian dana, dan pencairan persembahan online.";

export const PERSEMBAHAN_NOTE =
  "Persembahan yang sudah diposting tidak dicatat lagi di sini.";

export const GATEWAY_NOTE =
  "Nominal masuk ke bank = bruto dikurangi biaya. Baris biaya dicatat sebagai pos beban.";

export const GATEWAY_PAYER = "Payment gateway";

export const GATEWAY_GROSS_DESCRIPTION = "Persembahan online bruto";

export const GATEWAY_FEE_DESCRIPTION = "Biaya administrasi payment gateway";

export const GATEWAY_SETTING_KEY = "KAS_GATEWAY";

export const MAX_LINES = 50;

export const MONTH_ALL = "semua";

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "PAID", label: "Diterima" },
  { value: "CANCELLED", label: "Dibatalkan" },
] satisfies { value: "" | CashStatus; label: string }[];

export const STATUS_VARIANT = {
  DRAFT: "neutral",
  APPROVED: "wait",
  PAID: "success",
  CANCELLED: "neutral",
} as const satisfies Record<CashStatus, string>;

export const statusLabelOf = (status: CashStatus) =>
  CASH_RECEIPT_STATUS_LABEL[status];

export function monthFilterOptions(today: string = todayJakarta()) {
  const current = startOfMonth(today).slice(0, 7);

  return [
    { value: "", label: "Bulan ini" },
    { value: MONTH_ALL, label: "Semua bulan" },
    ...monthOptions(today).filter((option) => option.value !== current),
  ];
}

export function toReceiptApiFilters(
  filters: Record<string, string>,
  today: string = todayJakarta(),
) {
  const bulan = filters.bulan ?? "";

  if (bulan === MONTH_ALL) return { startDate: "", endDate: "" };

  return monthRange(bulan || startOfMonth(today).slice(0, 7));
}

type FixLink = { menu: MenuSlug; href: string; label: string };

export const PERIOD_LINK: FixLink = {
  menu: MENU.PERIODE_FISKAL,
  href: menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL),
  label: "Buka bulannya di Periode Fiskal",
};

export const SETTING_LINK: FixLink = {
  menu: MENU.SETELAN_AKUNTANSI,
  href: menuHref(MENU.KEUANGAN, MENU.SETELAN_AKUNTANSI),
  label: "Isi Setelan Akuntansi",
};

export const ACCOUNT_LINK: FixLink = {
  menu: MENU.AKUN,
  href: menuHref(MENU.KEUANGAN, MENU.AKUN),
  label: "Lihat daftar Akun",
};

const FIX_LINK = new Map<string, FixLink>([
  ["PERIOD_NOT_OPEN", PERIOD_LINK],
  ["PERIOD_CLOSED", PERIOD_LINK],
  ["SETTING_EMPTY", SETTING_LINK],
  ["ACCOUNT_INACTIVE", ACCOUNT_LINK],
]);

export const fixLinkOf = (error: unknown) =>
  (error instanceof FetchError && error.code
    ? FIX_LINK.get(error.code)
    : undefined) ?? null;

export const isEditable = (status: CashStatus) => status === "DRAFT";

export const isReceivable = (status: CashStatus) => status === "DRAFT";

export const isCancellable = (status: CashStatus) => status === "PAID";

const PAYER_MAX = 150;
const DESCRIPTION_MAX = 250;
const METHOD_MAX = 30;
const REFERENCE_MAX = 100;

const lineSchema = z.object({
  accountId: z.string(),
  amount: z.string(),
  description: z.string(),
});

export type ReceiptLine = z.infer<typeof lineSchema>;

export const newReceiptLine = (description = ""): ReceiptLine => ({
  accountId: "",
  amount: "",
  description,
});

export const receiptFormSchema = z
  .object({
    receiptDate: z.string(),
    payer: z.string(),
    intoAccountId: z.string(),
    method: z.string(),
    reference: z.string(),
    bapelId: z.string(),
    description: z.string(),
    lines: z.array(lineSchema),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const payer = collapseSpaces(values.payer);
    const description = collapseSpaces(values.description);

    if (!values.receiptDate)
      addIssue(["receiptDate"], "Isi tanggal penerimaan");
    else if (values.receiptDate > todayJakarta()) {
      addIssue(["receiptDate"], "Tanggal penerimaan tidak boleh di masa depan");
    }

    if (!payer) addIssue(["payer"], "Isi nama pemberi atau pembayar");
    else if (payer.length > PAYER_MAX) {
      addIssue(["payer"], `Diterima dari maksimal ${PAYER_MAX} karakter`);
    }

    if (!values.intoAccountId) {
      addIssue(["intoAccountId"], "Pilih akun yang menerima uangnya");
    }

    if (values.method.trim().length > METHOD_MAX) {
      addIssue(["method"], `Metode maksimal ${METHOD_MAX} karakter`);
    }
    if (values.reference.trim().length > REFERENCE_MAX) {
      addIssue(["reference"], `Referensi maksimal ${REFERENCE_MAX} karakter`);
    }

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
      addIssue(["lines"], `Maksimal ${MAX_LINES} baris per kas masuk`);
    }

    values.lines.forEach((line, index) => {
      const at = (field: keyof ReceiptLine) => ["lines", index, field];

      if (!line.accountId) addIssue(at("accountId"), "Pilih pos");
      if (!(Number(line.amount) > 0)) addIssue(at("amount"), "Isi nominal");
      if (collapseSpaces(line.description).length > DESCRIPTION_MAX) {
        addIssue(
          at("description"),
          `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
        );
      }
    });
  });

export type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

export const emptyReceiptForm = (): ReceiptFormValues => ({
  receiptDate: todayJakarta(),
  payer: "",
  intoAccountId: "",
  method: "",
  reference: "",
  bapelId: "",
  description: "",
  lines: [newReceiptLine()],
});

export const gatewayReceiptForm = (
  gatewayAccountId: number | null,
): ReceiptFormValues => ({
  ...emptyReceiptForm(),
  payer: GATEWAY_PAYER,
  description: "Pencairan persembahan online dari payment gateway",
  lines: [
    {
      accountId: gatewayAccountId === null ? "" : String(gatewayAccountId),
      amount: "",
      description: GATEWAY_GROSS_DESCRIPTION,
    },
    newReceiptLine(GATEWAY_FEE_DESCRIPTION),
  ],
});

export const toReceiptForm = (
  detail: CashReceiptDetail,
): ReceiptFormValues => ({
  receiptDate: detail.receiptDate.slice(0, 10),
  payer: detail.payer,
  intoAccountId: String(detail.intoAccountId),
  method: detail.method ?? "",
  reference: detail.reference ?? "",
  bapelId: detail.bapel === null ? "" : String(detail.bapel.id),
  description: detail.description,
  lines: detail.lines.map((line) => ({
    accountId: String(line.accountId),
    amount: line.amount,
    description: line.description ?? "",
  })),
});

const orNull = (value: string) => {
  const text = collapseSpaces(value);

  return text ? text : null;
};

export const toReceiptPayload = (
  values: ReceiptFormValues,
): CashReceiptPayload => ({
  receiptDate: values.receiptDate,
  description: collapseSpaces(values.description),
  payer: collapseSpaces(values.payer),
  intoAccountId: Number(values.intoAccountId),
  bapelId: values.bapelId ? Number(values.bapelId) : null,
  method: orNull(values.method),
  reference: orNull(values.reference),
  lines: values.lines.map((line) => ({
    accountId: Number(line.accountId),
    amount: Number(line.amount),
    description: orNull(line.description),
  })),
});

export const linesTotalOf = (lines: readonly ReceiptLine[]) =>
  sumAmounts(lines.map((line) => line.amount));
