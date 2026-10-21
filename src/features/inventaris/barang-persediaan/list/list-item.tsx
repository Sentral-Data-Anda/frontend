import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatNumber } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  quantityOf,
  STOCK_LIST_PATH,
  stockDetailHref,
  stockEditHref,
} from "../model";
import type { StockItem } from "../types";
import { StockStatus } from "../ui";

const saveFocus = (item: StockItem) =>
  saveListFocus(STOCK_LIST_PATH, item.code);

const detailHrefOf = (item: StockItem) => stockDetailHref(item.code);

const viewLabelOf = (item: StockItem) => `Lihat barang persediaan ${item.name}`;

interface PropTypes {
  item: StockItem;
}

export const StockListItemRow = (props: PropTypes) => {
  const { item } = props;

  return (
    <DataListRow
      id={item.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(item)}
          onClick={() => saveFocus(item)}
          aria-label={viewLabelOf(item)}
          className={TABLE_ROW_LINK}
        >
          {item.name}
        </Link>
      }
      meta={`${quantityOf(item)} · ${item.room.name}`}
      trailing={
        <>
          <StockStatus item={item} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<StockItem>;

const COLUMNS: Column[] = [
  {
    key: "item",
    header: "Barang",
    width: "minmax(0,2.5fr)",
    cell: (item) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium" title={item.name}>
          {item.name}
        </span>
        <span className="text-muted-foreground block truncate text-caption tabular-nums">
          {item.code}
        </span>
      </span>
    ),
  },
  {
    key: "quantity",
    header: "Stok",
    width: "minmax(0,1fr)",
    align: "end",
    cell: (item) => (
      <span className="block truncate tabular-nums">{quantityOf(item)}</span>
    ),
  },
  {
    key: "reorderPoint",
    header: "Batas",
    width: "minmax(0,0.8fr)",
    align: "end",
    isSecondary: true,
    cell: (item) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {item.reorderPoint === null ? "—" : formatNumber(item.reorderPoint)}
      </span>
    ),
  },
  {
    key: "room",
    header: "Ruang",
    width: "minmax(0,1.5fr)",
    cell: (item) => (
      <span className="block truncate" title={item.room.name}>
        {item.room.name}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipe",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (item) => (
      <span className="block truncate" title={item.type.name}>
        {item.type.name}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: (item) => <StockStatus item={item} />,
  },
];

const deleteLabelOf = (x: StockItem) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: StockItem) => `${x.name}`;

export function persediaanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: StockItem) => void,
): DataTableConfig<StockItem> {
  return {
    columns: COLUMNS,
    getRowActions: (x) => ({
      label: viewLabelOf(x),
      view: {
        href: detailHrefOf(x),
        onNavigate: () => saveFocus(x),
        label: viewLabelOf(x),
      },
      edit: isCanUpdate
        ? {
            href: stockEditHref(x.publicId),
            onNavigate: () => saveListFocus(STOCK_LIST_PATH, x.code),
            label: `Ubah ${x.name}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
