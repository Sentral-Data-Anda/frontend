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

// Jawaban pertanyaan "belanja komisi?" di Kas Keluar. Satu bentuk untuk dua
// lapis, alasan yang sama dengan `CashStatus`: store mock dan layar sama-sama
// mengimpornya, jadi menambah anggota ketiga harus gagal di tsc dan di parse
// payload sekaligus — bukan lolos di salah satunya.
//
// Ejaannya nama enum, bukan kebab, dan ia sama di tulis maupun baca. Server
// SELALU memancarkan `BUKAN_KOMISI` pada bacaan; selama validatornya menerima
// kebab dan sebuah ternary menerjemahkannya, klien yang mengirim balik apa yang
// baru saja ia baca ditolak oleh field tempat ia membacanya. Ia juga
// satu-satunya penyimpang dari sebelas `z.enum` di API ini — `status` di
// endpoint yang sama memakai nama enum di kedua arah.
//
// `null` BUKAN anggota union ini: ia berarti baris yang ditulis sebelum
// pertanyaannya ada, dan tiap pemakai menuliskannya sendiri (`BapelChoice |
// null`) supaya "belum pernah ditanya" tidak pernah terbaca sebagai jawaban.
export const BAPEL_CHOICES = ["KOMISI", "BUKAN_KOMISI"] as const;

export type BapelChoice = (typeof BAPEL_CHOICES)[number];

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
  "QRIS",
  "PAYMENT_GATEWAY",
] as const;

export type ReceiveMethod = (typeof RECEIVE_METHODS)[number];

export const RECEIVE_METHOD_LABEL: Record<ReceiveMethod, string> = {
  TUNAI: "Tunai",
  TRANSFER: "Transfer",
  // "QRIS gereja", bukan "QRIS": yang ini papan QR statis milik gereja yang
  // dicatat tangan. Pembayaran online juga lewat QRIS, dan dua pilihan yang
  // sama-sama berbunyi "QRIS" akan dipilih bergantian oleh orang yang berbeda.
  QRIS: "QRIS gereja",
  PAYMENT_GATEWAY: "Pembayaran online",
};

// Label setiap kunci milik be-sada dan dibaca dari bacaan, bukan dari peta di sini.
export const ACCOUNTING_SETTING_KEYS = [
  "PERSEMBAHAN_KAS",
  "PERSEMBAHAN_BANK",
  "PERSEMBAHAN_QRIS",
  "KAS_GATEWAY",
  "PENDAPATAN_EVENT",
  "PENYUSUTAN_BEBAN",
  "PENYUSUTAN_AKUMULASI",
  "GAJI_BEBAN",
  "GAJI_KAS",
  "SUMBANGAN_ASET",
  "ASET_TETAP",
  "HUTANG_SUPPLIER",
  "BEBAN_PENGADAAN",
  "PERSEDIAAN",
  "BEBAN_PERSEDIAAN",
] as const;

export type AccountingSettingKey = (typeof ACCOUNTING_SETTING_KEYS)[number];
