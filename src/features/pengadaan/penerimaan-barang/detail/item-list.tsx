"use client";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatMoney, formatRupiah } from "@/lib/format";

import { quantityTextOf, type ReceiptGroup } from "../model";

import { TargetLinks } from "./target-links";

const priceOf = (group: ReceiptGroup) =>
  formatRupiah(Number(group.unitPriceIDR));

const foreignPriceOf = (group: ReceiptGroup, currencyCode: string) =>
  currencyCode === "IDR"
    ? null
    : formatMoney(Number(group.unitPrice), currencyCode);

const itemTable = (
  currencyCode: string,
  isAssetLinked: boolean,
  isStockLinked: boolean,
): DataTableConfig<ReceiptGroup> => ({
  columns: [
    {
      key: "item",
      header: "Barang dari pesanan",
      width: "minmax(0,2fr)",
      cell: (group) => (
        <span className="block truncate font-medium" title={group.name}>
          {group.name}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Jumlah",
      width: "minmax(0,0.8fr)",
      align: "end",
      cell: (group) => (
        <span className="block truncate tabular-nums">
          {quantityTextOf(group.quantity, group.unit)}
        </span>
      ),
    },
    {
      key: "price",
      header: "Harga satuan",
      width: "minmax(0,1.2fr)",
      align: "end",
      cell: (group) => (
        <span className="block min-w-0 text-right tabular-nums">
          <span className="block truncate">{priceOf(group)}</span>
          {foreignPriceOf(group, currencyCode) ? (
            <span className="text-muted-foreground block truncate text-caption">
              {foreignPriceOf(group, currencyCode)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "target",
      header: "Jadi",
      width: "minmax(0,2.5fr)",
      cell: (group) => (
        <span className="block truncate">
          <TargetLinks
            group={group}
            isAssetLinked={isAssetLinked}
            isStockLinked={isStockLinked}
          />
        </span>
      ),
    },
  ],
});

interface PropTypes {
  groups: ReceiptGroup[];
  currencyCode: string;
  isAssetLinked: boolean;
  isStockLinked: boolean;
  isRefreshing: boolean;
}

export const ItemList = (props: PropTypes) => {
  const { groups, currencyCode, isAssetLinked, isStockLinked, isRefreshing } =
    props;

  return (
    <DataList
      items={groups}
      getKey={(group) => group.key}
      label="Barang yang diterima"
      isRefreshing={isRefreshing}
      emptyTitle="Tidak ada barang di penerimaan ini"
      table={itemTable(currencyCode, isAssetLinked, isStockLinked)}
    >
      {(group) => (
        <DataListRow
          title={group.name}
          meta={
            <TargetLinks
              group={group}
              isAssetLinked={isAssetLinked}
              isStockLinked={isStockLinked}
            />
          }
          trailing={
            <span className="text-right tabular-nums">
              <span className="block text-body font-medium">
                {quantityTextOf(group.quantity, group.unit)}
              </span>
              <span className="text-muted-foreground block text-caption">
                {priceOf(group)}
              </span>
            </span>
          }
        />
      )}
    </DataList>
  );
};
