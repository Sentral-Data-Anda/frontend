import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatMoney, formatNumber, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

import { isForeign, quantityLabel, toIdr } from "../model";
import type { OrderDetail, OrderItem } from "../types";

const subtotalOf = (item: OrderItem) => item.quantity * Number(item.unitPrice);

const moneyCell = (
  foreign: number,
  currencyCode: string,
  rate: number,
  isEmphasis = false,
) => (
  <span className="block min-w-0 text-right tabular-nums">
    <span className={cn("block truncate", isEmphasis && "font-medium")}>
      {formatMoney(foreign, currencyCode)}
    </span>
    {isForeign(currencyCode) ? (
      <span className="text-muted-foreground block truncate text-caption">
        {formatRupiah(toIdr(foreign, rate))}
      </span>
    ) : null}
  </span>
);

const count = (value: number, isMuted: boolean) => (
  <span
    className={cn(
      "block truncate tabular-nums",
      isMuted && "text-muted-foreground",
    )}
  >
    {formatNumber(value)}
  </span>
);

const itemTable = (order: OrderDetail): DataTableConfig<OrderItem> => {
  const rate = Number(order.exchangeRate);

  return {
    columns: [
      {
        key: "item",
        header: "Barang",
        width: "minmax(0,2.5fr)",
        cell: (item) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium" title={item.name}>
              {item.name}
            </span>
            <span
              className="text-muted-foreground block truncate text-caption"
              title={item.description}
            >
              {item.description}
            </span>
          </span>
        ),
      },
      {
        key: "unit",
        header: "Satuan",
        width: "minmax(0,0.9fr)",
        isSecondary: true,
        cell: (item) => (
          <span className="block truncate">{item.unit.name}</span>
        ),
      },
      {
        key: "room",
        header: "Ruang",
        width: "minmax(0,1.4fr)",
        isSecondary: true,
        cell: (item) => (
          <span className="block truncate" title={item.room.name}>
            {item.room.name}
          </span>
        ),
      },
      {
        key: "ordered",
        header: "Dipesan",
        width: "minmax(0,0.8fr)",
        align: "end",
        cell: (item) => count(item.quantity, false),
      },
      {
        key: "received",
        header: "Diterima",
        width: "minmax(0,0.8fr)",
        align: "end",
        cell: (item) =>
          count(item.receivedQuantity, item.receivedQuantity === 0),
      },
      {
        key: "remaining",
        header: "Sisa",
        width: "minmax(0,0.8fr)",
        align: "end",
        cell: (item) =>
          count(item.remainingQuantity, item.remainingQuantity === 0),
      },
      {
        key: "price",
        header: "Harga",
        width: "minmax(0,1.3fr)",
        align: "end",
        isSecondary: true,
        cell: (item) =>
          moneyCell(Number(item.unitPrice), order.currencyCode, rate),
      },
      {
        key: "subtotal",
        header: "Subtotal",
        width: "minmax(0,1.4fr)",
        align: "end",
        cell: (item) =>
          moneyCell(subtotalOf(item), order.currencyCode, rate, true),
      },
    ],
  };
};

const metaOf = (item: OrderItem) =>
  [
    `Dipesan ${quantityLabel(item.quantity, item.unit.name)}`,
    `diterima ${formatNumber(item.receivedQuantity)}`,
    `sisa ${formatNumber(item.remainingQuantity)}`,
    item.room.name,
    item.description,
  ].join(" · ");

interface PropTypes {
  order: OrderDetail;
  isRefreshing: boolean;
}

export const ItemList = (props: PropTypes) => {
  const { order, isRefreshing } = props;

  const rate = Number(order.exchangeRate);

  return (
    <DataList
      items={order.items}
      getKey={(item) => item.publicId}
      label="Barang dipesan"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada barang"
      table={itemTable(order)}
    >
      {(item) => (
        <DataListRow
          title={item.name}
          meta={metaOf(item)}
          trailing={moneyCell(subtotalOf(item), order.currencyCode, rate, true)}
        />
      )}
    </DataList>
  );
};
