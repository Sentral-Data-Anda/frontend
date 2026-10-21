import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { BAPEL_LIST_PATH, summarizeRules } from "../model";
import type { BapelListItem } from "../types";

interface PropTypes {
  bapel: BapelListItem;
}

export const BapelListItemRow = (props: PropTypes) => {
  const { bapel } = props;

  const meta = [
    bapel.code,
    bapel.rules.length ? `${bapel.rules.length} aturan` : "Tanpa aturan",
  ].join(" · ");

  return <DataListRow id={bapel.code} title={bapel.name} meta={meta} />;
};

const deleteLabelOf = (x: BapelListItem) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: BapelListItem) => `${x.name}`;

export function bapelTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: BapelListItem) => void,
): DataTableConfig<BapelListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (bapel) => (
          <span className="block truncate font-medium" title={bapel.name}>
            {bapel.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (bapel) => <span className="tabular-nums">{bapel.code}</span>,
      },
      {
        key: "rules",
        header: "Larangan jadwal",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (bapel) => (
          <OptionalText
            text={summarizeRules(bapel.rules)}
            empty="Tanpa larangan jadwal"
          />
        ),
      },
    ],
    getRowActions: (x) => ({
      label: `Ubah ${x.name}`,
      edit: {
        href: isCanUpdate
          ? editHref(MENU.KEJEMAATAN, MENU.BAPEL, x.publicId)
          : undefined,
        onNavigate: () => saveListFocus(BAPEL_LIST_PATH, x.code),
        label: `Ubah ${x.name}`,
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
