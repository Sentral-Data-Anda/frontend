"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataList,
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";

import { quantityOf, stockItemHref } from "../model";
import type { OpnameItem } from "../types";
import { DifferenceText } from "../ui";

const MISSING_NOTE = "Tulis alasan selisih";

const unitOf = (item: OpnameItem) => item.stockItem.unit.name;

const noteCell = (item: OpnameItem, isMissing: boolean) =>
  isMissing ? (
    <span className="text-destructive block truncate">{MISSING_NOTE}</span>
  ) : (
    <OptionalText text={item.note} empty="Tanpa catatan" />
  );

const countTable = (
  isLinked: boolean,
  noteIssueRows: ReadonlySet<number>,
  indexOf: (item: OpnameItem) => number,
): DataTableConfig<OpnameItem> => ({
  columns: [
    {
      key: "item",
      header: "Barang",
      width: "minmax(0,2.5fr)",
      cell: (item) => (
        <span className="block min-w-0">
          <span
            className="block truncate font-medium"
            title={item.stockItem.name}
          >
            {item.stockItem.name}
          </span>
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {item.stockItem.code}
          </span>
        </span>
      ),
    },
    {
      key: "system",
      header: "Di aplikasi",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate tabular-nums">
          {quantityOf(item.systemQuantity, unitOf(item))}
        </span>
      ),
    },
    {
      key: "physical",
      header: "Fisik",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (item) => (
        <span className="block truncate tabular-nums">
          {quantityOf(item.physicalQuantity, unitOf(item))}
        </span>
      ),
    },
    {
      key: "difference",
      header: "Selisih",
      width: "minmax(0,0.8fr)",
      align: "end",
      cell: (item) => <DifferenceText difference={item.difference} />,
    },
    {
      key: "note",
      header: "Catatan",
      width: "minmax(0,2fr)",
      isSecondary: true,
      cell: (item) => noteCell(item, noteIssueRows.has(indexOf(item))),
    },
  ],
  getRowHref: isLinked
    ? (item) => stockItemHref(item.stockItem.code)
    : undefined,
  getRowLabel: (item) => `Lihat barang persediaan ${item.stockItem.name}`,
  rowIcon: <ChevronRight />,
});

interface PropTypes {
  items: OpnameItem[];
  isLinked: boolean;
  isRefreshing: boolean;
  noteIssueRows: ReadonlySet<number>;
}

export const CountList = (props: PropTypes) => {
  const { items, isLinked, isRefreshing, noteIssueRows } = props;

  const indexOf = (item: OpnameItem) => items.indexOf(item);

  return (
    <DataList
      items={items}
      getKey={(item) => item.publicId}
      label="Barang yang dihitung"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada barang yang dihitung"
      table={countTable(isLinked, noteIssueRows, indexOf)}
    >
      {(item) => {
        const isMissing = noteIssueRows.has(indexOf(item));

        return (
          <DataListRow
            title={
              isLinked ? (
                <Link
                  href={stockItemHref(item.stockItem.code)}
                  className={TABLE_ROW_LINK}
                >
                  {item.stockItem.name}
                </Link>
              ) : (
                item.stockItem.name
              )
            }
            className={
              isLinked ? "hover:bg-card relative transition-colors" : undefined
            }
            meta={
              <>
                {`Di aplikasi ${quantityOf(item.systemQuantity, unitOf(item))} · Fisik ${quantityOf(item.physicalQuantity, unitOf(item))}`}
                {isMissing ? (
                  <span className="text-destructive"> · {MISSING_NOTE}</span>
                ) : item.note ? (
                  ` · ${item.note}`
                ) : null}
              </>
            }
            trailing={<DifferenceText difference={item.difference} />}
          />
        );
      }}
    </DataList>
  );
};
