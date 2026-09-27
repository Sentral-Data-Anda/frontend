import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import { MENU, menuHref } from "@/config/menu";

import type { UserDetail, UserPayload } from "./types";

export const USER_LIST_PATH = menuHref(MENU.PENGATURAN, MENU.USER);

export const UNUSED_JEMAAT_ID = 0;

const required = (message: string) => z.string().min(1, message);

export const userEditSchema = z.object({
  jemaatId: z.string(),
  roleUserId: required("Mohon lengkapi role"),
});

export const userCreateSchema = userEditSchema.extend({
  jemaatId: required("Mohon lengkapi jemaat"),
});

export type UserFormValues = z.input<typeof userEditSchema>;

export const EMPTY_USER_FORM: UserFormValues = { jemaatId: "", roleUserId: "" };

export function toUserPayload(values: UserFormValues): UserPayload {
  return {
    jemaatId: values.jemaatId ? Number(values.jemaatId) : UNUSED_JEMAAT_ID,
    roleUserId: Number(values.roleUserId),
  };
}

export const toUserForm = (detail: UserDetail): UserFormValues => ({
  jemaatId: "",
  roleUserId: String(detail.roleUser.id),
});

type ServerField = keyof UserFormValues | "root";

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, ServerField, string]> = [
  [
    /kode induk/i,
    "jemaatId",
    "Jemaat ini belum punya kode induk. Lengkapi dulu di Daftar Jemaat.",
  ],
  [
    /^jemaat tidak ditemukan/i,
    "jemaatId",
    "Jemaat tidak ditemukan; pilih ulang dari daftar.",
  ],
  [
    /^role tidak ditemukan/i,
    "roleUserId",
    "Role tidak ditemukan; pilih ulang dari daftar.",
  ],
];

export function serverFieldError(
  message: string,
): { field: ServerField; message: string } | null {
  const hit = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return hit ? { field: hit[1], message: hit[2] } : null;
}

export type UserActor = {
  code: string;
  isAdmin: boolean;
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanReset: boolean;
  assignable: SelectOption[];
};

export function accountGateOf(user: UserDetail, actor: UserActor) {
  const isManageable =
    actor.isAdmin ||
    actor.assignable.some(
      (option) => option.value === String(user.roleUser.id),
    );
  const isSelf = user.code === actor.code;
  const isDeactivated = user.status === "DEACTIVATED";
  const isOpen = isManageable && !isSelf && !isDeactivated;

  return {
    isSelf,
    isDeactivated,
    isManageable,
    isRoleEditable: actor.isCanUpdate && isManageable && !isDeactivated,
    isCanReset: actor.isCanReset && isOpen,
    isCanDeactivate: actor.isCanDelete && isOpen,
    isCanRestore: actor.isAdmin && actor.isCanUpdate && isDeactivated,
  };
}

export type AccountGate = ReturnType<typeof accountGateOf>;
