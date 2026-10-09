import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { todayJakarta } from "@/lib/date";

import type {
  Invoice,
  InvoicePayload,
  InvoiceStatus,
  PaymentPayload,
} from "./types";

export const INVOICE_LIST_PATH = menuHref(
  MENU.PROCUREMENT,
  MENU.SUPPLIER_INVOICE,
);

export const INVOICE_CREATE_PATH = createHref(
  MENU.PROCUREMENT,
  MENU.SUPPLIER_INVOICE,
);

export const invoiceHref = (publicId: string) =>
  detailHref(MENU.PROCUREMENT, MENU.SUPPLIER_INVOICE, publicId);

export const invoiceEditHref = (publicId: string) =>
  editHref(MENU.PROCUREMENT, MENU.SUPPLIER_INVOICE, publicId);

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Faktur Supplier.";

export const EMPTY_TITLE = "Belum ada faktur supplier";

export const EMPTY_DESCRIPTION =
  "Tagihan yang datang dari pemasok dicatat di sini, lalu dilunasi sebagian atau sekaligus.";

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "AWAITING_PAYMENT", label: "Menunggu" },
  { value: "PARTIALLY_PAID", label: "Sebagian" },
  { value: "PAID", label: "Lunas" },
  { value: "CANCELLED", label: "Batal" },
] satisfies { value: "" | InvoiceStatus; label: string }[];

export const STATUS_VARIANT: Record<
  InvoiceStatus,
  "draft" | "warning" | "success" | "destructive"
> = {
  DRAFT: "draft",
  AWAITING_PAYMENT: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CANCELLED: "destructive",
};

/** Hanya draf yang bisa diubah; itu aturan server, dicerminkan di layar. */
export const isEditable = (invoice: Invoice) => invoice.status === "DRAFT";

/** Terbitkan hanya dari draf. */
export const isIssuable = (invoice: Invoice) => invoice.status === "DRAFT";

/** Bisa dibayar selama belum lunas dan belum batal. */
export const isPayable = (invoice: Invoice) =>
  invoice.status === "AWAITING_PAYMENT" || invoice.status === "PARTIALLY_PAID";

/**
 * Sebuah faktur yang sudah punya pembayaran tidak bisa dibatalkan atau
 * dihapus — server menolaknya, dan tombol yang pasti ditolak hanya mengajari
 * orang bahwa tombol di layar ini kadang tidak berarti apa-apa.
 */
export const isRetractable = (invoice: { payments: unknown[] }) =>
  invoice.payments.length === 0;

/**
 * Sisa yang belum dibayar, dalam sen, supaya tidak pernah lewat float.
 *
 * Decimal dari API berupa string. `Number` di sini akan membuat sisa 0 terbaca
 * sebagai 0.000000001 pada nominal besar, dan tombol Bayar tidak pernah hilang.
 */
const toCents = (value: string) => {
  const [whole = "0", fraction = ""] = String(value ?? "0").split(".");

  return (
    BigInt(whole.replace(/\D/g, "") || "0") * BigInt(100) +
    BigInt(`${fraction}00`.slice(0, 2))
  );
};

export const outstandingOf = (invoice: {
  totalIDR: string;
  paidAmountIDR: string;
}) => {
  const left = toCents(invoice.totalIDR) - toCents(invoice.paidAmountIDR);
  const cents = left > BigInt(0) ? left : BigInt(0);
  const digits = cents.toString().padStart(3, "0");
  const fraction = digits.slice(-2);

  return fraction === "00"
    ? digits.slice(0, -2)
    : `${digits.slice(0, -2)}.${fraction}`;
};

export const invoiceFormSchema = z
  .object({
    supplierInvoiceNumber: z
      .string()
      .trim()
      .min(1, "Isi nomor faktur dari supplier")
      .max(50, "Nomor faktur maksimal 50 karakter"),
    supplierId: z.string().min(1, "Pilih supplier"),
    purchaseOrderId: z.string(),
    expenseAccountId: z.string(),
    invoiceDate: z.string().min(1, "Isi tanggal faktur"),
    dueDate: z.string().min(1, "Isi jatuh tempo"),
    currencyCode: z.string().min(1, "Pilih mata uang"),
    totalForeignCurrency: z.string().min(1, "Isi total faktur"),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (values.dueDate && values.dueDate < values.invoiceDate) {
      addIssue("dueDate", "Jatuh tempo tidak boleh sebelum tanggal faktur");
    }

    if (Number(values.totalForeignCurrency) <= 0) {
      addIssue("totalForeignCurrency", "Total faktur harus lebih dari 0");
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const emptyInvoiceForm = (
  today = todayJakarta(),
): InvoiceFormValues => ({
  supplierInvoiceNumber: "",
  supplierId: "",
  purchaseOrderId: "",
  expenseAccountId: "",
  invoiceDate: today,
  dueDate: today,
  currencyCode: "IDR",
  totalForeignCurrency: "",
});

/** `""` berarti belum dipilih, dan server menyimpannya sebagai null. */
const optionalId = (value: string): number | null =>
  value === "" ? null : Number(value);

export const toInvoicePayload = (
  values: InvoiceFormValues,
): InvoicePayload => ({
  supplierInvoiceNumber: values.supplierInvoiceNumber.trim(),
  supplierId: Number(values.supplierId),
  // Ketiganya SELALU dikirim, termasuk saat null: server membedakan null
  // (kosongkan) dari field yang tidak dikirim (biarkan apa adanya).
  purchaseOrderId: optionalId(values.purchaseOrderId),
  expenseAccountId: optionalId(values.expenseAccountId),
  invoiceDate: values.invoiceDate,
  dueDate: values.dueDate,
  currencyCode: values.currencyCode,
  totalForeignCurrency: Number(values.totalForeignCurrency),
});

export const toInvoiceForm = (invoice: Invoice): InvoiceFormValues => ({
  supplierInvoiceNumber: invoice.supplierInvoiceNumber,
  supplierId: String(invoice.supplierId),
  purchaseOrderId: invoice.purchaseOrderId
    ? String(invoice.purchaseOrderId)
    : "",
  expenseAccountId: invoice.expenseAccountId
    ? String(invoice.expenseAccountId)
    : "",
  invoiceDate: invoice.invoiceDate.slice(0, 10),
  dueDate: invoice.dueDate.slice(0, 10),
  currencyCode: invoice.currencyCode,
  totalForeignCurrency: invoice.totalForeignCurrency,
});

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof InvoiceFormValues, string?]
> = [
  [
    /nomor faktur ini sudah tercatat/i,
    "supplierInvoiceNumber",
    "Nomor faktur ini sudah tercatat untuk supplier tersebut.",
  ],
  [/jatuh tempo/i, "dueDate"],
  [/pesanan pembelian/i, "purchaseOrderId"],
  // Akun beban dikirim server dengan path-nya di `issues`, jadi tidak ditebak
  // di sini: menebak akan menyorot picker yang keliru.
];

export function serverFieldError(
  message: string,
): { field: keyof InvoiceFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}

export const paymentSchema = z.object({
  paymentDate: z.string().min(1, "Isi tanggal pembayaran"),
  amountIDR: z.string().min(1, "Isi nominal pembayaran"),
  accountId: z.string().min(1, "Pilih akun kas"),
  method: z.string(),
  reference: z.string(),
  note: z.string(),
});

export type PaymentValues = z.infer<typeof paymentSchema>;

export const emptyPaymentForm = (
  amountIDR: string,
  today = todayJakarta(),
): PaymentValues => ({
  paymentDate: today,
  // Sisa tagihan sebagai bawaan: pelunasan penuh adalah hal yang paling sering
  // terjadi, dan mengetik ulang angka besar adalah cara salah ketik masuk.
  amountIDR,
  accountId: "",
  method: "",
  reference: "",
  note: "",
});

/** `""` dikirim sebagai null, bukan string kosong. */
const optionalText = (value: string): string | null =>
  value.trim() === "" ? null : value.trim();

export const toPaymentPayload = (values: PaymentValues): PaymentPayload => ({
  paymentDate: values.paymentDate,
  amountIDR: Number(values.amountIDR),
  accountId: Number(values.accountId),
  method: optionalText(values.method),
  reference: optionalText(values.reference),
  note: optionalText(values.note),
});
