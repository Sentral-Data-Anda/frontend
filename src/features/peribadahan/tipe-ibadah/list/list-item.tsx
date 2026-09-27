import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { TIPE_IBADAH_LIST_PATH } from "../model";
import type { TipeIbadah } from "../types";

import { TipeIbadahStatus } from "./tipe-ibadah-status";

const editHrefOf = (tipeIbadah: TipeIbadah) =>
  editHref(MENU.PERIBADAHAN, MENU.TIPE_IBADAH, tipeIbadah.code);

const saveFocus = (tipeIbadah: TipeIbadah) =>
  saveListFocus(TIPE_IBADAH_LIST_PATH, tipeIbadah.code);

const labelOf = (tipeIbadah: TipeIbadah) => `Ubah ${tipeIbadah.name}`;

interface PropTypes {
  tipeIbadah: TipeIbadah;
  isCanUpdate?: boolean;
}

export const TipeIbadahListItemRow = (props: PropTypes) => {
  const { tipeIbadah, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={tipeIbadah.code}
      title={tipeIbadah.name}
      meta={tipeIbadah.code}
      trailing={
        <>
          {tipeIbadah.isActive ? null : <TipeIbadahStatus isActive={false} />}

          {isCanUpdate ? (
            <Link
              href={editHrefOf(tipeIbadah)}
              onClick={() => saveFocus(tipeIbadah)}
              aria-label={labelOf(tipeIbadah)}
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

export function tipeIbadahTable(
  isCanUpdate: boolean,
): DataTableConfig<TipeIbadah> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (tipeIbadah) => (
          <span className="block truncate font-medium" title={tipeIbadah.name}>
            {tipeIbadah.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeIbadah) => (
          <span className="tabular-nums">{tipeIbadah.code}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeIbadah) => (
          <TipeIbadahStatus isActive={tipeIbadah.isActive} />
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
