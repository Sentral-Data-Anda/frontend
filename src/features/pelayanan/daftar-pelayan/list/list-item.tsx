import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Avatar, Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { DAFTAR_PELAYAN_LIST_PATH, tugasOf } from "../model";
import { TYPE_PELAYAN_LABEL, type PelayanListItem } from "../types";

import { PelayanStatus } from "./pelayan-status";

const editHrefOf = (pelayan: PelayanListItem) =>
  editHref(MENU.PELAYANAN, MENU.DAFTAR_PELAYAN, pelayan.code);

const saveFocus = (pelayan: PelayanListItem) =>
  saveListFocus(DAFTAR_PELAYAN_LIST_PATH, pelayan.code);

const labelOf = (pelayan: PelayanListItem) => `Ubah ${pelayan.namePelayan}`;

const isGroupOf = (pelayan: PelayanListItem) => pelayan.typePelayan === "GROUP";

export const jenisOf = (pelayan: PelayanListItem) =>
  isGroupOf(pelayan)
    ? `${TYPE_PELAYAN_LABEL.GROUP} · ${pelayan.members.length} anggota`
    : TYPE_PELAYAN_LABEL.INDIVIDUAL;

interface PropTypes {
  pelayan: PelayanListItem;
  isCanUpdate?: boolean;
}

export const PelayanListItemRow = (props: PropTypes) => {
  const { pelayan, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={pelayan.code}
      leading={<Avatar label={pelayan.namePelayan} />}
      title={pelayan.namePelayan}
      meta={[pelayan.bapel, pelayan.role.join(", ")]
        .filter(Boolean)
        .join(" · ")}
      trailing={
        <>
          {isGroupOf(pelayan) ? (
            <Badge variant="secondary">{TYPE_PELAYAN_LABEL.GROUP}</Badge>
          ) : null}

          {pelayan.status ? null : <PelayanStatus isActive={false} />}

          {isCanUpdate ? (
            <Link
              href={editHrefOf(pelayan)}
              onClick={() => saveFocus(pelayan)}
              aria-label={labelOf(pelayan)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function daftarPelayanTable(
  isCanUpdate: boolean,
): DataTableConfig<PelayanListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (pelayan) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar label={pelayan.namePelayan} />
            <span className="truncate font-medium" title={pelayan.namePelayan}>
              {pelayan.namePelayan}
            </span>
          </span>
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (pelayan) => (
          <span className="block truncate" title={pelayan.bapel}>
            {pelayan.bapel}
          </span>
        ),
      },
      {
        key: "tugas",
        header: "Tugas",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (pelayan) => (
          <span className="block truncate" title={tugasOf(pelayan)}>
            {tugasOf(pelayan)}
          </span>
        ),
      },
      {
        key: "jenis",
        header: "Jenis",
        width: "minmax(0,1.3fr)",
        isSecondary: true,
        cell: (pelayan) => (
          <span className="block truncate" title={jenisOf(pelayan)}>
            {jenisOf(pelayan)}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (pelayan) => (
          <span className="block truncate tabular-nums">{pelayan.code}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (pelayan) => <PelayanStatus isActive={pelayan.status} />,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
