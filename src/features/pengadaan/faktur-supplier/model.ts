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
  InvoiceItemPayload,
  InvoicePayload,
  InvoiceStatus,
  OrderItemOption,
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

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Supplier Invoice.";

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

/** Sama dengan `MAX_LINES` di server. */
export const MAX_ITEMS = 50;

export const ITEM_NOTE =
  "Dipakai saat faktur diposting ke jurnal: tiap baris didebit ke akunnya sendiri. Satu faktur bisa berisi kendaraan dan kertas ATK sekaligus, dan satu akun untuk keduanya salah di neraca. Jumlah rincian harus sama dengan total faktur.";

const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Isi nama rincian")
    .max(150, "Nama rincian maksimal 150 karakter"),
  amountForeign: z.string().min(1, "Isi nominal rincian"),
  accountId: z.string().min(1, "Pilih akun"),
  purchaseOrderItemId: z.string(),
});

export type InvoiceItemValues = z.infer<typeof itemSchema>;

/**
 * Rincian pesanan menjadi rincian faktur.
 *
 * Nominalnya diambil dari pesanan dan tetap bisa diubah: faktur supplier
 * seringkali tidak sama dengan pesanannya, dan yang berlaku adalah angka di
 * kertas supplier.
 *
 * Akunnya SARAN dari tipe barangnya, dan kosong bila tipe itu belum punya
 * akun — field-nya tetap wajib diisi. Menebak akun atas nama bendahara akan
 * membebankan kendaraan ke alat tulis tanpa ada yang memilihnya.
 */
export const orderItemsToForm = (
  rows: readonly OrderItemOption[],
): InvoiceItemValues[] =>
  rows.map((row) => ({
    name: row.name,
    amountForeign: row.amount,
    accountId: row.suggestedAccountId ? String(row.suggestedAccountId) : "",
    purchaseOrderItemId: String(row.id),
  }));

export const emptyInvoiceItem = (): InvoiceItemValues => ({
  name: "",
  amountForeign: "",
  accountId: "",
  purchaseOrderItemId: "",
});

/**
 * Jumlah rincian, dalam satuan terkecil mata uangnya (empat desimal), supaya
 * tidak pernah lewat float.
 *
 * `Number` di sini akan membuat 9.500.000,1 + 500.000,2 terbaca tidak sama
 * dengan 10.000.000,3, dan form menolak faktur yang sebenarnya pas.
 */
const toUnits = (value: string) => {
  const [whole = "0", fraction = ""] = String(value ?? "0").split(".");
  const sign = whole.trim().startsWith("-") ? BigInt(-1) : BigInt(1);

  return (
    sign *
    (BigInt(whole.replace(/\D/g, "") || "0") * BigInt(10_000) +
      BigInt(`${fraction}0000`.slice(0, 4)))
  );
};

export const itemsSum = (items: readonly { amountForeign: string }[]) =>
  items.reduce((total, item) => total + toUnits(item.amountForeign), BigInt(0));

const UNITS = BigInt(10_000);

/**
 * Satuan terkecil kembali menjadi angka desimal, untuk ditampilkan.
 *
 * `sumAmounts` di `lib/number` tidak dipakai di sini karena ia bekerja dalam
 * sen: nominal rincian boleh empat desimal — mata uang asing — dan sen akan
 * memotongnya, sehingga ringkasan di layar tidak sama dengan yang dikirim.
 */
export const unitsToText = (units: bigint) => {
  const sign = units < BigInt(0) ? "-" : "";
  const abs = units < BigInt(0) ? -units : units;
  const fraction = (abs % UNITS).toString().padStart(4, "0").replace(/0+$/, "");

  return `${sign}${abs / UNITS}${fraction ? `.${fraction}` : ""}`;
};

/** Jumlah rincian sebagai teks, dalam mata uang fakturnya. */
export const itemsSumText = (items: readonly { amountForeign: string }[]) =>
  unitsToText(itemsSum(items));

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
    items: z.array(itemSchema).max(MAX_ITEMS, `Maksimal ${MAX_ITEMS} rincian`),
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

    values.items.forEach((item, index) => {
      if (item.amountForeign && Number(item.amountForeign) <= 0) {
        addIssue(
          `items.${index}.amountForeign`,
          "Nominal rincian harus lebih dari 0",
        );
      }
    });

    // Diperiksa di sini juga, bukan hanya di server: total adalah angka di
    // kertas supplier dan rincian adalah bacaan seseorang atasnya, jadi
    // selisihnya ketahuan sebelum tombol Simpan ditekan.
    if (
      values.items.length &&
      itemsSum(values.items) !== toUnits(values.totalForeignCurrency)
    ) {
      addIssue("items", "Jumlah rincian harus sama dengan total faktur");
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
  items: [],
});

/** `""` berarti belum dipilih, dan server menyimpannya sebagai null. */
const optionalId = (value: string): number | null =>
  value === "" ? null : Number(value);

const toItemPayload = (item: InvoiceItemValues): InvoiceItemPayload => ({
  name: item.name.trim(),
  amountForeign: Number(item.amountForeign),
  accountId: Number(item.accountId),
  purchaseOrderItemId: optionalId(item.purchaseOrderItemId),
});

export const toInvoicePayload = (
  values: InvoiceFormValues,
): InvoicePayload => ({
  supplierInvoiceNumber: values.supplierInvoiceNumber.trim(),
  supplierId: Number(values.supplierId),
  // Ketiganya SELALU dikirim, termasuk saat null: server membedakan null
  // (kosongkan) dari field yang tidak dikirim (biarkan apa adanya).
  purchaseOrderId: optionalId(values.purchaseOrderId),
  // Akun header hanya berarti bagi faktur tanpa rincian, dan server menolak
  // keduanya terisi sekaligus. Layarnya menyembunyikan field ini begitu ada
  // rincian, jadi tidak ada pilihan yang dibuang tanpa terlihat.
  expenseAccountId: values.items.length
    ? null
    : optionalId(values.expenseAccountId),
  invoiceDate: values.invoiceDate,
  dueDate: values.dueDate,
  currencyCode: values.currencyCode,
  totalForeignCurrency: Number(values.totalForeignCurrency),
  items: values.items.map(toItemPayload),
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
  items: invoice.items.map((item) => ({
    name: item.name,
    amountForeign: item.amountForeign,
    accountId: String(item.accountId),
    purchaseOrderItemId: item.purchaseOrderItemId
      ? String(item.purchaseOrderItemId)
      : "",
  })),
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
  [/jumlah rincian harus sama/i, "items"],
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
