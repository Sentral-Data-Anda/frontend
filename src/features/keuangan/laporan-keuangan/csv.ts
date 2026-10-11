import { csvFileName, onDownloadCsv, toCsv, type CsvColumn } from "@/lib/csv";

import { flattenTree } from "./model";
import type {
  AccountTreeRow,
  ByNetAssetClass,
  LedgerRow,
  ReportAccount,
  ReportRange,
} from "./types";

/** Satu baris laporan: bagian mana, akun apa, berapa. */
export type StatementRow = {
  section: string;
  code: string;
  name: string;
  depth: number;
  amount: string;
};

const STATEMENT_COLUMNS: readonly CsvColumn<StatementRow>[] = [
  { header: "Bagian", value: (row) => row.section },
  { header: "Kode", value: (row) => row.code },
  { header: "Nama", value: (row) => row.name },
  // Hierarki akun hilang begitu pohonnya didatarkan. Kedalaman dibawa sebagai
  // kolom tersendiri supaya induk dan anaknya masih bisa dibedakan di Excel.
  { header: "Level", value: (row) => row.depth },
  { header: "Saldo", value: (row) => Number(row.amount) },
];

const toRows = (
  section: string,
  nodes: readonly ReportAccount[] | undefined,
): StatementRow[] =>
  flattenTree(nodes ?? []).map((node: AccountTreeRow) => ({
    section,
    code: node.code,
    name: node.name,
    depth: node.depth,
    amount: node.total,
  }));

/** Baris jumlah, ditulis tanpa kode supaya tidak tertukar dengan akun. */
const totalRow = (
  section: string,
  amount: string | undefined,
): StatementRow => ({
  section,
  code: "",
  name: "Jumlah",
  depth: 0,
  amount: amount ?? "0",
});

export const statementRows = (
  groups: readonly {
    section: string;
    nodes: readonly ReportAccount[] | undefined;
    total: string | undefined;
  }[],
): StatementRow[] =>
  groups.flatMap((group) => [
    ...toRows(group.section, group.nodes),
    totalRow(group.section, group.total),
  ]);

export const onDownloadStatement = (
  nameParts: readonly string[],
  rows: readonly StatementRow[],
) => onDownloadCsv(csvFileName(nameParts), toCsv(STATEMENT_COLUMNS, rows));

export const rangeFileName = (range: ReportRange) =>
  `${range.from}_${range.to}`;

/** Satu baris Perubahan Aset Neto: satu angka per kelas pembatasan. */
export type NetAssetCsvRow = {
  label: string;
  value: ByNetAssetClass | undefined;
};

const NET_ASSET_COLUMNS: readonly CsvColumn<NetAssetCsvRow>[] = [
  { header: "Keterangan", value: (row) => row.label },
  {
    header: "Tanpa pembatasan",
    value: (row) => Number(row.value?.tanpaPembatasan ?? 0),
  },
  {
    header: "Dengan pembatasan",
    value: (row) => Number(row.value?.denganPembatasan ?? 0),
  },
  { header: "Jumlah", value: (row) => Number(row.value?.total ?? 0) },
];

export const onDownloadNetAsset = (
  nameParts: readonly string[],
  rows: readonly NetAssetCsvRow[],
) => onDownloadCsv(csvFileName(nameParts), toCsv(NET_ASSET_COLUMNS, rows));

/** Satu baris Arus Kas. Nilainya bertanda: positif masuk, negatif keluar. */
export type CashFlowCsvRow = {
  section: string;
  code: string;
  name: string;
  amount: string;
};

const CASH_FLOW_COLUMNS: readonly CsvColumn<CashFlowCsvRow>[] = [
  { header: "Bagian", value: (row) => row.section },
  { header: "Kode", value: (row) => row.code },
  { header: "Nama", value: (row) => row.name },
  { header: "Nilai", value: (row) => Number(row.amount) },
];

export const onDownloadCashFlow = (
  nameParts: readonly string[],
  rows: readonly CashFlowCsvRow[],
) => onDownloadCsv(csvFileName(nameParts), toCsv(CASH_FLOW_COLUMNS, rows));

/** Satu baris Buku Besar. */
export const LEDGER_CSV_COLUMNS: readonly CsvColumn<LedgerRow>[] = [
  // Tanggal saja, tanpa jam dan tanpa zona: Excel membaca "2026-01-01"
  // sebagai tanggal, sedangkan ISO berjam mendarat sebagai teks yang tidak
  // bisa diurutkan maupun disaring.
  { header: "Tanggal", value: (row) => row.entryDate.slice(0, 10) },
  { header: "Kode entri", value: (row) => row.entryCode },
  { header: "Keterangan", value: (row) => row.description },
  { header: "Debit", value: (row) => Number(row.debit) },
  { header: "Kredit", value: (row) => Number(row.credit) },
  { header: "Saldo berjalan", value: (row) => Number(row.balance) },
];

export const onDownloadLedger = (
  nameParts: readonly string[],
  rows: readonly LedgerRow[],
) => onDownloadCsv(csvFileName(nameParts), toCsv(LEDGER_CSV_COLUMNS, rows));
