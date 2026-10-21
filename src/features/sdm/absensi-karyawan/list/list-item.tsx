import { Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { ABSENSI_LIST_PATH, clockTextOf, hoursTextOf } from "../model";
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_STATUS_VARIANT,
  type AbsensiKaryawan,
} from "../types";

const editHrefOf = (row: AbsensiKaryawan) =>
  editHref(MENU.HR, MENU.ATTENDANCE, row.publicId);

const saveFocus = (row: AbsensiKaryawan) =>
  saveListFocus(ABSENSI_LIST_PATH, row.publicId);

const labelOf = (row: AbsensiKaryawan) =>
  `Ubah absensi ${row.karyawan.name} ${formatDate(row.date)}`;

const metaOf = (row: AbsensiKaryawan) =>
  `${formatDate(row.date)} · ${row.karyawan.code} · ${hoursTextOf(row)}`;

const StatusBadge = ({ row }: { row: AbsensiKaryawan }) => (
  <Badge variant={ATTENDANCE_STATUS_VARIANT[row.status]}>
    {ATTENDANCE_STATUS_LABEL[row.status]}
  </Badge>
);

interface PropTypes {
  absensi: AbsensiKaryawan;
}

export const AbsensiListItemRow = (props: PropTypes) => {
  const { absensi } = props;

  return (
    <DataListRow
      id={absensi.publicId}
      title={absensi.karyawan.name}
      meta={metaOf(absensi)}
      trailing={
        <>
          <StatusBadge row={absensi} />
        </>
      }
    />
  );
};

const deleteLabelOf = (x: AbsensiKaryawan) =>
  `Hapus absensi ${x.karyawan.name} ${formatDate(x.date)}`;

export const deleteTargetLabelOf = (x: AbsensiKaryawan) =>
  `absensi ${x.karyawan.name} ${formatDate(x.date)}`;

export function absensiTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: AbsensiKaryawan) => void,
): DataTableConfig<AbsensiKaryawan> {
  return {
    columns: [
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (row) => (
          <span className="block truncate font-medium">
            {formatDate(row.date)}
          </span>
        ),
      },
      {
        key: "karyawan",
        header: "Karyawan",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (row) => (
          <span className="block truncate" title={row.karyawan.name}>
            {row.karyawan.name}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (row) => <StatusBadge row={row} />,
      },
      {
        key: "checkIn",
        header: "Masuk",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="block truncate tabular-nums">
            {clockTextOf(row.checkIn)}
          </span>
        ),
      },
      {
        key: "checkOut",
        header: "Pulang",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="block truncate tabular-nums">
            {clockTextOf(row.checkOut)}
          </span>
        ),
      },
      {
        key: "note",
        header: "Catatan",
        width: "minmax(0,2fr)",
        isSecondary: true,
        cell: (row) => (
          <span
            className="text-muted-foreground block truncate"
            title={row.note ?? undefined}
          >
            {row.note ?? "—"}
          </span>
        ),
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
