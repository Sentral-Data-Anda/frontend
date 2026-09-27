import type { SelectOption } from "@/components/common/control";
import { USER_STATUSES, type UserStatus } from "@/features/auth";

export type UserListItem = {
  publicId: string;
  code: string;
  username: string;
  status: UserStatus;
  lastLogin: string | null;
  roleUser: { id: number; name: string };
  jemaat: { id: number; code: string; name: string };
};

export type UserDetail = Omit<UserListItem, "roleUser" | "jemaat"> & {
  roleUser: { id: number; name: string; isAdmin: boolean };
  jemaat: { code: string; name: string };
};

export type UserPayload = {
  jemaatId: number;
  roleUserId: number;
};

export type UserCredential = {
  code?: string;
  name: string;
  username: string;
  password: string;
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: "Belum aktif",
  ACTIVE: "Aktif",
  DEACTIVATED: "Nonaktif",
};

export const USER_STATUS_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  ...USER_STATUSES.map((value) => ({ label: USER_STATUS_LABEL[value], value })),
];
