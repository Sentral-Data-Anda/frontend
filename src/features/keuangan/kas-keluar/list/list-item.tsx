import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  EXPENSE_LIST_PATH,
  expenseEditHref,
  expenseHref,
  isLocked,
  rejectionMarkOf,
} from "../model";
import type { CashExpense } from "../types";
import { ExpenseStateBadge } from "../ui";

const saveFocus = (row: CashExpense) =>
  saveListFocus(EXPENSE_LIST_PATH, row.publicId);

const detailHrefOf = (row: CashExpense) => expenseHref(row.publicId);

const viewLabelOf = (row: CashExpense) =>
  `Lihat kas keluar ${row.code} kepada ${row.payee}`;

const accountOf = (row: CashExpense) => row.paidFromAccount.name;

const amountOf = (row: CashExpense) => formatAmount(row.totalAmount);

const metaOf = (row: CashExpense) =>
  [row.code, accountOf(row), formatDateShort(row.expenseDate)].join(" · ");

const REJECTED_MARK = "text-warning-foreground font-medium";

// Ditolak mengembalikan dokumen ke Draf, jadi penandanya hidup di baris meta:
// lencana kedua akan bersaing dengan status dan tidak ada yang tahu mana status.
// Di HP baris meta hanya muat satu hal, jadi akun dan tanggal mengalah ke kode
// plus alasannya — keduanya tetap lengkap di halaman baca.
const metaNodeOf = (row: CashExpense) => {
  const mark = rejectionMarkOf(row);

  return mark ? (
    <>
      {`${row.code} · `}
      <span className={REJECTED_MARK}>{mark}</span>
    </>
  ) : (
    metaOf(row)
  );
};

const isEditable = (row: CashExpense) =>
  row.status === "DRAFT" && !isLocked(row);

const editLink = (row: CashExpense) =>
  isEditable(row) ? (
    <Link
      href={expenseEditHref(row.publicId)}
      onClick={() => saveFocus(row)}
      aria-label={`Ubah kas keluar ${row.code}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  row: CashExpense;
  isCanUpdate?: boolean;
}

export const ExpenseListItem = (props: PropTypes) => {
  const { row, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={row.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={viewLabelOf(row)}
          className={TABLE_ROW_LINK}
        >
          {row.payee}
        </Link>
      }
      meta={metaNodeOf(row)}
      trailing={
        <>
          <span className="flex flex-col items-end">
            <span className="text-body font-medium tabular-nums">
              {amountOf(row)}
            </span>
            <ExpenseStateBadge expense={row} />
          </span>
          {isCanUpdate ? editLink(row) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<CashExpense>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.2fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(row.expenseDate)}
      </span>
    ),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (row) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {row.code}
      </span>
    ),
  },
  {
    key: "payee",
    header: "Kepada",
    width: "minmax(0,2fr)",
    cell: (row) => {
      const mark = rejectionMarkOf(row);

      return (
        <span className="block min-w-0">
          <span className="block truncate font-medium" title={row.payee}>
            {row.payee}
          </span>
          {mark ? (
            <span
              className={`block truncate text-caption ${REJECTED_MARK}`}
              title={mark}
            >
              {mark}
            </span>
          ) : null}
        </span>
      );
    },
  },
  {
    key: "account",
    header: "Dibayar dari",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate" title={accountOf(row)}>
        {accountOf(row)}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {amountOf(row)}
      </span>
    ),
  },
  {
    key: "state",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (row) => <ExpenseStateBadge expense={row} />,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function expenseTable(
  isCanUpdate = false,
): DataTableConfig<CashExpense> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
