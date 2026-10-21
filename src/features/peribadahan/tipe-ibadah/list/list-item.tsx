import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { TIPE_IBADAH_LIST_PATH } from "../model";
import type { TipeIbadah } from "../types";

import { TipeIbadahStatus } from "./tipe-ibadah-status";

const editHrefOf = (tipeIbadah: TipeIbadah) =>
  editHref(MENU.PERIBADAHAN, MENU.TIPE_IBADAH, tipeIbadah.publicId);

const saveFocus = (tipeIbadah: TipeIbadah) =>
  saveListFocus(TIPE_IBADAH_LIST_PATH, tipeIbadah.code);

const labelOf = (tipeIbadah: TipeIbadah) => `Ubah ${tipeIbadah.name}`;

interface PropTypes {
  tipeIbadah: TipeIbadah;
}

export const TipeIbadahListItemRow = (props: PropTypes) => {
  const { tipeIbadah } = props;

  return (
    <DataListRow
      id={tipeIbadah.code}
      title={tipeIbadah.name}
      meta={tipeIbadah.code}
      trailing={
        <>
          {tipeIbadah.isActive ? null : <TipeIbadahStatus isActive={false} />}
        </>
      }
    />
  );
};

const deleteLabelOf = (x: TipeIbadah) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: TipeIbadah) => `${x.name}`;

export function tipeIbadahTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: TipeIbadah) => void,
): DataTableConfig<TipeIbadah> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (tipeIbadah) => (
          <span className="block truncate font-medium" title={tipeIbadah.name}>
            {tipeIbadah.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeIbadah) => (
          <span className="tabular-nums">{tipeIbadah.code}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeIbadah) => (
          <TipeIbadahStatus isActive={tipeIbadah.isActive} />
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
