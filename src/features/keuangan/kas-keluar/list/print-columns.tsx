import type { PrintColumn } from "@/components/common/list";
import { formatAmount, formatDate } from "@/lib/format";

import type { CashExpense } from "../types";

export const EXPENSE_PRINT_COLUMNS: readonly PrintColumn<CashExpense>[] = [
  {
    key: "expenseDate",
    header: "Tanggal",
    value: (row) => formatDate(row.expenseDate),
    // Di kertas tanggal panjang lebih enak dibaca; di CSV yang dibutuhkan
    // bentuk yang bisa diurutkan dan disaring Excel.
    csv: (row) => row.expenseDate.slice(0, 10),
  },
  { key: "code", header: "Kode", value: (row) => row.code },
  { key: "payee", header: "Penerima", value: (row) => row.payee },
  { key: "description", header: "Keterangan", value: (row) => row.description },
  {
    key: "paidFromAccount",
    header: "Akun kas",
    value: (row) => `${row.paidFromAccount.code} ${row.paidFromAccount.name}`,
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

export const expensePrintTotal = (rows: readonly CashExpense[]) =>
  formatAmount(rows.reduce((total, row) => total + Number(row.totalAmount), 0));
