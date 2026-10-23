import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

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

const amountOf = (row: PurchaseRequest) => formatAmount(row.totalEstimatedIDR);

interface PropTypes {
  row: PurchaseRequest;
}

export const RequestListItem = (props: PropTypes) => {
  const { row } = props;

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

const deleteLabelOf = (x: PurchaseRequest) =>
  `Hapus permintaan pembelian ${x.code}`;

export const deleteTargetLabelOf = (x: PurchaseRequest) => x.code;

export function requestTable(
  isCanUpdate: boolean,
  onDelete?: (row: PurchaseRequest) => void,
): DataTableConfig<PurchaseRequest> {
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
        isCanUpdate && x.status === "DRAFT"
          ? {
              href: requestEditHref(x.publicId),
              onNavigate: () => saveFocus(x),
              label: `Ubah permintaan ${x.code}`,
            }
          : undefined,
      remove:
        onDelete && x.status === "DRAFT"
          ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
          : undefined,
    }),
  };
}
