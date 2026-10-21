import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount, formatDateShort, formatNumber } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  RETURN_LIST_PATH,
  isEditable,
  returnEditHref,
  returnHref,
} from "../model";
import type { PurchaseReturn } from "../types";
import { ReturnStatusBadge } from "../ui";

const saveFocus = (row: PurchaseReturn) =>
  saveListFocus(RETURN_LIST_PATH, row.publicId);

const detailHrefOf = (row: PurchaseReturn) => returnHref(row.publicId);

const viewLabelOf = (row: PurchaseReturn) =>
  `Lihat retur ${row.code}, ${row.reason}`;

const supplierOf = (row: PurchaseReturn) => row.supplier?.name ?? "—";

const receiptOf = (row: PurchaseReturn) => row.goodsReceipt?.code ?? "—";

const metaOf = (row: PurchaseReturn) =>
  [row.code, supplierOf(row), formatDateShort(row.returnDate)].join(" · ");

const amountOf = (row: PurchaseReturn) => formatAmount(row.totalIDR);

interface PropTypes {
  row: PurchaseReturn;
}

export const ReturnListItem = (props: PropTypes) => {
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
          {row.reason}
        </Link>
      }
      meta={metaOf(row)}
      trailing={
        <>
          <span className="flex flex-col items-end">
            <span className="text-body font-medium tabular-nums">
              {amountOf(row)}
            </span>
            <ReturnStatusBadge status={row.status} />
          </span>
        </>
      }
    />
  );
};

type Column = DataTableColumn<PurchaseReturn>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal retur",
    width: "minmax(0,1.2fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(row.returnDate)}
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
    key: "reason",
    header: "Alasan",
    width: "minmax(0,2.5fr)",
    cell: (row) => (
      <span className="block truncate font-medium" title={row.reason}>
        {row.reason}
      </span>
    ),
  },
  {
    key: "supplier",
    header: "Supplier",
    width: "minmax(0,1.8fr)",
    cell: (row) => (
      <span className="block truncate" title={supplierOf(row)}>
        {supplierOf(row)}
      </span>
    ),
  },
  {
    key: "receipt",
    header: "Penerimaan",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate tabular-nums">{receiptOf(row)}</span>
    ),
  },
  {
    key: "lines",
    header: "Baris",
    width: "minmax(0,0.9fr)",
    align: "end",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate tabular-nums">
        {formatNumber(row.items.length)}
      </span>
    ),
  },
  {
    key: "total",
    header: "Nilai retur",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {amountOf(row)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.3fr)",
    cell: (row) => <ReturnStatusBadge status={row.status} />,
  },
];

export function returnTable(
  isCanUpdate: boolean,
): DataTableConfig<PurchaseReturn> {
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
        isCanUpdate && isEditable(x)
          ? {
              href: returnEditHref(x.publicId),
              onNavigate: () => saveFocus(x),
              label: `Ubah retur ${x.code}`,
            }
          : undefined,
    }),
  };
}
