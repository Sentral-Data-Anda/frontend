import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Avatar, Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { JEMAAT_LIST_PATH } from "../model";
import {
  STATUS_JEMAAT_LABEL,
  TYPE_JEMAAT_LABEL,
  type JemaatListItem,
} from "../types";

export function JemaatListItemRow({
  jemaat,
  isCanUpdate = false,
}: {
  jemaat: JemaatListItem;
  isCanUpdate?: boolean;
}) {
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

          {isCanUpdate ? (
            <Link
              href={editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, jemaat.code)}
              onClick={() => saveListFocus(JEMAAT_LIST_PATH, jemaat.code)}
              aria-label={`Ubah ${jemaat.name}`}
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
}

function OptionalName({ name, empty }: { name?: string; empty: string }) {
  return name ? (
    <span className="block truncate" title={name}>
      {name}
    </span>
  ) : (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{empty}</span>
    </span>
  );
}

function JemaatStatus({ status }: { status: JemaatListItem["status"] }) {
  return (
    <Badge variant={status === "AKTIF" ? "success" : "neutral"}>
      {STATUS_JEMAAT_LABEL[status]}
    </Badge>
  );
}

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
          <OptionalName name={jemaat.keluarga?.name} empty="Tanpa keluarga" />
        ),
      },
      {
        key: "zone",
        header: "Wilayah",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (jemaat) => (
          <OptionalName name={jemaat.zoneChurch?.name} empty="Tanpa wilayah" />
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
    getRowHref: isCanUpdate
      ? (jemaat) => editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, jemaat.code)
      : undefined,
    getRowLabel: (jemaat) => `Ubah ${jemaat.name}`,
    onRowOpen: (jemaat) => saveListFocus(JEMAAT_LIST_PATH, jemaat.code),
    rowIcon: <Pencil />,
  };
}
