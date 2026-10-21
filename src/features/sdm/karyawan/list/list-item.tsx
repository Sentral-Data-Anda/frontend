import { Avatar, Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { KARYAWAN_LIST_PATH } from "../model";
import { EMPLOYMENT_STATUS_LABEL, type Karyawan } from "../types";

const STATUS_VARIANT = {
  ACTIVE: "success",
  RESIGNED: "neutral",
  TERMINATED: "neutral",
} as const;

const editHrefOf = (row: Karyawan) =>
  editHref(MENU.HR, MENU.EMPLOYEE, row.publicId);

const saveFocus = (row: Karyawan) =>
  saveListFocus(KARYAWAN_LIST_PATH, row.code);

const labelOf = (row: Karyawan) => `Ubah ${row.name}`;

const statusBadge = (row: Karyawan) => (
  <Badge variant={STATUS_VARIANT[row.status]}>
    {EMPLOYMENT_STATUS_LABEL[row.status]}
  </Badge>
);

interface PropTypes {
  row: Karyawan;
}

export const KaryawanListItem = (props: PropTypes) => {
  const { row } = props;

  return (
    <DataListRow
      id={row.code}
      leading={<Avatar label={row.name} />}
      title={row.name}
      meta={`${row.position} · ${row.code}`}
      trailing={<>{statusBadge(row)}</>}
    />
  );
};

const deleteLabelOf = (x: Karyawan) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: Karyawan) => `${x.name}`;

export function karyawanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Karyawan) => void,
): DataTableConfig<Karyawan> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (row) => (
          <span className="block truncate font-medium" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        key: "position",
        header: "Jabatan",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (row) => (
          <span className="block truncate" title={row.position}>
            {row.position}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (row) => (
          <span className="block truncate tabular-nums">{row.code}</span>
        ),
      },
      {
        key: "phone",
        header: "Telepon",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="block truncate tabular-nums">{row.phone}</span>
        ),
      },
      {
        key: "joinDate",
        header: "Bergabung",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="block truncate tabular-nums">
            {formatDateShort(row.joinDate)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1.3fr)",
        narrowWidth: "minmax(0,1.3fr)",
        cell: statusBadge,
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
