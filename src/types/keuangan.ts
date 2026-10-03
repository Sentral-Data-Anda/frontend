export const ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  ASSET: "Aset",
  LIABILITY: "Kewajiban",
  EQUITY: "Ekuitas",
  INCOME: "Pendapatan",
  EXPENSE: "Beban",
};

export const JOURNAL_STATUSES = ["DRAFT", "POSTED", "REVERSED"] as const;

export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

export const JOURNAL_STATUS_LABEL: Record<JournalStatus, string> = {
  DRAFT: "Draf",
  POSTED: "Diposting",
  REVERSED: "Dibalik",
};

// Rujukan entri jurnal dari sebuah dokumen. Satu tipe dipakai store mock dan
// setiap fitur yang menautkannya: rute Jurnal hanya menerima publicId, jadi
// menghilangkannya di salah satu sisi harus gagal di tsc, bukan di peramban.
export type JournalRef = {
  publicId: string;
  code: string;
  status: JournalStatus;
};

export const PERIOD_STATUSES = ["OPEN", "CLOSED"] as const;

export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  OPEN: "Terbuka",
  CLOSED: "Tertutup",
};

export const PERSEMBAHAN_STATUSES = ["ACTIVE", "VOID"] as const;

export type PersembahanStatus = (typeof PERSEMBAHAN_STATUSES)[number];

export const PERSEMBAHAN_STATUS_LABEL: Record<PersembahanStatus, string> = {
  ACTIVE: "Aktif",
  VOID: "Dibatalkan",
};

export const CASH_STATUSES = [
  "DRAFT",
  "APPROVED",
  "PAID",
  "CANCELLED",
] as const;

export type CashStatus = (typeof CASH_STATUSES)[number];

export const CASH_RECEIPT_STATUS_LABEL: Record<CashStatus, string> = {
  DRAFT: "Draf",
  APPROVED: "Disetujui",
  PAID: "Diterima",
  CANCELLED: "Dibatalkan",
};

export const CASH_EXPENSE_STATUS_LABEL: Record<CashStatus, string> = {
  DRAFT: "Draf",
  APPROVED: "Disetujui",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

export const CASH_TRANSFER_STATUS_LABEL: Record<CashStatus, string> = {
  DRAFT: "Draf",
  APPROVED: "Disetujui",
  PAID: "Disetor",
  CANCELLED: "Dibatalkan",
};

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "CANCELLED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

export const RECEIVE_METHODS = [
  "TUNAI",
  "TRANSFER",
  "PAYMENT_GATEWAY",
] as const;

export type ReceiveMethod = (typeof RECEIVE_METHODS)[number];

export const RECEIVE_METHOD_LABEL: Record<ReceiveMethod, string> = {
  TUNAI: "Tunai",
  TRANSFER: "Transfer",
  PAYMENT_GATEWAY: "Pembayaran online",
};

// Label setiap kunci milik be-sada dan dibaca dari bacaan, bukan dari peta di sini.
export const ACCOUNTING_SETTING_KEYS = [
  "PERSEMBAHAN_KAS",
  "PERSEMBAHAN_BANK",
  "KAS_GATEWAY",
  "PENDAPATAN_EVENT",
  "PENYUSUTAN_BEBAN",
  "PENYUSUTAN_AKUMULASI",
] as const;

export type AccountingSettingKey = (typeof ACCOUNTING_SETTING_KEYS)[number];
