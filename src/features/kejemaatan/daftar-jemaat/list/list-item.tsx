import { Avatar, OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import { JEMAAT_LIST_PATH } from "../model";
import { TYPE_JEMAAT_LABEL, type JemaatListItem } from "../types";

import { JemaatStatus } from "./jemaat-status";

interface PropTypes {
  jemaat: JemaatListItem;
}

export const JemaatListItemRow = (props: PropTypes) => {
  const { jemaat } = props;

  const meta = [
    jemaat.code,
    TYPE_JEMAAT_LABEL[jemaat.type],
    jemaat.keluarga?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DataListRow
      id={jemaat.code}
      leading={<Avatar label={jemaat.name} />}
      title={jemaat.name}
      meta={meta}
      trailing={
        <>
          <JemaatStatus status={jemaat.status} />
        </>
      }
    />
  );
};

export function jemaatTable(
  isCanUpdate: boolean,
): DataTableConfig<JemaatListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.4fr)",
        cell: (jemaat) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar label={jemaat.name} />
            <span className="truncate font-medium" title={jemaat.name}>
              {jemaat.name}
            </span>
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (jemaat) => <span className="tabular-nums">{jemaat.code}</span>,
      },
      {
        key: "type",
        header: "Tipe",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (jemaat) => TYPE_JEMAAT_LABEL[jemaat.type],
      },
      {
        key: "keluarga",
        header: "Keluarga",
        width: "minmax(0,2fr)",
        isSecondary: true,
        cell: (jemaat) => (
          <OptionalText text={jemaat.keluarga?.name} empty="Tanpa keluarga" />
        ),
      },
      {
        key: "zone",
        header: "Wilayah",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (jemaat) => (
          <OptionalText text={jemaat.zoneChurch?.name} empty="Tanpa wilayah" />
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (jemaat) => <JemaatStatus status={jemaat.status} />,
      },
    ],
    getRowActions: (x) => ({
      label: `Ubah ${x.name}`,
      edit: {
        href: isCanUpdate
          ? editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, x.publicId)
          : undefined,
        onNavigate: () => saveListFocus(JEMAAT_LIST_PATH, x.code),
        label: `Ubah ${x.name}`,
      },
    }),
  };
}
