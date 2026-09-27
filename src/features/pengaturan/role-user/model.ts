import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { findMenuNode } from "@/lib/menu-tree";
import { MENU_ACTIONS, type MenuAction, type MenuNode } from "@/types/menu";

import {
  GRANT_ACTIONS,
  type MenuOption,
  type RoleUserDetail,
  type RoleUserPayload,
} from "./types";

export const ROLE_USER_LIST_PATH = menuHref(MENU.PENGATURAN, MENU.ROLE_USER);

export const ACCESS_REQUIRED =
  "Pilih minimal satu izin, atau jadikan Akses penuh.";

export const roleUserFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama role wajib diisi")
      .min(4, "Nama role minimal 4 karakter")
      .max(25, "Nama role maksimal 25 karakter"),
    isAdmin: z.enum(["true", "false"]),
    access: z.record(z.string(), z.array(z.enum(MENU_ACTIONS))),
  })
  .superRefine((values, ctx) => {
    if (values.isAdmin === "false" && Object.keys(values.access).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["access"],
        message: ACCESS_REQUIRED,
      });
    }
  });

export type RoleUserFormValues = z.input<typeof roleUserFormSchema>;

export type Access = RoleUserFormValues["access"];

export const EMPTY_ROLE_USER_FORM: RoleUserFormValues = {
  name: "",
  isAdmin: "false",
  access: {},
};

export type CheckState = "all" | "some" | "none";

export type AccessRow = { slug: string; pickable: MenuAction[] };

export function withMenu(
  access: Access,
  slug: string,
  actions: MenuAction[],
): Access {
  const { [slug]: _previous, ...rest } = access;
  const sorted = GRANT_ACTIONS.filter((action) => actions.includes(action));

  return sorted.length ? { ...rest, [slug]: sorted } : rest;
}

export const toggleAction = (
  actions: MenuAction[],
  action: MenuAction,
  isOn: boolean,
): MenuAction[] => {
  if (isOn) return [...actions, action, "VIEW"];

  return action === "VIEW" ? [] : actions.filter((item) => item !== action);
};

const checkState = (picked: number, total: number): CheckState => {
  if (picked === 0) return "none";

  return picked === total ? "all" : "some";
};

const countPicked = (actions: MenuAction[] = [], pickable: MenuAction[]) =>
  pickable.filter((action) => actions.includes(action)).length;

export const rowState = (
  actions: MenuAction[] | undefined,
  pickable: MenuAction[],
): CheckState => checkState(countPicked(actions, pickable), pickable.length);

export const toggleRow = (
  actions: MenuAction[] = [],
  pickable: MenuAction[],
): MenuAction[] =>
  rowState(actions, pickable) === "all" ? [] : [...actions, ...pickable];

export function groupState(access: Access, rows: AccessRow[]): CheckState {
  const total = rows.reduce((sum, row) => sum + row.pickable.length, 0);
  const picked = rows.reduce(
    (sum, row) => sum + countPicked(access[row.slug], row.pickable),
    0,
  );

  return checkState(picked, total);
}

export function toggleGroup(access: Access, rows: AccessRow[]): Access {
  const isAll = groupState(access, rows) === "all";

  return rows
    .filter((row) => row.pickable.length > 0)
    .reduce(
      (next, row) =>
        withMenu(
          next,
          row.slug,
          isAll ? [] : [...(next[row.slug] ?? []), ...row.pickable],
        ),
      access,
    );
}

const heldActions = (held: MenuNode[], slug: string): MenuAction[] => {
  const actions = findMenuNode(held, slug)?.action ?? [];

  return actions.includes("VIEW") ? actions : [];
};

// held null = aktor admin, boleh memberi semua aksi.
export const pickableActions = (
  menu: MenuOption,
  held: MenuNode[] | null,
): MenuAction[] =>
  held
    ? menu.actions.filter((action) =>
        heldActions(held, menu.slug).includes(action),
      )
    : menu.actions;

export const isBeyondActor = (
  detail: RoleUserDetail,
  held: MenuNode[] | null,
): boolean =>
  held !== null &&
  (detail.isAdmin ||
    detail.menuAccess.some(
      ({ action, menu }) => !heldActions(held, menu.slug).includes(action),
    ));

const byOrder = (a: MenuOption, b: MenuOption) => a.order - b.order;

export const toAccessGroups = (options: MenuOption[]): MenuOption[] =>
  options
    .map((node) => ({
      ...node,
      children: (node.isGroup ? node.children : [node])
        .map((menu) => ({
          ...menu,
          actions: GRANT_ACTIONS.filter((action) =>
            menu.actions.includes(action),
          ),
        }))
        .filter((menu) => menu.actions.length > 0)
        .sort(byOrder),
    }))
    .filter((group) => group.children.length > 0)
    .sort(byOrder);

export const countGranted = (access: Access, menus: MenuOption[]): number =>
  menus.filter((menu) => access[menu.slug]).length;

export function toRoleUserForm(detail: RoleUserDetail): RoleUserFormValues {
  return {
    name: detail.name,
    isAdmin: detail.isAdmin ? "true" : "false",
    access: detail.menuAccess.reduce<Access>(
      (access, { action, menu }) =>
        withMenu(access, menu.slug, [...(access[menu.slug] ?? []), action]),
      {},
    ),
  };
}

export function toRoleUserPayload(values: RoleUserFormValues): RoleUserPayload {
  const name = values.name.trim();

  if (values.isAdmin === "true") return { name, isAdmin: true };

  return {
    name,
    isAdmin: false,
    menuAccess: Object.entries(values.access).map(([slug, actions]) => ({
      slug,
      actions,
    })),
  };
}

// Issue menuAccess.* tidak punya field; tampil sebagai galat form.
export function toRoleSaveError(error: unknown): unknown {
  if (!(error instanceof FetchError)) return error;

  const issue = error.issues.find((item) => item.path.startsWith("menuAccess"));

  return issue ? new FetchError(error.status, issue.message) : error;
}

type ServerField = keyof RoleUserFormValues | "root";

export function serverFieldError(
  message: string,
): { field: ServerField; message: string } | null {
  return /role sudah tersedia/i.test(message)
    ? { field: "name", message: "Nama ini sudah dipakai role lain." }
    : null;
}
