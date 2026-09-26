import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Avatar, OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { ROLE_JEMAAT_LIST_PATH, formatPeriode } from "../model";
import type { RoleJemaatItem } from "../types";

import { RoleStatus } from "./role-status";

const editHrefOf = (role: RoleJemaatItem) =>
  editHref(MENU.KEJEMAATAN, MENU.ROLE_JEMAAT, String(role.id));

const saveFocus = (role: RoleJemaatItem) =>
  saveListFocus(ROLE_JEMAAT_LIST_PATH, String(role.id));

const labelOf = (role: RoleJemaatItem) =>
  `Ubah ${role.name} ${role.jemaat.name}`;

interface PropTypes {
  role: RoleJemaatItem;
  isCanUpdate?: boolean;
}

export const RoleJemaatListItemRow = (props: PropTypes) => {
  const { role, isCanUpdate = false } = props;

  const meta = [role.name, role.bapel?.name].filter(Boolean).join(" · ");

  return (
    <DataListRow
      id={String(role.id)}
      leading={<Avatar label={role.jemaat.name} />}
      title={role.jemaat.name}
      meta={meta}
      trailing={
        <>
          <RoleStatus status={role.status} />

          {isCanUpdate ? (
            <Link
              href={editHrefOf(role)}
              onClick={() => saveFocus(role)}
              aria-label={labelOf(role)}
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

export function roleJemaatTable(
  isCanUpdate: boolean,
): DataTableConfig<RoleJemaatItem> {
  return {
    columns: [
      {
        key: "jemaat",
        header: "Jemaat",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (role) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar label={role.jemaat.name} />
            <span className="truncate font-medium" title={role.jemaat.name}>
              {role.jemaat.name}
            </span>
          </span>
        ),
      },
      {
        key: "name",
        header: "Jabatan",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (role) => (
          <span className="block truncate" title={role.name}>
            {role.name}
          </span>
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (role) => (
          <OptionalText text={role.bapel?.name} empty="Tanpa badan pelayanan" />
        ),
      },
      {
        key: "periode",
        header: "Periode",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (role) => (
          <span className="block truncate tabular-nums">
            {formatPeriode(role)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (role) => <RoleStatus status={role.status} />,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
