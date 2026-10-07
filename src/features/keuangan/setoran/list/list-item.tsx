import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount, formatDate, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { TRANSFER_LIST_PATH, transferHref, transferPathOf } from "../model";
import type { Transfer } from "../types";
import { TransferStatusBadge } from "../ui";

const saveFocus = (transfer: Transfer) =>
  saveListFocus(TRANSFER_LIST_PATH, transfer.code);

const detailHrefOf = (transfer: Transfer) => transferHref(transfer.code);

const viewLabelOf = (transfer: Transfer) =>
  `Lihat setoran ${transfer.code}, ${transferPathOf(transfer)}, ${formatDate(transfer.transferDate)}`;

const metaOf = (transfer: Transfer) =>
  [transfer.code, formatDateShort(transfer.transferDate), transfer.description]
    .filter(Boolean)
    .join(" · ");

const truncated = (text: string, className = "") => (
  <span className={cn("block truncate", className)} title={text}>
    {text}
  </span>
);

const amountOf = (transfer: Transfer) => formatAmount(transfer.amount);

interface PropTypes {
  transfer: Transfer;
}

export const TransferListItemRow = (props: PropTypes) => {
  const { transfer } = props;

  return (
    <DataListRow
      id={transfer.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(transfer)}
          onClick={() => saveFocus(transfer)}
          aria-label={viewLabelOf(transfer)}
          className={TABLE_ROW_LINK}
        >
          {transferPathOf(transfer)}
        </Link>
      }
      meta={metaOf(transfer)}
      trailing={
        <span className="flex flex-col items-end gap-0.5">
          <span className="text-body font-medium tabular-nums">
            {amountOf(transfer)}
          </span>
          <TransferStatusBadge status={transfer.status} />
        </span>
      }
    />
  );
};

const COLUMNS: DataTableColumn<Transfer>[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.2fr)",
    cell: (transfer) =>
      truncated(formatDateShort(transfer.transferDate), "tabular-nums"),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (transfer) =>
      truncated(transfer.code, "text-muted-foreground tabular-nums"),
  },
  {
    key: "from",
    header: "Dari",
    width: "minmax(0,1.8fr)",
    cell: (transfer) => truncated(transfer.fromAccount.name, "font-medium"),
  },
  {
    key: "to",
    header: "Ke",
    width: "minmax(0,1.8fr)",
    cell: (transfer) => truncated(transfer.toAccount.name, "font-medium"),
  },
  {
    key: "amount",
    header: "Jumlah (Rp)",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: (transfer) => truncated(amountOf(transfer), "tabular-nums"),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: (transfer) => <TransferStatusBadge status={transfer.status} />,
  },
];

export function transferTable(): DataTableConfig<Transfer> {
  return {
    columns: COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
