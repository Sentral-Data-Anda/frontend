export const INVOICE_STATUS_LABEL = {
  DRAFT: "Draf",
  AWAITING_PAYMENT: "Menunggu pembayaran",
  PARTIALLY_PAID: "Dibayar sebagian",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
} as const;

export type InvoiceStatus = keyof typeof INVOICE_STATUS_LABEL;

export type NamedRef = { publicId: string; code: string; name: string };

export type CurrencyRef = { code: string; name: string; symbol: string };

export type InvoiceOrderRef = {
  publicId: string;
  code: string;
  status: string;
};

export type InvoiceOrderItemRef = {
  publicId: string;
  name: string;
  quantity: number;
  unitPrice: string;
};

/**
 * Satu baris faktur: apa yang dibeli, berapa, dan ke akun mana dibebankan.
 *
 * `amountIDR` dibekukan server di kurs tanggal faktur, dan jumlah seluruh
 * baris selalu sama dengan `totalIDR` header karena baris terakhir menyerap
 * selisih pembulatannya.
 */
export type InvoiceItem = {
  publicId: string;
  name: string;
  amountForeign: string;
  amountIDR: string;
  accountId: number;
  account: NamedRef;
  purchaseOrderItemId: number | null;
  purchaseOrderItem: InvoiceOrderItemRef | null;
};

export type InvoicePayment = {
  publicId: string;
  code: string;
  paymentDate: string;
  amountIDR: string;
  accountId: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  account: NamedRef;
};

export type Invoice = {
  publicId: string;
  code: string;
  supplierInvoiceNumber: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  supplierId: number;
  supplier: NamedRef;
  purchaseOrderId: number | null;
  purchaseOrder: InvoiceOrderRef | null;
  /**
   * Ke mana faktur ini dibebankan. Null berarti belum dipilih, dan posting
   * jatuh ke kunci Beban Pengadaan.
   */
  expenseAccountId: number | null;
  expenseAccount: NamedRef | null;
  /**
   * Rincian faktur, kalau ada. Kosong berarti faktur ini dibebankan ke satu
   * akun lewat `expenseAccountId` — bentuk setiap faktur yang tercatat sebelum
   * rincian ada.
   */
  items: InvoiceItem[];
  currencyCode: string;
  currency: CurrencyRef;
  exchangeRate: string;
  totalForeignCurrency: string;
  totalIDR: string;
  paidAmountIDR: string;
  payments: InvoicePayment[];
};

export type InvoiceItemPayload = {
  name: string;
  amountForeign: number;
  accountId: number;
  purchaseOrderItemId: number | null;
};

export type InvoicePayload = {
  supplierInvoiceNumber: string;
  supplierId: number;
  purchaseOrderId: number | null;
  expenseAccountId: number | null;
  invoiceDate: string;
  dueDate: string;
  currencyCode: string;
  totalForeignCurrency: number;
  items: InvoiceItemPayload[];
};

/**
 * Satu pesanan sebagai pilihan.
 *
 * TIDAK punya `name`, dan itulah sebabnya daftar ini tidak lewat
 * `useDdlOptions`: helper itu membuat label dari `row.name`, dan sebuah pesanan
 * tidak punya nama — yang membedakannya adalah kode dan suppliernya.
 */
export type OrderOption = {
  id: number;
  code: string;
  status: string;
  supplier: { id: number; name: string } | null;
  currencyCode: string;
};

/** Satu baris pesanan, untuk menyalin rinciannya ke faktur. */
export type OrderItemOption = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  amount: string;
  typeName: string;
  suggestedAccountId: number | null;
};

export type PaymentPayload = {
  paymentDate: string;
  amountIDR: number;
  accountId: number;
  method: string | null;
  reference: string | null;
  note: string | null;
};

export type InvoiceAction = "terbitkan" | "batal" | "hapus";
