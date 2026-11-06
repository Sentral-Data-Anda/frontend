import Link from "next/link";

import { Badge } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { todayJakarta } from "@/lib/date";
import { saveListFocus } from "@/lib/list-return";

import type { TugasSayaItem } from "../api";
import {
  formatScheduleDate,
  formatTableDate,
  formatTimeRange,
  JADWAL_PELAYAN_LIST_PATH,
  jadwalDetailHref,
} from "../model";

const roleOf = (item: TugasSayaItem) =>
  [item.role.name, item.musikSkill?.name].filter(Boolean).join(" · ");

const placeOf = (item: TugasSayaItem) =>
  item.ibadah[0]?.typeIbadah.name ?? item.jadwal.name;

const isToday = (item: TugasSayaItem) =>
  item.date.slice(0, 10) === todayJakarta();

const metaOf = (item: TugasSayaItem) =>
  [
    formatScheduleDate(item.date),
    formatTimeRange(item.startTime, item.endTime),
    placeOf(item),
    item.bapel.name,
  ].join(" · ");

export const tugasSayaKeyOf = (item: TugasSayaItem) =>
  [item.jadwal.code, item.date, item.startTime, item.role.name].join("|");

interface PropTypes {
  item: TugasSayaItem;
}

export const TugasSayaListItemRow = (props: PropTypes) => {
  const { item } = props;

  return (
    <DataListRow
      id={tugasSayaKeyOf(item)}
      title={
        <>
          <Link
            href={jadwalDetailHref(item.jadwal.code)}
            aria-label={`Lihat jadwal ${item.jadwal.name}`}
            className={TABLE_ROW_LINK}
          >
            {roleOf(item)}
          </Link>
          {item.group ? (
            <>
              <span className="sr-only"> lewat </span>
              <Badge variant="secondary" className="ml-2 align-middle">
                {item.group.name}
              </Badge>
            </>
          ) : null}
        </>
      }
      meta={metaOf(item)}
      trailing={isToday(item) ? <Badge>Hari ini</Badge> : undefined}
    />
  );
};

const truncated = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

const COLUMNS: DataTableColumn<TugasSayaItem>[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.5fr)",
    cell: (item) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate tabular-nums">
          {formatTableDate(item.date)}
        </span>
        {isToday(item) ? <Badge className="shrink-0">Hari ini</Badge> : null}
      </span>
    ),
  },
  {
    key: "time",
    header: "Jam",
    width: "minmax(0,0.9fr)",
    cell: (item) => (
      <span className="block truncate tabular-nums">
        {formatTimeRange(item.startTime, item.endTime)}
      </span>
    ),
  },
  {
    key: "role",
    header: "Tugas",
    width: "minmax(0,1.6fr)",
    cell: (item) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate" title={roleOf(item)}>
          {roleOf(item)}
        </span>
        {item.group ? (
          <Badge variant="secondary" className="shrink-0">
            {item.group.name}
          </Badge>
        ) : null}
      </span>
    ),
  },
  {
    key: "place",
    header: "Tempat",
    width: "minmax(0,1.6fr)",
    cell: (item) => truncated(placeOf(item)),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,1.5fr)",
    cell: (item) => truncated(item.bapel.name),
  },
];

const viewLabelOf = (item: TugasSayaItem) =>
  `Lihat jadwal ${item.jadwal.name}, ${formatScheduleDate(item.date)}`;

export const tugasSayaTable: DataTableConfig<TugasSayaItem> = {
  columns: COLUMNS,
  // Baris tabel sengaja bukan tautan; detail hanya terbuka lewat aksi ini.
  getRowActions: (item) => ({
    label: viewLabelOf(item),
    view: {
      href: jadwalDetailHref(item.jadwal.code),
      onNavigate: () =>
        saveListFocus(JADWAL_PELAYAN_LIST_PATH, item.jadwal.code),
      label: viewLabelOf(item),
    },
  }),
};
