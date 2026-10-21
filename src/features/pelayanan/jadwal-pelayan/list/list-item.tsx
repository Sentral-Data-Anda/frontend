import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  emptySlotCount,
  formatScheduleDate,
  formatTableDate,
  formatTimeRange,
  ibadahLabel,
  JADWAL_PELAYAN_LIST_PATH,
  jadwalDetailHref,
  jadwalEditHref,
} from "../model";
import type { JadwalPelayan } from "../types";

import { PetugasStatus } from "./petugas-status";

const saveFocus = (jadwal: JadwalPelayan) =>
  saveListFocus(JADWAL_PELAYAN_LIST_PATH, jadwal.code);

const detailHrefOf = (jadwal: JadwalPelayan) => jadwalDetailHref(jadwal.code);

const viewLabelOf = (jadwal: JadwalPelayan) =>
  `Lihat ${jadwal.name}, ${formatScheduleDate(jadwal.date)}`;

const metaOf = (jadwal: JadwalPelayan) =>
  [
    formatDateShort(jadwal.date),
    formatTimeRange(jadwal.startTime, jadwal.endTime),
    jadwal.bapel.name,
  ].join(" · ");

const ibadahTextOf = (jadwal: JadwalPelayan) => {
  const [first, ...rest] = jadwal.ibadah;

  if (!first) return null;

  return rest.length
    ? `${ibadahLabel(first)} +${rest.length}`
    : ibadahLabel(first);
};

interface PropTypes {
  jadwal: JadwalPelayan;
}

export const JadwalPelayanListItemRow = (props: PropTypes) => {
  const { jadwal } = props;

  return (
    <DataListRow
      id={jadwal.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(jadwal)}
          onClick={() => saveFocus(jadwal)}
          aria-label={viewLabelOf(jadwal)}
          className={TABLE_ROW_LINK}
        >
          {jadwal.name}
        </Link>
      }
      meta={metaOf(jadwal)}
      trailing={
        <>
          <PetugasStatus emptyCount={emptySlotCount(jadwal)} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<JadwalPelayan>;

const truncated = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.2fr)",
    cell: (jadwal) => (
      <span className="block truncate tabular-nums">
        {formatTableDate(jadwal.date)}
      </span>
    ),
  },
  {
    key: "name",
    header: "Nama",
    width: "minmax(0,2fr)",
    cell: (jadwal) => (
      <span className="block truncate font-medium" title={jadwal.name}>
        {jadwal.name}
      </span>
    ),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,1.5fr)",
    cell: (jadwal) => truncated(jadwal.bapel.name),
  },
  {
    key: "time",
    header: "Jam",
    width: "minmax(0,1fr)",
    cell: (jadwal) => (
      <span className="block truncate tabular-nums">
        {formatTimeRange(jadwal.startTime, jadwal.endTime)}
      </span>
    ),
  },
  {
    key: "petugas",
    header: "Petugas",
    width: "minmax(0,1.2fr)",
    cell: (jadwal) => (
      <PetugasStatus emptyCount={emptySlotCount(jadwal)} isShort />
    ),
  },
  {
    key: "ibadah",
    header: "Ibadah",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (jadwal) => (
      <OptionalText
        text={ibadahTextOf(jadwal)}
        empty="Belum ditaut ke ibadah"
      />
    ),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (jadwal) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {jadwal.code}
      </span>
    ),
  },
];

const deleteLabelOf = (x: JadwalPelayan) =>
  `Hapus ${x.name}, ${formatScheduleDate(x.date)}`;

export const deleteTargetLabelOf = (x: JadwalPelayan) =>
  `${x.name}, ${formatScheduleDate(x.date)}`;

export function jadwalPelayanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: JadwalPelayan) => void,
): DataTableConfig<JadwalPelayan> {
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
            href: jadwalEditHref(x.publicId),
            onNavigate: () => saveListFocus(JADWAL_PELAYAN_LIST_PATH, x.code),
            label: `Ubah ${x.name}, ${formatScheduleDate(x.date)}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
