import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { TEMPLATE_JADWAL_LIST_PATH, rolesOf, timeRangeOf } from "../model";
import type { TemplateJadwalListItem } from "../types";

const editHrefOf = (template: TemplateJadwalListItem) =>
  editHref(MENU.PELAYANAN, MENU.TEMPLATE_JADWAL, template.publicId);

const saveFocus = (template: TemplateJadwalListItem) =>
  saveListFocus(TEMPLATE_JADWAL_LIST_PATH, template.code);

const labelOf = (template: TemplateJadwalListItem) => `Ubah ${template.name}`;

const metaOf = (template: TemplateJadwalListItem) =>
  `${template.bapel} · ${timeRangeOf(template)} · ${template.detail.length} tugas`;

interface PropTypes {
  template: TemplateJadwalListItem;
}

export const TemplateJadwalListItemRow = (props: PropTypes) => {
  const { template } = props;

  return (
    <DataListRow
      id={template.code}
      title={template.name}
      meta={metaOf(template)}
    />
  );
};

const deleteLabelOf = (x: TemplateJadwalListItem) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: TemplateJadwalListItem) => `${x.name}`;

export function templateJadwalTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: TemplateJadwalListItem) => void,
): DataTableConfig<TemplateJadwalListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (template) => (
          <span className="block truncate font-medium" title={template.name}>
            {template.name}
          </span>
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (template) => (
          <span className="block truncate" title={template.bapel}>
            {template.bapel}
          </span>
        ),
      },
      {
        key: "time",
        header: "Jam",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (template) => (
          <span className="tabular-nums">{timeRangeOf(template)}</span>
        ),
      },
      {
        key: "roles",
        header: "Tugas",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (template) => {
          const roles = rolesOf(template).join(", ");

          return (
            <span className="block truncate" title={roles}>
              {roles}
            </span>
          );
        },
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (template) => (
          <span className="tabular-nums">{template.code}</span>
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
