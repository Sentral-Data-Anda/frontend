import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDate, formatDateShort, formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  KAS_MASUK_LIST_PATH,
  isEditable,
  receiptEditHref,
  receiptHref,
} from "../model";
import type { CashReceipt } from "../types";
import { ReceiptStatusBadge } from "../ui";

const saveFocus = (receipt: CashReceipt) =>
  saveListFocus(KAS_MASUK_LIST_PATH, receipt.publicId);

const detailHrefOf = (receipt: CashReceipt) => receiptHref(receipt.publicId);

const viewLabelOf = (receipt: CashReceipt) =>
  `Lihat kas masuk ${receipt.code} dari ${receipt.payer}, ${formatDate(receipt.receiptDate)}`;

const intoLabelOf = (receipt: CashReceipt) =>
  `${receipt.intoAccount.code} — ${receipt.intoAccount.name}`;

const metaOf = (receipt: CashReceipt) =>
  [
    receipt.code,
    formatDateShort(receipt.receiptDate),
    intoLabelOf(receipt),
    receipt.reference,
  ]
    .filter(Boolean)
    .join(" · ");

const statusOf = (receipt: CashReceipt) => (
  <ReceiptStatusBadge status={receipt.status} />
);

const totalOf = (receipt: CashReceipt) => (
  <span className="block truncate text-right tabular-nums">
    {formatRupiah(Number(receipt.totalAmount))}
  </span>
);

const editLink = (receipt: CashReceipt) =>
  isEditable(receipt.status) ? (
    <Link
      href={receiptEditHref(receipt.publicId)}
      onClick={() => saveFocus(receipt)}
      aria-label={`Ubah kas masuk ${receipt.code}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  receipt: CashReceipt;
  isCanUpdate?: boolean;
}

export const ReceiptListItemRow = (props: PropTypes) => {
  const { receipt, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={receipt.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(receipt)}
          onClick={() => saveFocus(receipt)}
          aria-label={viewLabelOf(receipt)}
          className={TABLE_ROW_LINK}
        >
          {receipt.payer}
        </Link>
      }
      meta={metaOf(receipt)}
      trailing={
        <>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-body font-medium tabular-nums">
              {formatRupiah(Number(receipt.totalAmount))}
            </span>
            {statusOf(receipt)}
          </span>
          {isCanUpdate ? editLink(receipt) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<CashReceipt>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.2fr)",
    cell: (receipt) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(receipt.receiptDate)}
      </span>
    ),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (receipt) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {receipt.code}
      </span>
    ),
  },
  {
    key: "payer",
    header: "Diterima dari",
    width: "minmax(0,2fr)",
    cell: (receipt) => (
      <span className="block truncate font-medium" title={receipt.payer}>
        {receipt.payer}
      </span>
    ),
  },
  {
    key: "into",
    header: "Masuk ke",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (receipt) => (
      <span
        className="text-muted-foreground block truncate"
        title={intoLabelOf(receipt)}
      >
        {intoLabelOf(receipt)}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total (Rp)",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: totalOf,
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: statusOf,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function receiptTable(
  isCanUpdate: boolean,
): DataTableConfig<CashReceipt> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
