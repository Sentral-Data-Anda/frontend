import type { PrintColumn } from "@/components/common/list";
import { formatAmount, formatDate } from "@/lib/format";

import type { CashReceipt } from "../types";

export const RECEIPT_PRINT_COLUMNS: readonly PrintColumn<CashReceipt>[] = [
  {
    key: "receiptDate",
    header: "Tanggal",
    cell: (row) => formatDate(row.receiptDate),
  },
  { key: "code", header: "Kode", cell: (row) => row.code },
  { key: "payer", header: "Pemberi", cell: (row) => row.payer },
  { key: "description", header: "Keterangan", cell: (row) => row.description },
  {
    key: "intoAccount",
    header: "Akun kas",
    cell: (row) => `${row.intoAccount.code} ${row.intoAccount.name}`,
  },
  {
    key: "reference",
    header: "Referensi",
    cell: (row) => row.reference ?? "—",
  },
  {
    key: "totalAmount",
    header: "Jumlah",
    align: "end",
    cell: (row) => formatAmount(row.totalAmount),
  },
];

export const receiptPrintTotal = (rows: readonly CashReceipt[]) =>
  formatAmount(rows.reduce((total, row) => total + Number(row.totalAmount), 0));
