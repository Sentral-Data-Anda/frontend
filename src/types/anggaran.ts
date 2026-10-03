export const PROGRAM_STATUSES = ["DRAFT", "APPROVED", "CANCELLED"] as const;

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  DRAFT: "Draf",
  APPROVED: "Disetujui",
  CANCELLED: "Dibatalkan",
};

export const BUDGET_REPORT_STATUSES = ["DRAFT", "APPROVED"] as const;

export type BudgetReportStatus = (typeof BUDGET_REPORT_STATUSES)[number];

export const BUDGET_REPORT_STATUS_LABEL: Record<BudgetReportStatus, string> = {
  DRAFT: "Draf",
  APPROVED: "Disetujui",
};

export const COMPLIANCE_STATES = [
  "APPROVED",
  "DRAFT",
  "MISSING",
  "NOT_DUE",
  "WAIVED",
] as const;

export type ComplianceState = (typeof COMPLIANCE_STATES)[number];

export const COMPLIANCE_STATE_LABEL: Record<ComplianceState, string> = {
  APPROVED: "Disetujui",
  DRAFT: "Draf",
  MISSING: "Belum lapor",
  NOT_DUE: "Tidak wajib lapor",
  WAIVED: "Dibebaskan",
};

export type BapelRef = {
  publicId: string;
  code: string;
  name: string;
};

export type ProgramRef = {
  publicId: string;
  code: string;
  name: string;
};

// Label tahun pelayanan diturunkan dari setelan bulan mulai, jadi klien tidak
// boleh merakitnya: dua lapis yang menghitung sendiri akan berbeda pendapat
// soal arti "2027". `label` datang dari server dan dipakai apa adanya.
export type BudgetYear = {
  year: number;
  startMonth: number;
  from: string;
  to: string;
  label: string;
};

// Satu bentuk untuk pagu terpakai, dipakai store mock dan layar. `ceiling`
// null berarti penolakan, bukan tanpa batas. `untagged` tidak opsional:
// field opsional adalah field yang akan dihilangkan dari tampilan, dan
// angka per komisi tanpa sisa tak-bertandanya terbaca sebagai keseluruhan.
export type CeilingUsage = {
  year: number;
  ceiling: string | null;
  committed: string;
  remaining: string | null;
  isWithinCeiling: boolean;
  disbursed: string;
  reported: string;
  untagged: string;
};

// Orang selalu `{ name } | null` di setiap bacaan grup ini, tanpa pengecualian.
export type GateWaiver = {
  reason: string;
  createdBy: { name: string } | null;
  createdAt: string;
};

export const ANGGARAN_ERROR_CODES = [
  "BUDGET_YEAR_LOCKED",
  "CEILING_IN_USE",
  "CEILING_MISSING",
  "CEILING_EXCEEDED",
  "ACCOUNT_INACTIVE",
  "PROGRAM_FOREIGN_BAPEL",
  "NO_WORKFLOW",
  "NO_POSITION_HOLDER",
  "UNDER_APPROVAL",
  "ALREADY_APPROVED",
  "BUDGET_REPORT_PENDING",
] as const;

export type AnggaranErrorCode = (typeof ANGGARAN_ERROR_CODES)[number];

export const isAnggaranErrorCode = (
  code: string | null,
): code is AnggaranErrorCode =>
  code !== null && (ANGGARAN_ERROR_CODES as readonly string[]).includes(code);
