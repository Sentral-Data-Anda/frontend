import { csvFileName, onDownloadCsv, toCsv, type CsvColumn } from "@/lib/csv";

import { BUCKETS, type ApAgeingRow } from "./types";

const COLUMNS: readonly CsvColumn<ApAgeingRow>[] = [
  { header: "Kode supplier", value: (row) => row.supplier.code },
  { header: "Supplier", value: (row) => row.supplier.name },
  { header: "Jumlah faktur", value: (row) => row.invoiceCount },
  {
    header: "Jatuh tempo terlama",
    value: (row) => row.oldestDueDate?.slice(0, 10) ?? "",
  },
  ...BUCKETS.map((bucket) => ({
    header: bucket.label,
    value: (row: ApAgeingRow) => Number(row.buckets[bucket.key]),
  })),
  { header: "Jumlah", value: (row) => Number(row.total) },
];

export const onDownloadAgeing = (date: string, rows: readonly ApAgeingRow[]) =>
  onDownloadCsv(
    csvFileName(["Umur-Utang-Supplier", date]),
    toCsv(COLUMNS, rows),
  );
