import { describe, expect, test } from "bun:test";

import {
  accountGateOf,
  serverFieldError,
  toUserForm,
  toUserPayload,
  UNUSED_JEMAAT_ID,
  userCreateSchema,
  userEditSchema,
  type UserActor,
} from "./model";
import type { UserDetail } from "./types";

const USER: UserDetail = {
  publicId: "p",
  code: "USR-0007",
  username: "A-0007",
  status: "ACTIVE",
  lastLogin: null,
  roleUser: { id: 3, name: "Operator Sistem", isAdmin: false },
  jemaat: { code: "JMT-0007", name: "Gabriel Tampubolon" },
};

const OPERATOR: UserActor = {
  code: "U-0001",
  isAdmin: false,
  isCanUpdate: true,
  isCanDelete: true,
  isCanReset: true,
  assignable: [{ value: "3", label: "Operator Sistem" }],
};

const messagesOf = (result: { success: boolean; error?: unknown }) =>
  result.success
    ? {}
    : Object.fromEntries(
        (
          result.error as { issues: { path: string[]; message: string }[] }
        ).issues.map((issue) => [issue.path[0], issue.message]),
      );

describe("skema", () => {
  test("tambah: jemaat dan role wajib", () => {
    expect(
      messagesOf(userCreateSchema.safeParse({ jemaatId: "", roleUserId: "" })),
    ).toEqual({
      jemaatId: "Mohon lengkapi jemaat",
      roleUserId: "Mohon lengkapi role",
    });
  });

  test("ubah: hanya role yang wajib", () => {
    expect(
      userEditSchema.safeParse({ jemaatId: "", roleUserId: "3" }).success,
    ).toBe(true);
    expect(
      messagesOf(userEditSchema.safeParse({ jemaatId: "", roleUserId: "" })),
    ).toEqual({ roleUserId: "Mohon lengkapi role" });
  });
});

describe("payload", () => {
  test("tambah: id angka", () => {
    expect(toUserPayload({ jemaatId: "12", roleUserId: "3" })).toEqual({
      jemaatId: 12,
      roleUserId: 3,
    });
  });

  test("ubah: jemaatId pengisi yang diabaikan be-sada, roleUserId baru", () => {
    const values = { ...toUserForm(USER), roleUserId: "2" };

    expect(toUserPayload(values)).toEqual({
      jemaatId: UNUSED_JEMAAT_ID,
      roleUserId: 2,
    });
  });
});

describe("peta galat server", () => {
  test("kode induk kosong ke field jemaat", () => {
    expect(
      serverFieldError(
        "Mohon Lengkapi Kode Induk Jemaat Untuk Keperluan Pendaftaran Akun",
      ),
    ).toEqual({
      field: "jemaatId",
      message:
        "Jemaat ini belum punya kode induk. Lengkapi dulu di Daftar Jemaat.",
    });
  });

  test("role tidak ditemukan ke field role", () => {
    expect(serverFieldError("Role Tidak Ditemukan")?.field).toBe("roleUserId");
  });

  test("403 hak akses tidak dipetakan: jadi galat form", () => {
    expect(
      serverFieldError(
        "Anda Tidak Dapat Memberikan Role Dengan Hak Akses Melebihi Milik Anda",
      ),
    ).toBeNull();
  });
});

describe("gerbang aksi akun", () => {
  test("akun yang dapat dikelola: semua aksi terbuka", () => {
    expect(accountGateOf(USER, OPERATOR)).toMatchObject({
      isManageable: true,
      isRoleEditable: true,
      isCanReset: true,
      isCanDeactivate: true,
      isCanRestore: false,
    });
  });

  test("role akun di luar daftar assignable: role terkunci, reset/nonaktifkan hilang", () => {
    const admin = {
      ...USER,
      roleUser: { id: 1, name: "Administrator", isAdmin: true },
    };

    expect(accountGateOf(admin, OPERATOR)).toMatchObject({
      isManageable: false,
      isRoleEditable: false,
      isCanReset: false,
      isCanDeactivate: false,
    });
  });

  test("akun sendiri: tanpa reset dan nonaktifkan, role tetap bisa diubah", () => {
    expect(accountGateOf({ ...USER, code: "U-0001" }, OPERATOR)).toMatchObject({
      isSelf: true,
      isRoleEditable: true,
      isCanReset: false,
      isCanDeactivate: false,
    });
  });

  test("tanpa izin RESET/DELETE/UPDATE: aksinya hilang", () => {
    expect(
      accountGateOf(USER, {
        ...OPERATOR,
        isCanUpdate: false,
        isCanDelete: false,
        isCanReset: false,
      }),
    ).toMatchObject({
      isRoleEditable: false,
      isCanReset: false,
      isCanDeactivate: false,
    });
  });

  test("aktifkan kembali hanya untuk admin pada akun nonaktif", () => {
    const deactivated = { ...USER, status: "DEACTIVATED" as const };

    expect(accountGateOf(deactivated, OPERATOR).isCanRestore).toBe(false);
    expect(
      accountGateOf(deactivated, { ...OPERATOR, isAdmin: true }),
    ).toMatchObject({
      isCanRestore: true,
      isCanReset: false,
      isCanDeactivate: false,
    });
    expect(
      accountGateOf(USER, { ...OPERATOR, isAdmin: true }).isCanRestore,
    ).toBe(false);
  });

  test("admin mengelola semua walau daftar assignable belum ada", () => {
    expect(
      accountGateOf(USER, { ...OPERATOR, isAdmin: true, assignable: [] })
        .isManageable,
    ).toBe(true);
  });
});
