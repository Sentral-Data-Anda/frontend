import { ChevronRight } from "lucide-react";
import Link from "next/link";

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
  PAYMENT_LIST_PATH,
  PURPOSE_LABEL,
  STALE_PENDING_NOTE,
  bookedOf,
  giverOf,
  isStalePending,
  paymentDateOf,
  paymentHref,
} from "../model";
import type { Payment } from "../types";
import { BookedBadge, PaymentStatusBadge } from "../ui";

const saveFocus = (row: Payment) =>
  saveListFocus(PAYMENT_LIST_PATH, row.publicId);

const detailHrefOf = (row: Payment) => paymentHref(row.publicId);

const viewLabelOf = (row: Payment) =>
  `Lihat pembayaran ${row.code}, ${giverOf(row)}, ${formatAmount(row.amount)}`;

const StaleNote = () => (
  <span className="text-muted-foreground block text-caption">
    {STALE_PENDING_NOTE}
  </span>
);

const metaOf = (row: Payment) =>
  [
    PURPOSE_LABEL[row.purpose],
    giverOf(row),
    ...(isStalePending(row) ? [STALE_PENDING_NOTE] : []),
  ].join(" · ");

interface PropTypes {
  row: Payment;
}

export const PaymentListItem = (props: PropTypes) => {
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
          className={cn(TABLE_ROW_LINK, "tabular-nums")}
        >
          {formatAmount(row.amount)}
        </Link>
      }
      meta={metaOf(row)}
      trailing={
        <>
          <span className="text-muted-foreground text-caption tabular-nums">
            {formatDateShort(paymentDateOf(row))}
          </span>
          <PaymentStatusBadge status={row.status} />
          {bookedOf(row) === false ? <BookedBadge isBooked={false} /> : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<Payment>;

export function paymentTable(): DataTableConfig<Payment> {
  const columns: Column[] = [
    {
      key: "date",
      header: "Tanggal",
      width: "minmax(0,1.2fr)",
      narrowWidth: "minmax(0,1.5fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatDateShort(paymentDateOf(row))}
        </span>
      ),
    },
    {
      key: "code",
      header: "Kode",
      width: "minmax(0,1.3fr)",
      narrowWidth: "minmax(0,1.9fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">{row.code}</span>
      ),
    },
    {
      key: "purpose",
      header: "Tujuan",
      width: "minmax(0,1.3fr)",
      narrowWidth: "minmax(0,1.2fr)",
      cell: (row) => (
        <span className="block truncate">{PURPOSE_LABEL[row.purpose]}</span>
      ),
    },
    {
      key: "giver",
      header: "Pemberi",
      width: "minmax(0,2fr)",
      narrowWidth: "minmax(0,1.8fr)",
      cell: (row) => (
        <span className="block truncate font-medium" title={giverOf(row)}>
          {giverOf(row)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      width: "minmax(0,1.3fr)",
      narrowWidth: "minmax(0,1.5fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatAmount(row.amount)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Metode",
      width: "minmax(0,1fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate">
          {row.method ?? "—"}
        </span>
      ),
    },
    {
      key: "booked",
      header: "Di buku",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,0.9fr)",
      cell: (row) => <BookedBadge isBooked={bookedOf(row)} />,
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1.2fr)",
      narrowWidth: "minmax(0,1.3fr)",
      cell: (row) => (
        <span className="block">
          <PaymentStatusBadge status={row.status} />
          {isStalePending(row) ? <StaleNote /> : null}
        </span>
      ),
    },
  ];

  return {
    columns,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
