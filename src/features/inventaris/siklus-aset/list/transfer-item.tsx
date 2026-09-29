import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { CYCLE_LIST_PATH, transferHref } from "../model";
import type { Place, Transfer } from "../types";

const hrefOf = (row: Transfer) => transferHref(row.code);

const saveFocus = (row: Transfer) => saveListFocus(CYCLE_LIST_PATH, row.code);

const labelOf = (row: Transfer) =>
  `Lihat pindah lokasi ${row.asset.name}, ${formatDateShort(row.transferDate)}`;

const isSameRoom = (row: Transfer) => row.fromRoom.code === row.toRoom.code;

const routeOf = (row: Transfer) =>
  isSameRoom(row)
    ? `${row.fromBapel.name} → ${row.toBapel.name}`
    : `${row.fromRoom.name} → ${row.toRoom.name}`;

interface PropTypes {
  row: Transfer;
}

export const TransferItem = (props: PropTypes) => {
  const { row } = props;

  return (
    <DataListRow
      id={row.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={hrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={labelOf(row)}
          className={TABLE_ROW_LINK}
        >
          {row.asset.name}
        </Link>
      }
      meta={`${formatDateShort(row.transferDate)} · ${routeOf(row)}`}
      trailing={
        <ChevronRight className="text-muted-foreground size-4" aria-hidden />
      }
    />
  );
};

const placeCell = (room: Place, bapel: Place) => (
  <span className="block min-w-0">
    <span className="block truncate" title={room.name}>
      {room.name}
    </span>
    <span
      className="text-muted-foreground block truncate text-caption"
      title={bapel.name}
    >
      {bapel.name}
    </span>
  </span>
);

export const transferTable: DataTableConfig<Transfer> = {
  columns: [
    {
      key: "date",
      header: "Tanggal",
      width: "minmax(0,1fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatDateShort(row.transferDate)}
        </span>
      ),
    },
    {
      key: "asset",
      header: "Barang",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <span className="block truncate font-medium" title={row.asset.name}>
          {row.asset.name}
        </span>
      ),
    },
    {
      key: "from",
      header: "Dari",
      width: "minmax(0,2fr)",
      cell: (row) => placeCell(row.fromRoom, row.fromBapel),
    },
    {
      key: "to",
      header: "Ke",
      width: "minmax(0,2fr)",
      cell: (row) => placeCell(row.toRoom, row.toBapel),
    },
    {
      key: "reason",
      header: "Alasan",
      width: "minmax(0,2fr)",
      isSecondary: true,
      cell: (row) => <OptionalText text={row.reason} empty="Tanpa alasan" />,
    },
  ],
  getRowHref: hrefOf,
  getRowLabel: labelOf,
  onRowOpen: saveFocus,
  rowIcon: <ChevronRight />,
};
