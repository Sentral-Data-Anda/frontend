import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort, formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { REQUEST_LIST_PATH, requestEditHref, requestHref } from "../model";
import type { PurchaseRequest } from "../types";
import { RequestStatusBadge } from "../ui";

const saveFocus = (row: PurchaseRequest) =>
  saveListFocus(REQUEST_LIST_PATH, row.code);

const detailHrefOf = (row: PurchaseRequest) => requestHref(row.code);

const viewLabelOf = (row: PurchaseRequest) =>
  `Lihat permintaan ${row.code}, ${row.purpose}`;

const bapelOf = (row: PurchaseRequest) => row.bapel?.name ?? "—";

const metaOf = (row: PurchaseRequest) =>
  [row.code, bapelOf(row), formatDateShort(row.createdAt)].join(" · ");

const amountOf = (row: PurchaseRequest) =>
  formatRupiah(Number(row.totalEstimatedIDR));

const editLink = (row: PurchaseRequest) =>
  row.status === "DRAFT" ? (
    <Link
      href={requestEditHref(row.code)}
      onClick={() => saveFocus(row)}
      aria-label={`Ubah permintaan ${row.code}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  row: PurchaseRequest;
  isCanUpdate?: boolean;
}

export const RequestListItem = (props: PropTypes) => {
  const { row, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={row.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={viewLabelOf(row)}
          className={TABLE_ROW_LINK}
        >
          {row.purpose}
        </Link>
      }
      meta={metaOf(row)}
      trailing={
        <>
          <span className="flex flex-col items-end">
            <span className="text-body font-medium tabular-nums">
              {amountOf(row)}
            </span>
            <RequestStatusBadge status={row.status} />
          </span>
          {isCanUpdate ? editLink(row) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<PurchaseRequest>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(row.createdAt)}
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
    key: "purpose",
    header: "Keperluan",
    width: "minmax(0,2.5fr)",
    cell: (row) => (
      <span className="block truncate font-medium" title={row.purpose}>
        {row.purpose}
      </span>
    ),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate" title={bapelOf(row)}>
        {bapelOf(row)}
      </span>
    ),
  },
  {
    key: "total",
    header: "Perkiraan",
    width: "minmax(0,1.2fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate tabular-nums">{amountOf(row)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.3fr)",
    cell: (row) => <RequestStatusBadge status={row.status} />,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function requestTable(
  isCanUpdate: boolean,
): DataTableConfig<PurchaseRequest> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
