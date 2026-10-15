"use client";

import { Badge } from "@/components/common/display";
import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatNumber } from "@/lib/format";

import { TARGET_LABEL, targetOf } from "../model";
import type { ReturnItem } from "../types";

const nameOf = (item: ReturnItem) =>
  item.goodsReceiptItem.purchaseOrderItem.name;

const receivedOf = (item: ReturnItem) =>
  `Diterima ${formatNumber(item.goodsReceiptItem.quantityReceived)}`;

const targetBadge = (item: ReturnItem) => {
  const target = targetOf(item.goodsReceiptItem);

  return target ? (
    <Badge variant="outline">{TARGET_LABEL[target]}</Badge>
  ) : null;
};

// Nilai per baris tidak ditampilkan: retur tidak mengirim kurs pesanannya, dan
// mengalikan harga satuan mata uang asing tanpa kurs akan memajang angka yang
// bukan rupiah. Nilai rupiahnya ada di ringkasan, dihitung server.
const ITEM_TABLE: DataTableConfig<ReturnItem> = {
  columns: [
    {
      key: "name",
      header: "Nama barang",
      width: "minmax(0,3fr)",
      cell: (item) => (
        <span className="block truncate font-medium" title={nameOf(item)}>
          {nameOf(item)}
        </span>
      ),
    },
    {
      key: "target",
      header: "Tercatat sebagai",
      width: "minmax(0,1.4fr)",
      isSecondary: true,
      cell: targetBadge,
    },
    {
      key: "quantity",
      header: "Jumlah diretur",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate font-medium tabular-nums">
          {formatNumber(item.quantity)}
        </span>
      ),
    },
    {
      key: "received",
      header: "Diterima",
      width: "minmax(0,1fr)",
      align: "end",
      isSecondary: true,
      cell: (item) => (
        <span className="text-muted-foreground block truncate tabular-nums">
          {formatNumber(item.goodsReceiptItem.quantityReceived)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Alasan baris",
      width: "minmax(0,2fr)",
      cell: (item) => (
        <span
          className="text-muted-foreground block truncate"
          title={item.reason ?? undefined}
        >
          {item.reason ?? "—"}
        </span>
      ),
    },
  ],
};

interface PropTypes {
  items: ReturnItem[];
  isRefreshing: boolean;
}

export const ItemList = (props: PropTypes) => {
  const { items, isRefreshing } = props;

  return (
    <DataList
      items={items}
      getKey={(item) => item.publicId}
      label="Barang yang dikembalikan"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada baris"
      table={ITEM_TABLE}
    >
      {(item) => (
        <DataListRow
          title={
            <span className="flex flex-wrap items-center gap-2">
              {nameOf(item)}
              {targetBadge(item)}
            </span>
          }
          meta={[receivedOf(item), item.reason].filter(Boolean).join(" · ")}
          trailing={
            <span className="text-body font-medium tabular-nums">
              {formatNumber(item.quantity)}
            </span>
          }
        />
      )}
    </DataList>
  );
};
