import { csvFileName, onDownloadCsv, toCsv, type CsvColumn } from "@/lib/csv";

import type { AssetRegisterRow } from "./types";

const COLUMNS: readonly CsvColumn<AssetRegisterRow>[] = [
  { header: "Kode", value: (row) => row.code },
  { header: "Nama", value: (row) => row.name },
  { header: "Tipe", value: (row) => row.type.name },
  { header: "Badan pelayanan", value: (row) => row.bapel.name },
  {
    header: "Tanggal perolehan",
    value: (row) => row.acquisitionDate?.slice(0, 10) ?? "",
  },
  { header: "Harga perolehan", value: (row) => Number(row.acquisitionCost) },
  { header: "Akumulasi penyusutan", value: (row) => Number(row.accumulated) },
  { header: "Nilai buku", value: (row) => Number(row.bookValue) },
];

export const onDownloadRegister = (
  date: string,
  rows: readonly AssetRegisterRow[],
) =>
  onDownloadCsv(
    csvFileName(["Laporan-Aset-Tetap", date]),
    toCsv(COLUMNS, rows),
  );
