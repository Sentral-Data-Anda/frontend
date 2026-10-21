import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { TIPE_BARANG_LIST_PATH } from "../model";
import type { TipeBarang } from "../types";

const editHrefOf = (tipeBarang: TipeBarang) =>
  editHref(MENU.INVENTORY, MENU.ITEM_CATEGORY, tipeBarang.publicId);

const saveFocus = (tipeBarang: TipeBarang) =>
  saveListFocus(TIPE_BARANG_LIST_PATH, tipeBarang.code);

const labelOf = (tipeBarang: TipeBarang) => `Ubah ${tipeBarang.name}`;

interface PropTypes {
  tipeBarang: TipeBarang;
}

export const TipeBarangListItemRow = (props: PropTypes) => {
  const { tipeBarang } = props;

  return (
    <DataListRow
      id={tipeBarang.code}
      title={tipeBarang.name}
      meta={tipeBarang.code}
    />
  );
};

const deleteLabelOf = (x: TipeBarang) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: TipeBarang) => `${x.name}`;

export function tipeBarangTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: TipeBarang) => void,
): DataTableConfig<TipeBarang> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (tipeBarang) => (
          <span className="block truncate font-medium" title={tipeBarang.name}>
            {tipeBarang.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeBarang) => (
          <span className="tabular-nums">{tipeBarang.code}</span>
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
