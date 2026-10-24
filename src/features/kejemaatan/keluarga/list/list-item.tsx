import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import {
  KELUARGA_LIST_PATH,
  WORSHIPS_HERE_LABEL,
  householdLabel,
} from "../model";
import type { Keluarga } from "../types";

const memberCount = (keluarga: Keluarga) =>
  `${keluarga._count.members} anggota`;

interface PropTypes {
  keluarga: Keluarga;
}

export const KeluargaListItemRow = (props: PropTypes) => {
  const { keluarga } = props;

  const meta = [keluarga.code, memberCount(keluarga), keluarga.zoneChurch?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <DataListRow
      id={keluarga.code}
      title={householdLabel(keluarga)}
      meta={meta}
    />
  );
};

const deleteLabelOf = (x: Keluarga) => `Hapus ${householdLabel(x)}`;

export const deleteTargetLabelOf = (x: Keluarga) => householdLabel(x);

export function keluargaTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Keluarga) => void,
): DataTableConfig<Keluarga> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        cell: (keluarga) => (
          <span
            className="block truncate font-medium"
            title={householdLabel(keluarga)}
          >
            {householdLabel(keluarga)}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        cell: (keluarga) => (
          <span className="tabular-nums">{keluarga.code}</span>
        ),
      },
      {
        key: "zone",
        header: "Wilayah",
        width: "minmax(0,1fr)",
        cell: (keluarga) => (
          <OptionalText
            text={keluarga.zoneChurch?.name}
            empty="Tanpa wilayah"
          />
        ),
      },
      {
        key: "members",
        header: "Anggota",
        width: "minmax(0,1fr)",
        cell: (keluarga) => (
          <span className="tabular-nums">{memberCount(keluarga)}</span>
        ),
      },
      {
        key: "worshipsHere",
        header: "Beribadah di sini",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (keluarga) => WORSHIPS_HERE_LABEL[`${keluarga.worshipsHere}`],
      },
    ],
    getRowActions: (x) => ({
      label: `Ubah ${householdLabel(x)}`,
      edit: {
        href: isCanUpdate
          ? editHref(MENU.KEJEMAATAN, MENU.KELUARGA, x.publicId)
          : undefined,
        onNavigate: () => saveListFocus(KELUARGA_LIST_PATH, x.code),
        label: `Ubah ${householdLabel(x)}`,
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
