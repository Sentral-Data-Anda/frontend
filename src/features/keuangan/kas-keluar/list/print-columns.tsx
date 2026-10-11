import type { PrintColumn } from "@/components/common/list";
import { formatAmount, formatDate } from "@/lib/format";

import type { CashExpense } from "../types";

export const EXPENSE_PRINT_COLUMNS: readonly PrintColumn<CashExpense>[] = [
  {
    key: "expenseDate",
    header: "Tanggal",
    cell: (row) => formatDate(row.expenseDate),
  },
  { key: "code", header: "Kode", cell: (row) => row.code },
  { key: "payee", header: "Penerima", cell: (row) => row.payee },
  { key: "description", header: "Keterangan", cell: (row) => row.description },
  {
    key: "paidFromAccount",
    header: "Akun kas",
    cell: (row) => `${row.paidFromAccount.code} ${row.paidFromAccount.name}`,
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

export const expensePrintTotal = (rows: readonly CashExpense[]) =>
  formatAmount(rows.reduce((total, row) => total + Number(row.totalAmount), 0));
