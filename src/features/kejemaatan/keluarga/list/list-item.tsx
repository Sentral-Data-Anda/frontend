import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { KELUARGA_LIST_PATH, WORSHIPS_HERE_LABEL } from "../model";
import type { Keluarga } from "../types";

const memberCount = (keluarga: Keluarga) =>
  `${keluarga._count.members} anggota`;

interface PropTypes {
  keluarga: Keluarga;
  isCanUpdate?: boolean;
}

export const KeluargaListItemRow = (props: PropTypes) => {
  const { keluarga, isCanUpdate = false } = props;

  const meta = [keluarga.code, memberCount(keluarga), keluarga.zoneChurch?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <DataListRow
      id={keluarga.code}
      title={keluarga.name}
      meta={meta}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHref(MENU.KEJEMAATAN, MENU.KELUARGA, keluarga.code)}
            onClick={() => saveListFocus(KELUARGA_LIST_PATH, keluarga.code)}
            aria-label={`Ubah ${keluarga.name}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "cursor-pointer",
            )}
          >
            <Pencil aria-hidden />
          </Link>
        ) : null
      }
    />
  );
};

export function keluargaTable(isCanUpdate: boolean): DataTableConfig<Keluarga> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        cell: (keluarga) => (
          <span className="block truncate font-medium" title={keluarga.name}>
            {keluarga.name}
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
    getRowHref: isCanUpdate
      ? (keluarga) => editHref(MENU.KEJEMAATAN, MENU.KELUARGA, keluarga.code)
      : undefined,
    getRowLabel: (keluarga) => `Ubah ${keluarga.name}`,
    onRowOpen: (keluarga) => saveListFocus(KELUARGA_LIST_PATH, keluarga.code),
    rowIcon: <Pencil />,
  };
}
