import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDate, formatNumber } from "@/lib/format";

import { TYPE_LABEL, sourceLabelOf, stockItemHref } from "../model";
import type { Movement } from "../types";

import { QuantityCell } from "./quantity-cell";

const ITEM_LINK =
  "focus-visible:ring-ring -mx-1 block min-w-0 cursor-pointer truncate rounded-sm px-1 font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2";

const itemNameOf = (movement: Movement, isCanViewItem: boolean) =>
  isCanViewItem ? (
    <Link
      href={stockItemHref(movement.stockItem.code)}
      title={movement.stockItem.name}
      className={ITEM_LINK}
    >
      {movement.stockItem.name}
    </Link>
  ) : (
    movement.stockItem.name
  );

interface PropTypes {
  movement: Movement;
  isCanViewItem?: boolean;
}

export const MutasiListItemRow = (props: PropTypes) => {
  const { movement, isCanViewItem = false } = props;

  return (
    <DataListRow
      id={movement.publicId}
      title={itemNameOf(movement, isCanViewItem)}
      meta={`${formatDate(movement.movementDate)} · ${sourceLabelOf(movement)}`}
      trailing={<QuantityCell movement={movement} isBalanceShown />}
    />
  );
};

type Column = DataTableColumn<Movement>;

const columnsOf = (isCanViewItem: boolean): Column[] => [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1fr)",
    cell: (movement) => (
      <span className="block truncate tabular-nums">
        {formatDate(movement.movementDate)}
      </span>
    ),
  },
  {
    key: "item",
    header: "Barang",
    width: "minmax(0,2.5fr)",
    cell: (movement) => (
      <span className="block min-w-0">
        <span className="block truncate">
          {itemNameOf(movement, isCanViewItem)}
        </span>
        <span className="text-muted-foreground block truncate text-caption tabular-nums">
          {movement.stockItem.code} · {movement.stockItem.room.name}
        </span>
      </span>
    ),
  },
  {
    key: "type",
    header: "Jenis",
    width: "minmax(0,0.8fr)",
    cell: (movement) => (
      <span className="block truncate">{TYPE_LABEL[movement.type]}</span>
    ),
  },
  {
    key: "source",
    header: "Sumber",
    width: "minmax(0,1.2fr)",
    cell: (movement) => (
      <span className="block truncate">{sourceLabelOf(movement)}</span>
    ),
  },
  {
    key: "quantity",
    header: "Jumlah",
    width: "minmax(0,1fr)",
    align: "end",
    cell: (movement) => <QuantityCell movement={movement} />,
  },
  {
    key: "balance",
    header: "Sisa",
    width: "minmax(0,0.8fr)",
    align: "end",
    cell: (movement) => (
      <span className="block truncate tabular-nums">
        {formatNumber(movement.balanceAfter)}
      </span>
    ),
  },
  {
    key: "note",
    header: "Catatan",
    width: "minmax(0,2fr)",
    isSecondary: true,
    cell: (movement) => (
      <span className="text-muted-foreground block min-w-0">
        <OptionalText text={movement.note} empty="Tanpa catatan" />
      </span>
    ),
  },
];

export function mutasiTable(isCanViewItem = false): DataTableConfig<Movement> {
  return { columns: columnsOf(isCanViewItem) };
}
