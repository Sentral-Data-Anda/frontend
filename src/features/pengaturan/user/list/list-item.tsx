import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Avatar } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { USER_LIST_PATH } from "../model";
import type { UserListItem } from "../types";

import { UserStatus } from "./user-status";

const editHrefOf = (user: UserListItem) =>
  editHref(MENU.PENGATURAN, MENU.USER, user.code);

const saveFocus = (user: UserListItem) =>
  saveListFocus(USER_LIST_PATH, user.code);

const labelOf = (user: UserListItem) => `Buka akun ${user.jemaat.name}`;

const truncated = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

interface PropTypes {
  user: UserListItem;
}

export const UserListItemRow = (props: PropTypes) => {
  const { user } = props;

  return (
    <DataListRow
      id={user.code}
      leading={<Avatar label={user.jemaat.name} />}
      title={user.jemaat.name}
      meta={`${user.username} · ${user.roleUser.name}`}
      trailing={
        <>
          <UserStatus status={user.status} />

          <Link
            href={editHrefOf(user)}
            onClick={() => saveFocus(user)}
            aria-label={labelOf(user)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "cursor-pointer",
            )}
          >
            <Pencil aria-hidden />
          </Link>
        </>
      }
    />
  );
};

export const userTable: DataTableConfig<UserListItem> = {
  columns: [
    {
      key: "name",
      header: "Nama",
      width: "minmax(0,2fr)",
      narrowWidth: "minmax(0,2fr)",
      cell: (user) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar label={user.jemaat.name} />
          <span className="truncate font-medium" title={user.jemaat.name}>
            {user.jemaat.name}
          </span>
        </span>
      ),
    },
    {
      key: "username",
      header: "Username",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,1fr)",
      cell: (user) => truncated(user.username),
    },
    {
      key: "role",
      header: "Role",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,1fr)",
      cell: (user) => truncated(user.roleUser.name),
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,1fr)",
      cell: (user) => <UserStatus status={user.status} />,
    },
    {
      key: "lastLogin",
      header: "Terakhir masuk",
      width: "minmax(0,1fr)",
      isSecondary: true,
      cell: (user) =>
        user.lastLogin ? (
          <span className="block truncate tabular-nums">
            {formatDateShort(user.lastLogin)}
          </span>
        ) : (
          <span className="text-muted-foreground">Belum pernah</span>
        ),
    },
  ],
  getRowHref: editHrefOf,
  getRowLabel: labelOf,
  onRowOpen: saveFocus,
  rowIcon: <Pencil />,
};
