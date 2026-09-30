/**
 * State mock bersama grup Keuangan (docs/design/keuangan/README.md §4a TL-3).
 * Larik diisi agent fitur saat runtime; bentuk tampilan dan aturan milik TL.
 * Bentuk respons = be-sada sesudah gap §7a. Chart of accounts di sini adalah
 * data uji, bukan usulan ke gereja (E1 milik bendahara).
 */
import { addDays, startOfMonth } from "../../src/lib/date";
import { balanceOf, sumAmounts } from "../../src/lib/number";
import type {
  AccountType,
  AccountingSettingKey,
  CashStatus,
  JournalStatus,
  PeriodStatus,
} from "../../src/types/keuangan";
import { DDL_JEMAAT, SESSION_USER_ID } from "../mock-dashboard";

import { TODAY, isLive, nextId } from "./fasilitas-store";
import { userNameOf } from "./inventaris-store";
import { bapelOf } from "./pelayanan-store";

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
    description:
      "Akun kas yang didebit saat persembahan tunai diposting ke jurnal",
    accountId: 2,
    updatedById: SESSION_USER_ID,
  },
  {
    key: "PERSEMBAHAN_BANK",
    description:
      "Akun bank yang didebit saat persembahan transfer diposting ke jurnal",
    accountId: 4,
    updatedById: SESSION_USER_ID,
  },
  {
    key: "PERSEMBAHAN_GATEWAY",
    description:
      "Uang persembahan online yang belum cair dari payment gateway. Saat cair, catat di Kas Masuk ke rekening bank dan bebankan biayanya ke Beban Administrasi.",
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
    description:
      "Akun beban yang didebit saat penyusutan bulanan diposting ke jurnal",
    accountId: null,
    updatedById: null,
  },
  {
    key: "PENYUSUTAN_AKUMULASI",
    description:
      "Akun akumulasi penyusutan yang dikredit saat penyusutan bulanan diposting ke jurnal",
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
    accountId: row.accountId,
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
    entryDate: addDays(TODAY, -15),
    description: "Persembahan kolekte yang kemudian dibatalkan",
    status: "REVERSED",
    sourceType: "PERSEMBAHAN",
    sourceId: 33,
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: `${addDays(TODAY, -20)}T04:00:00.000Z`,
    lines: [
      line(10, 2, "620000", "0", null),
      line(11, 16, "0", "620000", null),
    ],
  },
  {
    id: 6,
    publicId: "jrn-0006",
    code: `JRN-${YEAR}-0006`,
    entryDate: addDays(TODAY, -14),
    description: "Pembalikan persembahan yang dibatalkan",
    status: "POSTED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: 5,
    postedById: SESSION_USER_ID,
    postedAt: `${addDays(TODAY, -18)}T04:00:00.000Z`,
    lines: [
      line(12, 16, "620000", "0", null),
      line(13, 2, "0", "620000", null),
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

// Rute Jurnal berkunci publicId, jadi setiap rujukan entri membawanya — tanpa
// itu tautan pembalikan tidak bisa dibangun.
const entryRef = (entryId: number | null) => {
  const entry =
    entryId === null
      ? null
      : (JOURNAL_ENTRY.find((row) => row.id === entryId) ?? null);

  return entry
    ? { publicId: entry.publicId, code: entry.code, entryDate: entry.entryDate }
    : null;
};

export const journalView = (row: JournalEntryRow, isDetail = false) => {
  const period = periodOf(row.entryDate);
  const reversedBy = JOURNAL_ENTRY.find(
    (other) => other.reversalOfId === row.id,
  );

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
    sourceType: row.sourceType,
    source:
      row.sourceType === "MANUAL"
        ? null
        : { type: row.sourceType, id: row.sourceId, code: null },
    reversalOfId: row.reversalOfId,
    isReversal: row.reversalOfId !== null,
    reversalOf: entryRef(row.reversalOfId),
    reversedBy: reversedBy ? entryRef(reversedBy.id) : null,
    postedBy: userNameOf(row.postedById),
    postedAt: row.postedAt,
    lineCount: row.lines.length,
    totalDebit: String(totalOf(row.lines, "debit")),
    ...(isDetail
      ? {
          lines: row.lines.map((item) => ({
            id: item.id,
            publicId: `jln-${item.id}`,
            accountId: item.accountId,
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

// ---------------------------------------------------------------------------
// Penulisan jurnal dari dokumen. Kas Masuk, Kas Keluar, Setoran, Persembahan,
// dan Pembayaran semuanya lewat sini, supaya entri yang diklaim dokumen benar
// ada di Jurnal, bisa dibuka dari tautannya, dan terbaca laporan.
//
// Cermin be-sada: periode diturunkan dari tanggal dan harus terbuka, debit
// harus sama dengan kredit, total > 0, dan satu dokumen hanya boleh punya satu
// entri (journal_entry_one_per_source) — membalik tidak membebaskannya.

export type DocumentLine = {
  accountId: number;
  debit: string;
  credit: string;
  description?: string | null;
};

export type PostFailure = { code: string; message: string };

const nextJournalNumber = () =>
  JOURNAL_ENTRY.reduce(
    (highest, row) => Math.max(highest, Number(row.code.slice(-4)) || 0),
    0,
  ) + 1;

// Entri jurnal tidak punya deletedAt — ia tidak pernah dihapus lunak, hanya
// dibalik — jadi id-nya tidak bisa lewat nextId().
const nextEntryId = () =>
  JOURNAL_ENTRY.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;

const nextLineId = () =>
  JOURNAL_ENTRY.reduce(
    (highest, row) =>
      row.lines.reduce((inner, line) => Math.max(inner, line.id), highest),
    0,
  ) + 1;

export const journalOfSource = (sourceType: string, sourceId: number) =>
  JOURNAL_ENTRY.find(
    (row) => row.sourceType === sourceType && row.sourceId === sourceId,
  ) ?? null;

export const journalRefOfSource = (sourceType: string, sourceId: number) => {
  const entry = journalOfSource(sourceType, sourceId);

  return entry ? { code: entry.code, status: entry.status } : null;
};

export const postDocumentEntry = (input: {
  sourceType: string;
  sourceId: number;
  entryDate: string;
  description: string;
  lines: DocumentLine[];
}): { entry: JournalEntryRow } | { failure: PostFailure } => {
  const period = periodOf(input.entryDate);

  if (!period) {
    return {
      failure: {
        code: "PERIOD_NOT_OPEN",
        message: `Periode Fiskal ${monthLabel(
          Number(input.entryDate.slice(0, 4)),
          Number(input.entryDate.slice(5, 7)),
        )} Belum Dibuka`,
      },
    };
  }

  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return {
      failure: {
        code: "PERIOD_CLOSED",
        message: `Periode Fiskal ${monthLabel(period.year, period.month)} Sudah Ditutup`,
      },
    };
  }

  if (journalOfSource(input.sourceType, input.sourceId)) {
    return {
      failure: {
        code: "ALREADY_POSTED",
        message: "Dokumen Ini Sudah Diposting Ke Jurnal",
      },
    };
  }

  const balance = balanceOf(input.lines);

  if (!balance.isBalanced) {
    return {
      failure: {
        code: "NOT_BALANCED",
        message: "Debit Dan Kredit Tidak Seimbang",
      },
    };
  }

  let lineId = nextLineId();
  const entry: JournalEntryRow = {
    id: nextEntryId(),
    publicId: `jrn-${pad(nextJournalNumber())}`,
    code: `JRN-${YEAR}-${pad(nextJournalNumber())}`,
    entryDate: input.entryDate,
    description: input.description,
    status: "POSTED",
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: new Date().toISOString(),
    lines: input.lines.map((line) => ({
      id: lineId++,
      accountId: line.accountId,
      debit: line.debit || "0",
      credit: line.credit || "0",
      description: line.description ?? null,
    })),
  };

  JOURNAL_ENTRY.push(entry);

  return { entry };
};

// Pembalikan bertanggal hari ini dan tidak membawa sumber: dokumen yang sudah
// diposting tetap terkunci, persis seperti be-sada.
export const reverseDocumentEntry = (
  sourceType: string,
  sourceId: number,
  description: string,
): { entry: JournalEntryRow } | { failure: PostFailure } | null => {
  const original = journalOfSource(sourceType, sourceId);

  if (!original || original.status !== "POSTED") return null;

  const period = periodOf(TODAY);

  if (!period || period.status === "CLOSED") {
    return {
      failure: {
        code: "PERIOD_CLOSED",
        message: `Periode Fiskal ${monthLabel(
          Number(TODAY.slice(0, 4)),
          Number(TODAY.slice(5, 7)),
        )} Sudah Ditutup`,
      },
    };
  }

  let lineId = nextLineId();
  const entry: JournalEntryRow = {
    id: nextEntryId(),
    publicId: `jrn-${pad(nextJournalNumber())}`,
    code: `JRN-${YEAR}-${pad(nextJournalNumber())}`,
    entryDate: TODAY,
    description,
    status: "POSTED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: original.id,
    postedById: SESSION_USER_ID,
    postedAt: new Date().toISOString(),
    lines: original.lines.map((line) => ({
      id: lineId++,
      accountId: line.accountId,
      debit: line.credit,
      credit: line.debit,
      description: line.description,
    })),
  };

  original.status = "REVERSED";
  JOURNAL_ENTRY.push(entry);

  return { entry };
};

// ---------------------------------------------------------------------------
// Kas Masuk. Penerimaan di luar persembahan, termasuk pencairan persembahan
// online. Entri jurnalnya satu debit ke akun tujuan sebesar total dan satu
// kredit per baris, ditulis lewat postDocumentEntry seperti dokumen lain.

export const CASH_RECEIPT_SOURCE = "CASH_RECEIPT";

export type CashReceiptLineRow = {
  publicId: string;
  accountId: number;
  amount: string;
  description: string | null;
};

export type CashReceiptRow = {
  id: number;
  publicId: string;
  code: string;
  receiptDate: string;
  description: string;
  payer: string;
  intoAccountId: number;
  bapelId: number | null;
  method: string | null;
  reference: string | null;
  status: CashStatus;
  cancelReason: string | null;
  deletedAt: string | null;
  lines: CashReceiptLineRow[];
};

let receiptLineId = 0;

export const cashReceiptLine = (
  accountId: number,
  amount: string,
  description: string | null = null,
): CashReceiptLineRow => {
  receiptLineId += 1;

  return {
    publicId: `bkml-${pad(receiptLineId)}`,
    accountId,
    amount,
    description,
  };
};

export const cashReceiptTotal = (row: Pick<CashReceiptRow, "lines">) =>
  sumAmounts(row.lines.map((line) => line.amount));

const receipt = (
  id: number,
  receiptDate: string,
  payer: string,
  description: string,
  intoAccountId: number,
  lines: CashReceiptLineRow[],
  extra: Partial<CashReceiptRow> = {},
): CashReceiptRow => ({
  id,
  publicId: `bkm-${pad(id)}`,
  code: `BKM-${YEAR}-${pad(id)}`,
  receiptDate,
  description,
  payer,
  intoAccountId,
  bapelId: null,
  method: null,
  reference: null,
  status: "DRAFT",
  cancelReason: null,
  deletedAt: null,
  lines,
  ...extra,
});

export const CASH_RECEIPT: CashReceiptRow[] = [
  receipt(
    1,
    addDays(TODAY, -1),
    "Keluarga Santoso",
    "Sewa gedung untuk resepsi pernikahan",
    2,
    [cashReceiptLine(20, "3500000", "Sewa aula")],
    { method: "Tunai", reference: "BA-07/IX/2026" },
  ),
  receipt(
    2,
    addDays(TODAY, -5),
    "Payment gateway",
    "Pencairan persembahan online dari payment gateway",
    4,
    [
      cashReceiptLine(6, "4850000", "Persembahan online bruto"),
      cashReceiptLine(23, "72750", "Biaya administrasi payment gateway"),
    ],
    {
      status: "PAID",
      method: "Transfer",
      reference: "XND-SETTLE-0918",
    },
  ),
  receipt(
    3,
    addDays(TODAY, -8),
    "Toko Rejeki",
    "Penjualan kalender gereja 2027",
    2,
    [cashReceiptLine(20, "1250000", "120 kalender")],
    { status: "PAID", method: "Tunai" },
  ),
  receipt(
    4,
    addDays(TODAY, -11),
    "Panitia Natal",
    "Pengembalian dana panitia yang tidak terpakai",
    3,
    [cashReceiptLine(20, "640000", null)],
    { status: "CANCELLED", cancelReason: "Salah akun tujuan, dicatat ulang." },
  ),
  receipt(
    5,
    addDays(TODAY, -3),
    "Hitung fisik kolekte 21 September",
    "Selisih lebih hasil hitung fisik kolekte",
    2,
    [cashReceiptLine(7, "15000", "Selisih lebih")],
    { reference: "BA-06/IX/2026" },
  ),
  receipt(
    6,
    `${YEAR}-01-14`,
    "Bapak Wibowo",
    "Sumbangan non-persembahan untuk perbaikan atap",
    2,
    [cashReceiptLine(20, "2000000", null)],
    { method: "Transfer", bapelId: 1 },
  ),
];

// Satu debit ke akun tujuan sebesar total, satu kredit per baris.
export const cashReceiptEntryLines = (row: CashReceiptRow): DocumentLine[] => [
  {
    accountId: row.intoAccountId,
    debit: cashReceiptTotal(row),
    credit: "0",
    description: row.payer,
  },
  ...row.lines.map((line) => ({
    accountId: line.accountId,
    debit: "0",
    credit: line.amount,
    description: line.description,
  })),
];

export const cashReceiptView = (row: CashReceiptRow, isDetail = false) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  receiptDate: `${row.receiptDate}T00:00:00.000Z`,
  description: row.description,
  payer: row.payer,
  intoAccountId: row.intoAccountId,
  intoAccount: accountRef(row.intoAccountId),
  bapel: row.bapelId === null ? null : (bapelOf(row.bapelId) ?? null),
  method: row.method,
  reference: row.reference,
  totalAmount: cashReceiptTotal(row),
  status: row.status,
  ...(isDetail
    ? {
        lines: row.lines.map((line) => ({
          publicId: line.publicId,
          accountId: line.accountId,
          account: {
            code: accountOf(line.accountId)?.code ?? "",
            name: accountOf(line.accountId)?.name ?? "",
          },
          amount: line.amount,
          description: line.description,
        })),
        journal: journalRefOfSource(CASH_RECEIPT_SOURCE, row.id),
        cancelReason: row.cancelReason,
      }
    : {}),
});

// Seed yang sudah Diterima harus punya entri sungguhan, atau tautan jurnalnya
// menunjuk ke entri yang tidak ada.
for (const row of CASH_RECEIPT) {
  if (row.status === "PAID") {
    postDocumentEntry({
      sourceType: CASH_RECEIPT_SOURCE,
      sourceId: row.id,
      entryDate: row.receiptDate,
      description: row.description,
      lines: cashReceiptEntryLines(row),
    });
  }
}

// ---------------------------------------------------------------------------
// Persembahan. Dibaca juga oleh posting batch Jurnal dan posting Pembayaran,
// jadi larik dan bentuk bacaannya tinggal di store, bukan di handler fitur.

export type PersembahanRow = {
  id: number;
  publicId: string;
  code: string;
  typePersembahanId: number;
  jemaatId: number | null;
  donorName: string | null;
  period: string | null;
  amount: string;
  receiveMethod: "TUNAI" | "TRANSFER" | "PAYMENT_GATEWAY";
  receivedDate: string;
  receivedById: number | null;
  ibadahId: number | null;
  status: "ACTIVE" | "VOID";
  voidReason: string | null;
  voidedAt: string | null;
  voidedById: number | null;
  journalEntryId: number | null;
};

// ---------------------------------------------------------------------------
// Ibadah untuk pemilih di form kolekte. `/ddl/ibadah` belum ada di kontrak
// maupun di mock bersama; bentuknya mengikuti pilihan ddl lain.

const SUNDAY = 0;

const lastWeekday = (weekday: number, weeksBack: number) => {
  const today = new Date(`${TODAY}T00:00:00Z`).getUTCDay();
  const back = (today - weekday + 7) % 7;

  return addDays(TODAY, -back - weeksBack * 7);
};

export const IBADAH_OPTION = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  code: `IBD-${pad(index + 1)}`,
  name: index % 2 === 0 ? "Ibadah Minggu I" : "Ibadah Minggu II",
  date: lastWeekday(SUNDAY, Math.floor(index / 2)),
}));

const ibadahOf = (id: number | null) =>
  id === null ? null : (IBADAH_OPTION.find((row) => row.id === id) ?? null);

const jemaatOf = (id: number | null) =>
  id === null ? null : (DDL_JEMAAT.find((row) => row.id === id) ?? null);

const personOf = (id: number | null) => {
  const found = jemaatOf(id);

  return found ? { name: found.name } : null;
};

// ---------------------------------------------------------------------------
// Baris. Satu kolekte batch lengkap pada Minggu lalu, satu pembayaran online,
// satu dibatalkan sesudah diposting, sisanya pengisi supaya paginasi terisi.

const KOLEKTE_DATE = lastWeekday(SUNDAY, 1);

const GATEWAY_DATE = process.env.MOCK_GATEWAY_GIFT ? TODAY : addDays(TODAY, -4);

let sequence = 0;

const row = (
  seed: Partial<PersembahanRow> &
    Pick<PersembahanRow, "typePersembahanId" | "amount">,
): PersembahanRow => {
  sequence += 1;

  return {
    id: sequence,
    publicId: `psb-${pad(sequence)}`,
    code: `PSB-${TODAY.slice(0, 4)}-${pad(sequence)}`,
    jemaatId: null,
    donorName: null,
    period: null,
    receiveMethod: "TUNAI",
    receivedDate: KOLEKTE_DATE,
    receivedById: 4,
    ibadahId: 3,
    status: "ACTIVE",
    voidReason: null,
    voidedAt: null,
    voidedById: null,
    journalEntryId: null,
    ...seed,
  };
};

const KOLEKTE_AMOUNTS = [
  "1250000",
  "480000",
  "375000",
  "2100000",
  "150000",
  "95000",
  "640000",
  "320000",
  "55000",
  "955000",
];

export const PERSEMBAHAN: PersembahanRow[] = [
  // Kolekte batch minggu lalu: satu header, sepuluh amplop, sudah diposting.
  ...KOLEKTE_AMOUNTS.map((amount, index) =>
    row({
      typePersembahanId: 1,
      amount,
      donorName: index === 3 ? "Keluarga Sitompul" : null,
      journalEntryId: index === 0 ? 2 : null,
    }),
  ),
  // Perpuluhan bernama, wajib jemaat.
  ...DDL_JEMAAT.slice(0, 8).map((jemaat, index) =>
    row({
      typePersembahanId: 2,
      amount: String(500_000 + index * 125_000),
      jemaatId: jemaat.id,
      receiveMethod: index % 3 === 0 ? "TRANSFER" : "TUNAI",
      receivedDate: addDays(TODAY, -2 - index),
      ibadahId: null,
    }),
  ),
  // Persembahan bulanan: wajib jemaat dan berperiode.
  ...DDL_JEMAAT.slice(2, 8).map((jemaat, index) =>
    row({
      typePersembahanId: 3,
      amount: String(250_000 + index * 50_000),
      jemaatId: jemaat.id,
      period: startOfMonth(addDays(TODAY, -20)),
      receiveMethod: "TRANSFER",
      receivedDate: addDays(TODAY, -12 - index),
      ibadahId: null,
    }),
  ),
  // Syukur, anonim dan bernama.
  ...["3500000", "1750000", "250000", "80000"].map((amount, index) =>
    row({
      typePersembahanId: 4,
      amount,
      donorName: index === 1 ? "Ibu Tiur" : null,
      receivedDate: addDays(TODAY, -6 - index * 3),
      ibadahId: index === 0 ? 1 : null,
    }),
  ),
  // Dana pembangunan.
  ...["10000000", "4500000", "1200000"].map((amount, index) =>
    row({
      typePersembahanId: 5,
      amount,
      jemaatId: index === 0 ? 3 : null,
      donorName: index === 1 ? "Hamba Tuhan" : null,
      receiveMethod: "TRANSFER",
      receivedDate: addDays(TODAY, -8 - index * 4),
      ibadahId: null,
    }),
  ),
  // Pembayaran online: ditulis webhook, tidak bisa diketik; tanpa tangan yang memegang.
  row({
    typePersembahanId: 4,
    amount: "500000",
    jemaatId: 3,
    receiveMethod: "PAYMENT_GATEWAY",
    receivedDate: GATEWAY_DATE,
    receivedById: null,
    ibadahId: null,
  }),
  // Dibatalkan sesudah diposting: entri jurnalnya sudah dibalik.
  row({
    typePersembahanId: 1,
    amount: "620000",
    receivedDate: addDays(TODAY, -15),
    ibadahId: null,
    status: "VOID",
    voidReason: "Amplop terhitung dua kali saat penghitungan kolekte.",
    voidedAt: `${addDays(TODAY, -14)}T04:30:00.000Z`,
    voidedById: 6,
    journalEntryId: 5,
  }),
  // Dibatalkan sebelum diposting: tanpa jurnal sama sekali.
  row({
    typePersembahanId: 2,
    amount: "300000",
    jemaatId: 5,
    receivedDate: addDays(TODAY, -3),
    ibadahId: null,
    status: "VOID",
    voidReason: "Jemaat keliru ditunjuk; dicatat ulang atas nama yang benar.",
    voidedAt: `${addDays(TODAY, -3)}T09:15:00.000Z`,
    voidedById: 4,
  }),
];

const iso = (date: string | null) => (date ? `${date}T00:00:00.000Z` : null);

export const persembahanView = (item: PersembahanRow) => {
  const type = typePersembahanOf(item.typePersembahanId);
  const jemaat = jemaatOf(item.jemaatId);
  const ibadah = ibadahOf(item.ibadahId);

  return {
    id: item.id,
    publicId: item.publicId,
    code: item.code,
    typePersembahan: {
      id: item.typePersembahanId,
      code: type?.code ?? "",
      name: type?.name ?? "",
      hasPeriod: type?.hasPeriod ?? false,
    },
    jemaat: jemaat
      ? { id: jemaat.id, code: jemaat.code, name: jemaat.name }
      : null,
    donorName: item.donorName,
    period: iso(item.period),
    amount: item.amount,
    receiveMethod: item.receiveMethod,
    receivedDate: iso(item.receivedDate),
    receivedBy: personOf(item.receivedById),
    ibadah: ibadah
      ? { id: ibadah.id, code: ibadah.code, date: iso(ibadah.date) }
      : null,
    status: item.status,
    voidReason: item.voidReason,
    voidedAt: item.voidedAt,
    voidedBy: personOf(item.voidedById),
    journal: journalRef(item.journalEntryId),
  };
};

const matches = (item: PersembahanRow, params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const status = params.get("status");
  const method = params.get("receiveMethod");
  const typeId = Number(params.get("typePersembahanId")) || null;
  const isPosted = params.get("isPosted");
  const haystack = [
    item.code,
    jemaatOf(item.jemaatId)?.name ?? "",
    item.donorName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!filter || haystack.includes(filter)) &&
    (!startDate || item.receivedDate >= startDate) &&
    (!endDate || item.receivedDate <= endDate) &&
    (!status || item.status === status) &&
    (!method || item.receiveMethod === method) &&
    (!typeId || item.typePersembahanId === typeId) &&
    (isPosted === null ||
      !/^(1|0|true|false)$/i.test(isPosted) ||
      /^(1|true)$/i.test(isPosted) === (item.journalEntryId !== null))
  );
};

export const persembahanList = (params: URLSearchParams) =>
  PERSEMBAHAN.filter((item) => matches(item, params)).sort(
    (a, b) => b.receivedDate.localeCompare(a.receivedDate) || b.id - a.id,
  );

export const persembahanTotals = (rows: readonly PersembahanRow[]) =>
  String(
    rows
      .filter((item) => item.status === "ACTIVE")
      .reduce((total, item) => total + Number(item.amount), 0),
  );
