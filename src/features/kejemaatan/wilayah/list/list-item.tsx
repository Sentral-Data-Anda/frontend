import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { WILAYAH_LIST_PATH } from "../model";
import type { Wilayah } from "../types";

import { WilayahStatus } from "./wilayah-status";

const editHrefOf = (wilayah: Wilayah) =>
  editHref(MENU.KEJEMAATAN, MENU.WILAYAH, wilayah.publicId);

const saveFocus = (wilayah: Wilayah) =>
  saveListFocus(WILAYAH_LIST_PATH, wilayah.code);

const labelOf = (wilayah: Wilayah) => `Ubah ${wilayah.name}`;

const deleteLabelOf = (wilayah: Wilayah) => `Hapus ${wilayah.name}`;

interface PropTypes {
  wilayah: Wilayah;
}

export const WilayahListItemRow = (props: PropTypes) => {
  const { wilayah } = props;

  return (
    <DataListRow
      id={wilayah.code}
      title={wilayah.name}
      meta={wilayah.code}
      trailing={
        <>{wilayah.isActive ? null : <WilayahStatus isActive={false} />}</>
      }
    />
  );
};

export function wilayahTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (wilayah: Wilayah) => void,
): DataTableConfig<Wilayah> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (wilayah) => (
          <span className="block truncate font-medium" title={wilayah.name}>
            {wilayah.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (wilayah) => <span className="tabular-nums">{wilayah.code}</span>,
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (wilayah) => <WilayahStatus isActive={wilayah.isActive} />,
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
