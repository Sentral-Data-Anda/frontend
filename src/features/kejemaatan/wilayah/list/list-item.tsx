import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { WILAYAH_LIST_PATH } from "../model";
import type { Wilayah } from "../types";

import { WilayahStatus } from "./wilayah-status";

const editHrefOf = (wilayah: Wilayah) =>
  editHref(MENU.KEJEMAATAN, MENU.WILAYAH, wilayah.code);

const saveFocus = (wilayah: Wilayah) =>
  saveListFocus(WILAYAH_LIST_PATH, wilayah.code);

const labelOf = (wilayah: Wilayah) => `Ubah ${wilayah.name}`;

interface PropTypes {
  wilayah: Wilayah;
  isCanUpdate?: boolean;
}

export const WilayahListItemRow = (props: PropTypes) => {
  const { wilayah, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={wilayah.code}
      title={wilayah.name}
      meta={wilayah.code}
      trailing={
        <>
          {wilayah.isActive ? null : <WilayahStatus isActive={false} />}

          {isCanUpdate ? (
            <Link
              href={editHrefOf(wilayah)}
              onClick={() => saveFocus(wilayah)}
              aria-label={labelOf(wilayah)}
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

export function wilayahTable(isCanUpdate: boolean): DataTableConfig<Wilayah> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (wilayah) => (
          <span className="block truncate font-medium" title={wilayah.name}>
            {wilayah.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (wilayah) => <span className="tabular-nums">{wilayah.code}</span>,
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (wilayah) => <WilayahStatus isActive={wilayah.isActive} />,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
