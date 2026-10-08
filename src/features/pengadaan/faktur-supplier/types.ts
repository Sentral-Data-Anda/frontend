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
  currencyCode: string;
  currency: CurrencyRef;
  exchangeRate: string;
  totalForeignCurrency: string;
  totalIDR: string;
  paidAmountIDR: string;
  payments: InvoicePayment[];
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
