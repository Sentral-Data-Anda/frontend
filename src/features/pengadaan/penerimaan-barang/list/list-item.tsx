import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDate, formatDateShort, formatNumber } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { RECEIPT_LIST_PATH, receiptHref, supplierNameOf } from "../model";
import type { Receipt } from "../types";

const saveFocus = (receipt: Receipt) =>
  saveListFocus(RECEIPT_LIST_PATH, receipt.code);

const detailHrefOf = (receipt: Receipt) => receiptHref(receipt.code);

const viewLabelOf = (receipt: Receipt) =>
  `Lihat penerimaan ${receipt.code} dari ${supplierNameOf(receipt)}`;

const receiptMetaOf = (receipt: Receipt) =>
  [
    receipt.code,
    formatDate(receipt.receivedDate),
    `pesanan ${receipt.purchaseOrder.code}`,
    `${formatNumber(receipt.itemCount)} barang`,
  ].join(" · ");

interface PropTypes {
  receipt: Receipt;
}

export const ReceiptListItemRow = (props: PropTypes) => {
  const { receipt } = props;

  return (
    <DataListRow
      id={receipt.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(receipt)}
          onClick={() => saveFocus(receipt)}
          aria-label={viewLabelOf(receipt)}
          className={TABLE_ROW_LINK}
        >
          {supplierNameOf(receipt)}
        </Link>
      }
      meta={receiptMetaOf(receipt)}
    />
  );
};

const truncated = (text: string, className = "") => (
  <span className={cn("block truncate", className)} title={text}>
    {text}
  </span>
);

const COLUMNS: DataTableColumn<Receipt>[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1fr)",
    cell: (receipt) =>
      truncated(formatDateShort(receipt.receivedDate), "tabular-nums"),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (receipt) =>
      truncated(receipt.code, "text-muted-foreground tabular-nums"),
  },
  {
    key: "order",
    header: "Pesanan",
    width: "minmax(0,1.2fr)",
    cell: (receipt) => truncated(receipt.purchaseOrder.code, "tabular-nums"),
  },
  {
    key: "supplier",
    header: "Supplier",
    width: "minmax(0,2fr)",
    cell: (receipt) => truncated(supplierNameOf(receipt), "font-medium"),
  },
  {
    key: "items",
    header: "Barang",
    width: "minmax(0,0.8fr)",
    align: "end",
    cell: (receipt) =>
      truncated(formatNumber(receipt.itemCount), "tabular-nums"),
  },
  {
    key: "by",
    header: "Dicatat oleh",
    width: "minmax(0,1.4fr)",
    isSecondary: true,
    cell: (receipt) =>
      truncated(receipt.receivedBy?.name ?? "-", "text-muted-foreground"),
  },
];

export function receiptTable(): DataTableConfig<Receipt> {
  return {
    columns: COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
