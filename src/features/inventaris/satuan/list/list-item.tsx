import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { SATUAN_LIST_PATH } from "../model";
import type { Satuan } from "../types";

const editHrefOf = (satuan: Satuan) =>
  editHref(MENU.INVENTORY, MENU.SATUAN, satuan.publicId);

const saveFocus = (satuan: Satuan) =>
  saveListFocus(SATUAN_LIST_PATH, satuan.code);

const labelOf = (satuan: Satuan) => `Ubah ${satuan.name}`;

interface PropTypes {
  satuan: Satuan;
}

export const SatuanListItemRow = (props: PropTypes) => {
  const { satuan } = props;

  return (
    <DataListRow id={satuan.code} title={satuan.name} meta={satuan.code} />
  );
};

const deleteLabelOf = (x: Satuan) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: Satuan) => `${x.name}`;

export function satuanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Satuan) => void,
): DataTableConfig<Satuan> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (satuan) => (
          <span className="block truncate font-medium" title={satuan.name}>
            {satuan.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (satuan) => <span className="tabular-nums">{satuan.code}</span>,
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
