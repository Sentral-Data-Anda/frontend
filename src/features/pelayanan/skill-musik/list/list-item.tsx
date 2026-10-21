import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { SKILL_MUSIK_LIST_PATH } from "../model";
import type { SkillMusik } from "../types";

const editHrefOf = (skillMusik: SkillMusik) =>
  editHref(MENU.PELAYANAN, MENU.SKILL_MUSIK, String(skillMusik.id));

const saveFocus = (skillMusik: SkillMusik) =>
  saveListFocus(SKILL_MUSIK_LIST_PATH, String(skillMusik.id));

const labelOf = (skillMusik: SkillMusik) => `Ubah ${skillMusik.name}`;

interface PropTypes {
  skillMusik: SkillMusik;
}

export const SkillMusikListItemRow = (props: PropTypes) => {
  const { skillMusik } = props;

  return <DataListRow id={String(skillMusik.id)} title={skillMusik.name} />;
};

const deleteLabelOf = (x: SkillMusik) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: SkillMusik) => `${x.name}`;

export function skillMusikTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: SkillMusik) => void,
): DataTableConfig<SkillMusik> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (skillMusik) => (
          <span className="block truncate font-medium" title={skillMusik.name}>
            {skillMusik.name}
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
