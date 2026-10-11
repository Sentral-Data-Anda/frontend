import type { PrintColumn } from "@/components/common/list";
import { formatAmount, formatDate } from "@/lib/format";

import type { CashReceipt } from "../types";

export const RECEIPT_PRINT_COLUMNS: readonly PrintColumn<CashReceipt>[] = [
  {
    key: "receiptDate",
    header: "Tanggal",
    value: (row) => formatDate(row.receiptDate),
    // Di kertas tanggal panjang lebih enak dibaca; di CSV yang dibutuhkan
    // bentuk yang bisa diurutkan dan disaring Excel.
    csv: (row) => row.receiptDate.slice(0, 10),
  },
  { key: "code", header: "Kode", value: (row) => row.code },
  { key: "payer", header: "Pemberi", value: (row) => row.payer },
  { key: "description", header: "Keterangan", value: (row) => row.description },
  {
    key: "intoAccount",
    header: "Akun kas",
    value: (row) => `${row.intoAccount.code} ${row.intoAccount.name}`,
  },
  {
    key: "reference",
    header: "Referensi",
    value: (row) => row.reference ?? "—",
  },
  {
    key: "totalAmount",
    header: "Jumlah",
    align: "end",
    value: (row) => formatAmount(row.totalAmount),
    csv: (row) => Number(row.totalAmount),
  },
];

export const receiptPrintTotal = (rows: readonly CashReceipt[]) =>
  formatAmount(rows.reduce((total, row) => total + Number(row.totalAmount), 0));
