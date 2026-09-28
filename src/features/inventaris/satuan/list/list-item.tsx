import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { SATUAN_LIST_PATH } from "../model";
import type { Satuan } from "../types";

const editHrefOf = (satuan: Satuan) =>
  editHref(MENU.INVENTARIS, MENU.SATUAN, satuan.code);

const saveFocus = (satuan: Satuan) =>
  saveListFocus(SATUAN_LIST_PATH, satuan.code);

const labelOf = (satuan: Satuan) => `Ubah ${satuan.name}`;

interface PropTypes {
  satuan: Satuan;
  isCanUpdate?: boolean;
}

export const SatuanListItemRow = (props: PropTypes) => {
  const { satuan, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={satuan.code}
      title={satuan.name}
      meta={satuan.code}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHrefOf(satuan)}
            onClick={() => saveFocus(satuan)}
            aria-label={labelOf(satuan)}
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

export function satuanTable(isCanUpdate: boolean): DataTableConfig<Satuan> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (satuan) => (
          <span className="block truncate font-medium" title={satuan.name}>
            {satuan.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (satuan) => <span className="tabular-nums">{satuan.code}</span>,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
