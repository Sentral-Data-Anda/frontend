import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { placeLabelOf } from "@/lib/ibadah-place";
import { saveListFocus } from "@/lib/list-return";

import {
  IBADAH_LIST_PATH,
  attendanceLabel,
  formatServiceDate,
  formatServiceTime,
} from "../model";
import type { Ibadah } from "../types";

const editHrefOf = (ibadah: Ibadah) =>
  editHref(MENU.PERIBADAHAN, MENU.IBADAH, ibadah.publicId);

const saveFocus = (ibadah: Ibadah) =>
  saveListFocus(IBADAH_LIST_PATH, ibadah.code);

const labelOf = (ibadah: Ibadah) =>
  `Ubah ${ibadah.typeIbadah.name}, ${formatServiceDate(ibadah.date)}`;

const metaOf = (ibadah: Ibadah) =>
  [
    formatServiceDate(ibadah.date),
    formatServiceTime(ibadah.startTime, null),
    placeLabelOf(ibadah),
  ].join(" · ");

const attendanceCell = (ibadah: Ibadah) => {
  const label = attendanceLabel(ibadah);

  return label ? (
    <span className="text-muted-foreground block truncate tabular-nums">
      {label}
    </span>
  ) : (
    <OptionalText text={null} empty="Belum ada hitungan" />
  );
};

interface PropTypes {
  ibadah: Ibadah;
}

export const IbadahListItemRow = (props: PropTypes) => {
  const { ibadah } = props;

  const attendance = attendanceLabel(ibadah);

  return (
    <DataListRow
      id={ibadah.code}
      title={ibadah.typeIbadah.name}
      meta={metaOf(ibadah)}
      trailing={
        <>
          {attendance ? (
            <span className="text-muted-foreground shrink-0 text-caption tabular-nums">
              {attendance}
            </span>
          ) : null}
        </>
      }
    />
  );
};

const deleteLabelOf = (x: Ibadah) =>
  `Hapus ${x.typeIbadah.name}, ${formatServiceDate(x.date)}`;

export const deleteTargetLabelOf = (x: Ibadah) =>
  `${x.typeIbadah.name}, ${formatServiceDate(x.date)}`;

export function ibadahTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Ibadah) => void,
): DataTableConfig<Ibadah> {
  return {
    columns: [
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1.8fr)",
        narrowWidth: "minmax(0,1.7fr)",
        cell: (ibadah) => (
          <span className="block truncate tabular-nums">
            {formatServiceDate(ibadah.date)}
          </span>
        ),
      },
      {
        key: "time",
        header: "Jam",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (ibadah) => (
          <span className="block truncate tabular-nums">
            {formatServiceTime(ibadah.startTime, ibadah.endTime)}
          </span>
        ),
      },
      {
        key: "type",
        header: "Tipe ibadah",
        width: "minmax(0,1.6fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (ibadah) => (
          <span
            className="block truncate font-medium"
            title={ibadah.typeIbadah.name}
          >
            {ibadah.typeIbadah.name}
          </span>
        ),
      },
      {
        key: "theme",
        header: "Tema",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (ibadah) => (
          <OptionalText text={ibadah.theme} empty="Tanpa tema" />
        ),
      },
      {
        key: "preacher",
        header: "Pengkhotbah",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (ibadah) => (
          <OptionalText text={ibadah.preacher} empty="Tanpa pengkhotbah" />
        ),
      },
      {
        key: "place",
        header: "Tempat",
        width: "minmax(0,1.4fr)",
        isSecondary: true,
        cell: (ibadah) => (
          <OptionalText text={placeLabelOf(ibadah)} empty="Tanpa tempat" />
        ),
      },
      {
        key: "attendance",
        header: "Hadir",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        align: "end",
        cell: attendanceCell,
      },
    ],
    getRowActions: (x) => ({
      label: labelOf(x),
      edit: {
        href: isCanUpdate ? editHrefOf(x) : undefined,
        onNavigate: () => saveFocus(x),
        label: labelOf(x),
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
