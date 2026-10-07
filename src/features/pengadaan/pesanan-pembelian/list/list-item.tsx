import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import {
  formatAmount,
  formatDate,
  formatDateShort,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { ORDER_LIST_PATH, isForeign, orderEditHref, orderHref } from "../model";
import type { Order } from "../types";
import { OrderStatusBadge } from "../ui";

const saveFocus = (order: Order) => saveListFocus(ORDER_LIST_PATH, order.code);

const detailHrefOf = (order: Order) => orderHref(order.code);

const supplierNameOf = (order: Order) => order.supplier.name;

const viewLabelOf = (order: Order) =>
  `Lihat pesanan ${order.code} dari ${supplierNameOf(order)}, ${formatDate(order.orderDate)}`;

const foreignTotalOf = (order: Order) =>
  isForeign(order.currencyCode)
    ? formatMoney(Number(order.totalForeignCurrency), order.currencyCode)
    : null;

const orderMetaOf = (order: Order) =>
  [
    order.code,
    formatDateShort(order.orderDate),
    `${formatNumber(order.itemCount)} barang`,
    foreignTotalOf(order),
  ]
    .filter(Boolean)
    .join(" · ");

const statusOf = (order: Order) => (
  <OrderStatusBadge
    status={order.status}
    note={order.closedShort ? "ditutup" : null}
  />
);

const editLink = (order: Order) =>
  order.status === "ISSUED" ? (
    <Link
      href={orderEditHref(order.code)}
      onClick={() => saveFocus(order)}
      aria-label={`Ubah pesanan ${order.code}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  order: Order;
  isCanUpdate?: boolean;
}

export const OrderListItemRow = (props: PropTypes) => {
  const { order, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={order.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(order)}
          onClick={() => saveFocus(order)}
          aria-label={viewLabelOf(order)}
          className={TABLE_ROW_LINK}
        >
          {supplierNameOf(order)}
        </Link>
      }
      meta={orderMetaOf(order)}
      trailing={
        <>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-body font-medium tabular-nums">
              {formatAmount(order.totalIDR)}
            </span>
            {statusOf(order)}
          </span>
          {isCanUpdate ? editLink(order) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<Order>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1fr)",
    cell: (order) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(order.orderDate)}
      </span>
    ),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (order) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {order.code}
      </span>
    ),
  },
  {
    key: "supplier",
    header: "Supplier",
    width: "minmax(0,2fr)",
    cell: (order) => (
      <span
        className="block truncate font-medium"
        title={supplierNameOf(order)}
      >
        {supplierNameOf(order)}
      </span>
    ),
  },
  {
    key: "request",
    header: "Permintaan",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (order) => (
      <span
        className="text-muted-foreground block truncate tabular-nums"
        title={order.purchaseRequest.purpose}
      >
        {order.purchaseRequest.code}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total (Rp)",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: (order) => (
      <span className="block min-w-0 text-right">
        <span className="block truncate tabular-nums">
          {formatAmount(order.totalIDR)}
        </span>
        {foreignTotalOf(order) ? (
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {foreignTotalOf(order)}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.4fr)",
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

export function orderTable(isCanUpdate: boolean): DataTableConfig<Order> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
