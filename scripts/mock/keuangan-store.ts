/**
 * State mock bersama grup Keuangan (docs/design/keuangan/README.md §4a TL-3).
 * Larik diisi agent fitur saat runtime; bentuk tampilan dan aturan milik TL.
 * Bentuk respons = be-sada sesudah gap §7a. Chart of accounts di sini adalah
 * data uji, bukan usulan ke gereja (E1 milik bendahara).
 */
import { addDays, startOfMonth } from "../../src/lib/date";
import type {
  AccountType,
  AccountingSettingKey,
  JournalStatus,
  PeriodStatus,
} from "../../src/types/keuangan";
import { SESSION_USER_ID } from "../mock-dashboard";

import { TODAY, isLive, nextId } from "./fasilitas-store";
import { userNameOf } from "./inventaris-store";

export { TODAY, isLive, nextId, userNameOf };

const YEAR = Number(TODAY.slice(0, 4));
const MONTH = Number(TODAY.slice(5, 7));

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

const counters = new Map<string, number>();

export const codeOf = (prefix: string, options: { yearly?: boolean } = {}) => {
  const key = options.yearly ? `${prefix}-${YEAR}` : prefix;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);

  return `${key}-${pad(next)}`;
};

export const MONTH_LABEL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const monthLabel = (year: number, month: number) =>
  `${MONTH_LABEL[month - 1]} ${year}`;

// ---------------------------------------------------------------------------
// Akun. Dua tingkat; induk tidak menampung transaksi (dijaga bendahara, bukan
// sistem). Sepasang akun Dana Pembangunan menguji dana khusus tanpa dimensi baru.

export type AccountRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  isActive: boolean;
  deletedAt: string | null;
  hasJournal: boolean;
};

const account = (
  id: number,
  code: string,
  name: string,
  type: AccountType,
  parentAccountId: number | null,
  extra: Partial<AccountRow> = {},
): AccountRow => ({
  id,
  publicId: `acc-${pad(id)}`,
  code,
  name,
  type,
  parentAccountId,
  isActive: true,
  deletedAt: null,
  hasJournal: false,
  ...extra,
});

export const ACCOUNT: AccountRow[] = [
  account(1, "1", "Aset", "ASSET", null),
  account(2, "1-100", "Kas", "ASSET", 1, { hasJournal: true }),
  account(3, "1-110", "Kas Kecil", "ASSET", 1),
  account(4, "1-200", "Bank BCA", "ASSET", 1, { hasJournal: true }),
  account(5, "1-210", "Bank Mandiri Dana Pembangunan", "ASSET", 1),
  account(6, "1-300", "Kas di Payment Gateway", "ASSET", 1),
  account(7, "1-400", "Selisih Kas", "ASSET", 1),
  account(8, "1-500", "Aset Tetap", "ASSET", 1),
  account(9, "1-590", "Akumulasi Penyusutan", "ASSET", 1),
  account(10, "2", "Kewajiban", "LIABILITY", null),
  account(11, "2-100", "Hutang Usaha", "LIABILITY", 10),
  account(12, "2-200", "Dana Titipan", "LIABILITY", 10),
  account(13, "3", "Ekuitas", "EQUITY", null),
  account(14, "3-100", "Saldo Awal", "EQUITY", 13, { hasJournal: true }),
  account(15, "4", "Pendapatan", "INCOME", null),
  account(16, "4-100", "Persembahan Kolekte", "INCOME", 15, {
    hasJournal: true,
  }),
  account(17, "4-110", "Persembahan Perpuluhan", "INCOME", 15),
  account(18, "4-120", "Persembahan Syukur", "INCOME", 15),
  account(19, "4-130", "Persembahan Dana Pembangunan", "INCOME", 15),
  account(20, "4-200", "Sewa Gedung", "INCOME", 15),
  account(21, "5", "Beban", "EXPENSE", null),
  account(22, "5-100", "Beban Listrik dan Air", "EXPENSE", 21, {
    hasJournal: true,
  }),
  account(23, "5-110", "Beban Administrasi", "EXPENSE", 21),
  account(24, "5-120", "Beban Penyusutan", "EXPENSE", 21),
  account(25, "5-900", "Beban Lain-lain", "EXPENSE", 21, { isActive: false }),
  account(26, "5-910", "Pos Lama", "EXPENSE", 21, {
    deletedAt: `${addDays(TODAY, -90)}T02:00:00.000Z`,
  }),
];

export const accountOf = (id: number | null) =>
  id === null ? null : (ACCOUNT.find((row) => row.id === id) ?? null);

export const accountRef = (id: number | null) => {
  const row = accountOf(id);

  return row
    ? {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        isActive: row.isActive,
      }
    : null;
};

const parentRef = (parentAccountId: number | null) => {
  const parent = accountOf(parentAccountId);

  return parent
    ? {
        id: parent.id,
        code: parent.code,
        name: parent.name,
        type: parent.type,
      }
    : null;
};

export const accountView = (row: AccountRow, isDetail = false) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  type: row.type,
  parentAccountId: row.parentAccountId,
  parent: parentRef(row.parentAccountId),
  isActive: row.isActive,
  childCount: ACCOUNT.filter(
    (child) => isLive(child) && child.parentAccountId === row.id,
  ).length,
  ...(isDetail ? { hasJournalLines: row.hasJournal } : {}),
});

export const accountDdl = (params: URLSearchParams) => {
  const type = params.get("type");
  const filter = (params.get("filter") ?? "").toLowerCase();
  const limit = Number(params.get("limit")) || null;
  const rows = ACCOUNT.filter(
    (row) =>
      isLive(row) &&
      (!type || row.type === type) &&
      (!filter ||
        row.code.toLowerCase().includes(filter) ||
        row.name.toLowerCase().includes(filter)),
  ).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    isActive: row.isActive,
  }));

  return limit ? rows.slice(0, limit) : rows;
};

// ---------------------------------------------------------------------------
// Setelan akuntansi. Kunci lahir dari sync, bukan dari API: tanpa POST, tanpa
// DELETE. Dua terisi, tiga kosong — keadaan E3 yang sebenarnya.

export type SettingRow = {
  key: AccountingSettingKey;
  description: string;
  accountId: number | null;
  updatedById: number | null;
};

export const ACCOUNTING_SETTING: SettingRow[] = [
  {
    key: "PERSEMBAHAN_KAS",
    description: "Akun kas yang didebit saat persembahan tunai diposting",
    accountId: 2,
    updatedById: SESSION_USER_ID,
  },
  {
    key: "PERSEMBAHAN_BANK",
    description: "Akun bank yang didebit saat persembahan transfer diposting",
    accountId: 4,
    updatedById: SESSION_USER_ID,
  },
  {
    key: "PERSEMBAHAN_GATEWAY",
    description:
      "Akun penampung persembahan online yang belum cair dari payment gateway",
    accountId: null,
    updatedById: null,
  },
  {
    key: "PENDAPATAN_EVENT",
    description:
      "Akun pendapatan yang dikredit saat pembayaran pendaftaran event diposting",
    accountId: null,
    updatedById: null,
  },
  {
    key: "PENYUSUTAN_BEBAN",
    description: "Akun beban yang didebit saat penyusutan bulanan diposting",
    accountId: null,
    updatedById: null,
  },
  {
    key: "PENYUSUTAN_AKUMULASI",
    description:
      "Akun akumulasi penyusutan yang dikredit saat penyusutan diposting",
    accountId: null,
    updatedById: null,
  },
];

export const settingView = (row: SettingRow) => ({
  key: row.key,
  description: row.description,
  account: accountRef(row.accountId),
  updatedBy: userNameOf(row.updatedById),
});

export const settingAccountOf = (key: AccountingSettingKey) =>
  ACCOUNTING_SETTING.find((row) => row.key === key)?.accountId ?? null;

// ---------------------------------------------------------------------------
// Tipe persembahan. `accountId` adalah sisi KREDIT; sisi masuk datang dari
// setelan akuntansi sesuai cara terima.

export type TypePersembahanRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
  hasPeriod: boolean;
  requiresJemaat: boolean;
  accountId: number | null;
  deletedAt: string | null;
};

const offeringType = (
  id: number,
  name: string,
  accountId: number | null,
  extra: Partial<TypePersembahanRow> = {},
): TypePersembahanRow => ({
  id,
  publicId: `tps-${pad(id)}`,
  code: `TPS-${pad(id)}`,
  name,
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId,
  deletedAt: null,
  ...extra,
});

export const TYPE_PERSEMBAHAN: TypePersembahanRow[] = [
  offeringType(1, "Kolekte", 16),
  offeringType(2, "Perpuluhan", 17, { requiresJemaat: true }),
  offeringType(3, "Persembahan Bulanan", 17, {
    hasPeriod: true,
    requiresJemaat: true,
  }),
  offeringType(4, "Syukur", 18),
  offeringType(5, "Dana Pembangunan", 19),
  offeringType(6, "Persembahan Khusus", null),
];

export const typePersembahanOf = (id: number | null) =>
  id === null ? null : (TYPE_PERSEMBAHAN.find((row) => row.id === id) ?? null);

export const typePersembahanView = (row: TypePersembahanRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  isActive: row.isActive,
  hasPeriod: row.hasPeriod,
  requiresJemaat: row.requiresJemaat,
  accountId: row.accountId,
  account: accountRef(row.accountId),
});

export const typePersembahanDdl = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();

  return TYPE_PERSEMBAHAN.filter(
    (row) =>
      isLive(row) &&
      row.isActive &&
      (!filter || row.name.toLowerCase().includes(filter)),
  ).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    hasPeriod: row.hasPeriod,
    requiresJemaat: row.requiresJemaat,
    isActive: row.isActive,
  }));
};

// ---------------------------------------------------------------------------
// Periode fiskal. Dibuka setahun sekaligus; bentuk bacaan dipakai juga oleh
// widget kesiapan tutup buku di Beranda, jadi kuncinya tidak boleh berubah.

export type FiscalPeriodRow = {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  closedById: number | null;
  closedAt: string | null;
  reopenedById: number | null;
  reopenedAt: string | null;
  reopenReason: string | null;
};

const monthEnd = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

export const FISCAL_PERIOD: FiscalPeriodRow[] = Array.from(
  { length: 12 },
  (_, index) => {
    const month = index + 1;
    const isClosed = month < MONTH - 1;

    return {
      id: `fp-${YEAR}-${month}`,
      year: YEAR,
      month,
      status: (isClosed ? "CLOSED" : "OPEN") as PeriodStatus,
      closedById: isClosed ? SESSION_USER_ID : null,
      closedAt: isClosed ? `${monthEnd(YEAR, month)}T09:00:00.000Z` : null,
      reopenedById: null,
      reopenedAt: null,
      reopenReason: null,
    };
  },
);

const reopened = FISCAL_PERIOD.find(
  (row) => row.month === Math.max(1, MONTH - 2),
);

if (reopened) {
  reopened.reopenedById = SESSION_USER_ID;
  reopened.reopenedAt = `${addDays(TODAY, -6)}T04:00:00.000Z`;
  reopened.reopenReason = "Koreksi pencatatan kolekte yang tertukar tipenya.";
}

export const periodOf = (date: string) =>
  FISCAL_PERIOD.find(
    (row) =>
      row.year === Number(date.slice(0, 4)) &&
      row.month === Number(date.slice(5, 7)),
  ) ?? null;

export const periodView = (row: FiscalPeriodRow) => ({
  id: row.id,
  year: row.year,
  month: row.month,
  label: monthLabel(row.year, row.month),
  status: row.status,
  startDate: `${row.year}-${String(row.month).padStart(2, "0")}-01T00:00:00.000Z`,
  endDate: `${monthEnd(row.year, row.month)}T00:00:00.000Z`,
  closedBy: userNameOf(row.closedById),
  closedAt: row.closedAt,
  reopenedBy: userNameOf(row.reopenedById),
  reopenedAt: row.reopenedAt,
  reopenReason: row.reopenReason,
  draftCount: JOURNAL_ENTRY.filter(
    (entry) =>
      entry.status === "DRAFT" && periodOf(entry.entryDate)?.id === row.id,
  ).length,
});

// ---------------------------------------------------------------------------
// Jurnal. Entri ditulis utuh; tidak ada satu pun jalur yang menyentuh satu baris.

export type JournalLineRow = {
  id: number;
  accountId: number;
  debit: string;
  credit: string;
  description: string | null;
};

export type JournalEntryRow = {
  id: number;
  publicId: string;
  code: string;
  entryDate: string;
  description: string;
  status: JournalStatus;
  sourceType: string;
  sourceId: number | null;
  reversalOfId: number | null;
  postedById: number | null;
  postedAt: string | null;
  lines: JournalLineRow[];
};

const line = (
  id: number,
  accountId: number,
  debit: string,
  credit: string,
  description: string | null = null,
): JournalLineRow => ({ id, accountId, debit, credit, description });

export const JOURNAL_ENTRY: JournalEntryRow[] = [
  {
    id: 1,
    publicId: "jrn-0001",
    code: `JRN-${YEAR}-0001`,
    entryDate: `${YEAR}-01-01`,
    description: "Saldo awal per 1 Januari",
    status: "POSTED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: `${YEAR}-01-01T03:00:00.000Z`,
    lines: [
      line(1, 2, "4500000", "0", "Kas di brankas"),
      line(2, 4, "78250000", "0", "Rekening BCA"),
      line(3, 14, "0", "82750000", "Saldo awal"),
    ],
  },
  {
    id: 2,
    publicId: "jrn-0002",
    code: `JRN-${YEAR}-0002`,
    entryDate: addDays(TODAY, -9),
    description: "Persembahan kolekte 7 September",
    status: "POSTED",
    sourceType: "PERSEMBAHAN",
    sourceId: 1,
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: `${addDays(TODAY, -8)}T02:00:00.000Z`,
    lines: [
      line(4, 2, "6420000", "0", null),
      line(5, 16, "0", "6420000", null),
    ],
  },
  {
    id: 3,
    publicId: "jrn-0003",
    code: `JRN-${YEAR}-0003`,
    entryDate: addDays(TODAY, -4),
    description: "Biaya listrik September",
    status: "DRAFT",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: null,
    postedById: null,
    postedAt: null,
    lines: [
      line(6, 22, "1850000", "0", "PLN September"),
      line(7, 2, "0", "1850000", null),
    ],
  },
  {
    id: 4,
    publicId: "jrn-0004",
    code: `JRN-${YEAR}-0004`,
    entryDate: addDays(TODAY, -2),
    description: "Koreksi kas kecil",
    status: "DRAFT",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: null,
    postedById: null,
    postedAt: null,
    lines: [line(8, 3, "500000", "0", null), line(9, 2, "0", "450000", null)],
  },
  {
    id: 5,
    publicId: "jrn-0005",
    code: `JRN-${YEAR}-0005`,
    entryDate: addDays(TODAY, -20),
    description: "Sewa gedung keliru dicatat",
    status: "REVERSED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: `${addDays(TODAY, -20)}T04:00:00.000Z`,
    lines: [
      line(10, 2, "2000000", "0", null),
      line(11, 20, "0", "2000000", null),
    ],
  },
  {
    id: 6,
    publicId: "jrn-0006",
    code: `JRN-${YEAR}-0006`,
    entryDate: addDays(TODAY, -18),
    description: "Pembalikan JRN sewa gedung",
    status: "POSTED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: 5,
    postedById: SESSION_USER_ID,
    postedAt: `${addDays(TODAY, -18)}T04:00:00.000Z`,
    lines: [
      line(12, 20, "2000000", "0", null),
      line(13, 2, "0", "2000000", null),
    ],
  },
];

const totalOf = (lines: JournalLineRow[], side: "debit" | "credit") =>
  lines.reduce((total, row) => total + Number(row[side]), 0);

export const journalRef = (entryId: number | null) => {
  const entry =
    entryId === null
      ? null
      : (JOURNAL_ENTRY.find((row) => row.id === entryId) ?? null);

  return entry ? { code: entry.code, status: entry.status } : null;
};

export const journalView = (row: JournalEntryRow, isDetail = false) => {
  const period = periodOf(row.entryDate);
  const reversedBy = JOURNAL_ENTRY.find(
    (other) => other.reversalOfId === row.id,
  );
  const reversalOf =
    row.reversalOfId === null
      ? null
      : (JOURNAL_ENTRY.find((other) => other.id === row.reversalOfId) ?? null);

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    entryDate: `${row.entryDate}T00:00:00.000Z`,
    description: row.description,
    status: row.status,
    fiscalPeriod: period
      ? { year: period.year, month: period.month, status: period.status }
      : null,
    source:
      row.sourceType === "MANUAL" ? null : { type: row.sourceType, code: null },
    reversalOf: reversalOf ? { code: reversalOf.code } : null,
    reversedBy: reversedBy ? { code: reversedBy.code } : null,
    postedBy: userNameOf(row.postedById),
    postedAt: row.postedAt,
    lineCount: row.lines.length,
    totalDebit: String(totalOf(row.lines, "debit")),
    ...(isDetail
      ? {
          lines: row.lines.map((item) => ({
            id: item.id,
            account: accountRef(item.accountId),
            debit: item.debit,
            credit: item.credit,
            description: item.description,
          })),
        }
      : {}),
  };
};

export const journalList = (params: URLSearchParams) => {
  const status = params.get("status");
  const year = Number(params.get("year")) || null;
  const month = Number(params.get("month")) || null;
  const accountId = Number(params.get("accountId")) || null;
  const filter = (params.get("filter") ?? "").toLowerCase();

  return JOURNAL_ENTRY.filter((row) => {
    const period = periodOf(row.entryDate);

    return (
      (!status || row.status === status) &&
      (!year || period?.year === year) &&
      (!month || period?.month === month) &&
      (!accountId || row.lines.some((item) => item.accountId === accountId)) &&
      (!filter ||
        row.code.toLowerCase().includes(filter) ||
        row.description.toLowerCase().includes(filter))
    );
  }).sort((a, b) => b.entryDate.localeCompare(a.entryDate));
};

export const openMonthStart = () => startOfMonth(TODAY);
