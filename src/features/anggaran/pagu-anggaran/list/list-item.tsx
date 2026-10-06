import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { ProgressBar } from "@/components/common/dashboard";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  BAR_ALERT_ABOVE,
  PAGU_LIST_PATH,
  allocationDetailHref,
  allocationEditHref,
  amountText,
  barTitleOf,
  percentOf,
  percentText,
} from "../model";
import type { BudgetAllocation } from "../types";

const nameOf = (row: BudgetAllocation) => row.bapel?.name ?? "Badan pelayanan";

const saveFocus = (row: BudgetAllocation) =>
  saveListFocus(PAGU_LIST_PATH, row.publicId);

const detailHrefOf = (row: BudgetAllocation) =>
  allocationDetailHref(row.publicId);

const viewLabelOf = (row: BudgetAllocation) =>
  `Lihat pagu anggaran ${nameOf(row)} tahun ${row.budgetYear.label}`;

const editLink = (row: BudgetAllocation) => (
  <Link
    href={allocationEditHref(row.publicId)}
    onClick={() => saveFocus(row)}
    aria-label={`Ubah pagu anggaran ${nameOf(row)}`}
    className={cn(
      buttonVariants({ variant: "ghost", size: "icon-sm" }),
      "relative cursor-pointer",
    )}
  >
    <Pencil aria-hidden />
  </Link>
);

const money = (value: string) => (
  <span className="block truncate tabular-nums">
    {formatRupiah(Number(value))}
  </span>
);

interface PropTypes {
  row: BudgetAllocation;
  isCanUpdate?: boolean;
}

export const AllocationListItem = (props: PropTypes) => {
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
          {nameOf(row)}
        </Link>
      }
      meta={row.bapel?.code}
      trailing={
        <>
          <div className="w-32 min-w-0">
            <p className="truncate text-right text-body font-medium tabular-nums">
              {amountText(row.usage.ceiling)}
            </p>
            <ProgressBar
              label="Dilaporkan"
              title={barTitleOf(nameOf(row))}
              value={percentOf(row.usage)}
              meta={percentText(row.usage)}
              alertAbove={BAR_ALERT_ABOVE}
            />
          </div>
          {isCanUpdate ? editLink(row) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<BudgetAllocation>;

const COLUMNS: Column[] = [
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,2.2fr)",
    cell: (row) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium" title={nameOf(row)}>
          {nameOf(row)}
        </span>
        <span className="text-muted-foreground block truncate text-caption tabular-nums">
          {row.bapel?.code}
        </span>
      </span>
    ),
  },
  {
    key: "ceiling",
    header: "Pagu",
    width: "minmax(0,1.4fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {amountText(row.usage.ceiling)}
      </span>
    ),
  },
  {
    key: "committed",
    header: "Program disetujui",
    width: "minmax(0,1.5fr)",
    align: "end",
    cell: (row) => money(row.usage.committed),
  },
  {
    key: "disbursed",
    header: "Dicairkan",
    width: "minmax(0,1.4fr)",
    align: "end",
    cell: (row) => money(row.usage.disbursed),
  },
  {
    key: "reported",
    header: "Dilaporkan",
    width: "minmax(0,1.4fr)",
    align: "end",
    isSecondary: true,
    cell: (row) => money(row.usage.reported),
  },
  {
    key: "remaining",
    header: "Sisa",
    width: "minmax(0,1.4fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {amountText(row.usage.remaining)}
      </span>
    ),
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function allocationTable(
  isCanUpdate = false,
): DataTableConfig<BudgetAllocation> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
