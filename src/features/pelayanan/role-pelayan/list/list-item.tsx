import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { ROLE_PELAYAN_LIST_PATH, isPemusikRole } from "../model";
import type { RolePelayan } from "../types";

const editHrefOf = (rolePelayan: RolePelayan) =>
  editHref(MENU.PELAYANAN, MENU.ROLE_PELAYAN, String(rolePelayan.id));

const saveFocus = (rolePelayan: RolePelayan) =>
  saveListFocus(ROLE_PELAYAN_LIST_PATH, String(rolePelayan.id));

const labelOf = (rolePelayan: RolePelayan) => `Ubah ${rolePelayan.name}`;

interface PropTypes {
  rolePelayan: RolePelayan;
  isCanUpdate?: boolean;
}

export const RolePelayanListItemRow = (props: PropTypes) => {
  const { rolePelayan, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={String(rolePelayan.id)}
      title={rolePelayan.name}
      meta={
        isPemusikRole(rolePelayan.name)
          ? "Dipakai untuk memilih alat musik di jadwal"
          : undefined
      }
      trailing={
        isCanUpdate ? (
          <Link
            href={editHrefOf(rolePelayan)}
            onClick={() => saveFocus(rolePelayan)}
            aria-label={labelOf(rolePelayan)}
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

export function rolePelayanTable(
  isCanUpdate: boolean,
): DataTableConfig<RolePelayan> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (rolePelayan) => (
          <span className="block truncate font-medium" title={rolePelayan.name}>
            {rolePelayan.name}
          </span>
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
