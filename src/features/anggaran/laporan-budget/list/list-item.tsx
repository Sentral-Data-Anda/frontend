import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  REPORT_LIST_PATH,
  reportDetailHref,
  reportEditHref,
  reportStateOf,
} from "../model";
import type { BudgetReport } from "../types";
import { ReportStatusBadge } from "../ui";

const saveFocus = (row: BudgetReport) =>
  saveListFocus(REPORT_LIST_PATH, row.publicId);

const detailHrefOf = (row: BudgetReport) => reportDetailHref(row.publicId);

const viewLabelOf = (row: BudgetReport) =>
  `Lihat laporan ${row.label} ${row.bapel?.name ?? ""}`.trim();

interface PropTypes {
  row: BudgetReport;
}

export const ReportListItem = (props: PropTypes) => {
  const { row } = props;

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
          {row.label}
        </Link>
      }
      meta={[row.code, row.bapel?.name].filter(Boolean).join(" · ")}
      trailing={
        <>
          <div className="min-w-0">
            <p className="truncate text-right text-body font-medium tabular-nums">
              {formatAmount(row.totalAmount)}
            </p>
            <div className="flex justify-end">
              <ReportStatusBadge report={row} />
            </div>
          </div>
        </>
      }
    />
  );
};

type Column = DataTableColumn<BudgetReport>;

const COLUMNS: Column[] = [
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.code}</span>
    ),
  },
  {
    key: "label",
    header: "Bulan",
    width: "minmax(0,1.5fr)",
    cell: (row) => (
      <span className="block truncate font-medium">{row.label}</span>
    ),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,2fr)",
    cell: (row) => (
      <span className="block truncate">{row.bapel?.name ?? "—"}</span>
    ),
  },
  {
    key: "lines",
    header: "Baris",
    width: "minmax(0,0.8fr)",
    align: "end",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.lineCount}</span>
    ),
  },
  {
    key: "receipts",
    header: "Kwitansi",
    width: "minmax(0,0.8fr)",
    align: "end",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.receiptCount}</span>
    ),
  },
  {
    key: "amount",
    header: "Total",
    width: "minmax(0,1.5fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {formatAmount(row.totalAmount)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (row) => <ReportStatusBadge report={row} />,
  },
];

export function reportTable(
  isCanUpdate = false,
): DataTableConfig<BudgetReport> {
  return {
    columns: COLUMNS,
    getRowActions: (x) => ({
      label: viewLabelOf(x),
      view: {
        href: detailHrefOf(x),
        onNavigate: () => saveFocus(x),
        label: viewLabelOf(x),
      },
      edit:
        isCanUpdate && reportStateOf(x) === "DRAFT"
          ? {
              href: reportEditHref(x.publicId),
              onNavigate: () => saveFocus(x),
              label: `Ubah laporan ${x.label}`,
            }
          : undefined,
    }),
  };
}
