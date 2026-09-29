import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { TIPE_BARANG_LIST_PATH } from "../model";
import type { TipeBarang } from "../types";

const editHrefOf = (tipeBarang: TipeBarang) =>
  editHref(MENU.INVENTARIS, MENU.TIPE_BARANG, tipeBarang.code);

const saveFocus = (tipeBarang: TipeBarang) =>
  saveListFocus(TIPE_BARANG_LIST_PATH, tipeBarang.code);

const labelOf = (tipeBarang: TipeBarang) => `Ubah ${tipeBarang.name}`;

interface PropTypes {
  tipeBarang: TipeBarang;
  isCanUpdate?: boolean;
}

export const TipeBarangListItemRow = (props: PropTypes) => {
  const { tipeBarang, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={tipeBarang.code}
      title={tipeBarang.name}
      meta={tipeBarang.code}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHrefOf(tipeBarang)}
            onClick={() => saveFocus(tipeBarang)}
            aria-label={labelOf(tipeBarang)}
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

export function tipeBarangTable(
  isCanUpdate: boolean,
): DataTableConfig<TipeBarang> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (tipeBarang) => (
          <span className="block truncate font-medium" title={tipeBarang.name}>
            {tipeBarang.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (tipeBarang) => (
          <span className="tabular-nums">{tipeBarang.code}</span>
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
