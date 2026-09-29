"use client";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatNumber, formatRupiah } from "@/lib/format";

import type { PurchaseRequestItem } from "../types";

const priceOf = (item: PurchaseRequestItem) =>
  formatRupiah(Number(item.estimatedUnitPrice));

const subtotalOf = (item: PurchaseRequestItem) =>
  formatRupiah(item.quantity * Number(item.estimatedUnitPrice));

const ITEM_TABLE: DataTableConfig<PurchaseRequestItem> = {
  columns: [
    {
      key: "name",
      header: "Nama barang",
      width: "minmax(0,3fr)",
      cell: (item) => (
        <span className="block truncate font-medium" title={item.name}>
          {item.name}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Jumlah",
      width: "minmax(0,0.8fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate tabular-nums">
          {formatNumber(item.quantity)}
        </span>
      ),
    },
    {
      key: "price",
      header: "Perkiraan harga",
      width: "minmax(0,1.3fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate tabular-nums">{priceOf(item)}</span>
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      width: "minmax(0,1.3fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate font-medium tabular-nums">
          {subtotalOf(item)}
        </span>
      ),
    },
  ],
};

interface PropTypes {
  items: PurchaseRequestItem[];
  isRefreshing: boolean;
}

export const ItemList = (props: PropTypes) => {
  const { items, isRefreshing } = props;

  return (
    <DataList
      items={items}
      getKey={(item) => item.publicId}
      label="Barang yang diminta"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada barang"
      table={ITEM_TABLE}
    >
      {(item) => (
        <DataListRow
          title={item.name}
          meta={`${formatNumber(item.quantity)} × ${priceOf(item)}`}
          trailing={
            <span className="text-body font-medium tabular-nums">
              {subtotalOf(item)}
            </span>
          }
        />
      )}
    </DataList>
  );
};
