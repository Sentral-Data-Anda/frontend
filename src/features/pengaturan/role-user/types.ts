import type { MenuAction } from "@/types/menu";

export type RoleUserItem = {
  id: number;
  publicId: string;
  name: string;
  isAdmin: boolean;
  userCount?: number;
};

export type RoleMenuAccess = {
  action: MenuAction;
  menu: { slug: string };
};

export type RoleUserDetail = RoleUserItem & {
  menuAccess: RoleMenuAccess[];
};

export type MenuOption = {
  slug: string;
  name: string;
  order: number;
  isGroup: boolean;
  actions: MenuAction[];
  children: MenuOption[];
};

export type RoleUserPayload = {
  name: string;
  isAdmin: boolean;
  menuAccess?: { slug: string; actions: MenuAction[] }[];
};

export const GRANT_ACTIONS = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESET",
] as const satisfies readonly MenuAction[];

export type GrantAction = (typeof GRANT_ACTIONS)[number];

export const ACTION_LABEL: Record<GrantAction, string> = {
  VIEW: "Lihat",
  CREATE: "Tambah",
  UPDATE: "Ubah",
  DELETE: "Hapus",
  RESET: "Reset",
};

export const ADMIN_LABEL: Record<"true" | "false", string> = {
  true: "Ya",
  false: "Tidak",
};

export const ROLE_KIND_LABEL: Record<"true" | "false", string> = {
  true: "Akses penuh",
  false: "Terbatas",
};
