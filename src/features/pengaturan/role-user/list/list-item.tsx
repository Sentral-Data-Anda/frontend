import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { ROLE_USER_LIST_PATH } from "../model";
import { ROLE_KIND_LABEL, type RoleUserItem } from "../types";

const editHrefOf = (role: RoleUserItem) =>
  editHref(MENU.SETTINGS, MENU.USER_ROLE, String(role.id));

const saveFocus = (role: RoleUserItem) =>
  saveListFocus(ROLE_USER_LIST_PATH, String(role.id));

const labelOf = (role: RoleUserItem) => `Ubah ${role.name}`;

const kindOf = (role: RoleUserItem) =>
  ROLE_KIND_LABEL[role.isAdmin ? "true" : "false"];

const userCountOf = (role: RoleUserItem) =>
  role.userCount === undefined ? undefined : `${role.userCount} akun`;

interface PropTypes {
  role: RoleUserItem;
  isCanUpdate?: boolean;
}

export const RoleUserListItemRow = (props: PropTypes) => {
  const { role, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={String(role.id)}
      title={role.name}
      meta={role.isAdmin ? kindOf(role) : userCountOf(role)}
      trailing={
        isCanUpdate ? (
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
        ) : null
      }
    />
  );
};

export function roleUserTable(
  isCanUpdate: boolean,
): DataTableConfig<RoleUserItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (role) => (
          <span className="block truncate font-medium" title={role.name}>
            {role.name}
          </span>
        ),
      },
      {
        key: "kind",
        header: "Jenis",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (role) => <span className="block truncate">{kindOf(role)}</span>,
      },
      {
        key: "userCount",
        header: "Akun",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (role) => (
          <OptionalText
            text={userCountOf(role)}
            empty="Jumlah akun belum tersedia"
          />
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
