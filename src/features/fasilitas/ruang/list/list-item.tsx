import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { MediaThumb } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import { RUANG_LIST_PATH, roomMetaOf, ruangDetailHref } from "../model";
import type { Room } from "../types";
import { RoomStatus } from "../ui";

import { EditLink } from "./edit-link";

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
  isCanUpdate?: boolean;
}

export const RuangListItemRow = (props: PropTypes) => {
  const { room, isCanUpdate = false } = props;

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
          {isCanUpdate ? <EditLink room={room} /> : null}
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

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: (room) => <EditLink room={room} />,
};

export function ruangTable(isCanUpdate: boolean): DataTableConfig<Room> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
