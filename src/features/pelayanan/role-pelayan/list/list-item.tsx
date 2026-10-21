import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { ROLE_PELAYAN_LIST_PATH, isPemusikRole } from "../model";
import type { RolePelayan } from "../types";

const editHrefOf = (rolePelayan: RolePelayan) =>
  editHref(MENU.PELAYANAN, MENU.ROLE_PELAYAN, String(rolePelayan.id));

const saveFocus = (rolePelayan: RolePelayan) =>
  saveListFocus(ROLE_PELAYAN_LIST_PATH, String(rolePelayan.id));

const labelOf = (rolePelayan: RolePelayan) => `Ubah ${rolePelayan.name}`;

interface PropTypes {
  rolePelayan: RolePelayan;
}

export const RolePelayanListItemRow = (props: PropTypes) => {
  const { rolePelayan } = props;

  return (
    <DataListRow
      id={String(rolePelayan.id)}
      title={rolePelayan.name}
      meta={
        isPemusikRole(rolePelayan.name)
          ? "Dipakai untuk memilih alat musik di jadwal"
          : undefined
      }
    />
  );
};

const deleteLabelOf = (x: RolePelayan) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: RolePelayan) => `${x.name}`;

export function rolePelayanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: RolePelayan) => void,
): DataTableConfig<RolePelayan> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (rolePelayan) => (
          <span className="block truncate font-medium" title={rolePelayan.name}>
            {rolePelayan.name}
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
