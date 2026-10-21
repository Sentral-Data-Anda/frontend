import Link from "next/link";

import { MediaThumb } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  roomMetaOf,
  RUANG_LIST_PATH,
  ruangDetailHref,
  ruangEditHref,
} from "../model";
import type { Room } from "../types";
import { RoomStatus } from "../ui";

const saveFocus = (room: Room) => saveListFocus(RUANG_LIST_PATH, room.code);

const detailHrefOf = (room: Room) => ruangDetailHref(room.code);

const viewLabelOf = (room: Room) => `Lihat ruang ${room.name}`;

const photoOf = (room: Room) => (
  <MediaThumb
    src={room.mainImage?.url ?? null}
    alt={room.mainImage?.name ?? room.name}
  />
);

interface PropTypes {
  room: Room;
}

export const RuangListItemRow = (props: PropTypes) => {
  const { room } = props;

  return (
    <DataListRow
      id={room.code}
      isTitleWrap
      className="hover:bg-card relative transition-colors"
      leading={photoOf(room)}
      title={
        <Link
          href={detailHrefOf(room)}
          onClick={() => saveFocus(room)}
          aria-label={viewLabelOf(room)}
          className={TABLE_ROW_LINK}
        >
          {room.name}
        </Link>
      }
      meta={<span className="tabular-nums">{roomMetaOf(room)}</span>}
      trailing={
        <>
          <RoomStatus isActive={room.isActive} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<Room>;

const COLUMNS: Column[] = [
  {
    key: "room",
    header: "Ruang",
    width: "minmax(0,2.5fr)",
    cell: (room) => (
      <span className="flex min-w-0 items-center gap-3">
        {photoOf(room)}
        <span className="min-w-0">
          <span className="block truncate font-medium" title={room.name}>
            {room.name}
          </span>
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {room.code}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: "capacity",
    header: "Kapasitas",
    width: "minmax(0,1fr)",
    cell: (room) => (
      <span className="block truncate tabular-nums">{room.capacity} orang</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: (room) => <RoomStatus isActive={room.isActive} />,
  },
];

const deleteLabelOf = (x: Room) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: Room) => `${x.name}`;

export function ruangTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Room) => void,
): DataTableConfig<Room> {
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
            href: ruangEditHref(x.publicId),
            onNavigate: () => saveListFocus(RUANG_LIST_PATH, x.code),
            label: `Ubah ${x.name}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
