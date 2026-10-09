import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import type { MenuNode } from "@/types/menu";

import {
  EMPTY_ROLE_USER_FORM,
  groupState,
  isBeyondActor,
  pickableActions,
  roleUserFormSchema,
  rowState,
  serverFieldError,
  toAccessGroups,
  toggleAction,
  toggleGroup,
  toggleRow,
  toRoleSaveError,
  toRoleUserForm,
  toRoleUserPayload,
  withMenu,
  type RoleUserFormValues,
} from "./model";
import type { MenuOption, RoleUserDetail } from "./types";

const leaf = (slug: string, actions: MenuOption["actions"], order = 1) => ({
  slug,
  name: slug,
  order,
  isGroup: false,
  actions,
  children: [],
});

const held = (slug: string, action: MenuNode["action"]): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action,
  children: [],
});

const DETAIL: RoleUserDetail = {
  id: 3,
  publicId: "r3",
  name: "Operator Sistem",
  isAdmin: false,
  menuAccess: [
    { action: "UPDATE", menu: { slug: "USER" } },
    { action: "VIEW", menu: { slug: "USER" } },
    { action: "VIEW", menu: { slug: "ACTIVITY_LOG" } },
  ],
};

const issuesOf = (values: RoleUserFormValues) => {
  const parsed = roleUserFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("skema", () => {
  test("nama 4–25 karakter", () => {
    const base = { ...EMPTY_ROLE_USER_FORM, isAdmin: "true" as const };

    expect(issuesOf({ ...base, name: "  " })[0]).toBe(
      "name: Nama role wajib diisi",
    );
    expect(issuesOf({ ...base, name: "Abc" })).toEqual([
      "name: Nama role minimal 4 karakter",
    ]);
    expect(issuesOf({ ...base, name: "x".repeat(26) })).toEqual([
      "name: Nama role maksimal 25 karakter",
    ]);
    expect(issuesOf({ ...base, name: "Operator" })).toEqual([]);
  });

  test("non-admin wajib minimal satu izin; admin tidak", () => {
    expect(issuesOf({ ...EMPTY_ROLE_USER_FORM, name: "Operator" })).toEqual([
      "access: Pilih minimal satu izin, atau jadikan Akses penuh.",
    ]);
    expect(
      issuesOf({ ...EMPTY_ROLE_USER_FORM, name: "Operator", isAdmin: "true" }),
    ).toEqual([]);
  });
});

describe("form ↔ payload", () => {
  test("menuAccess GET dikelompokkan per slug, aksi berurutan, lalu kembali ke payload", () => {
    const form = toRoleUserForm(DETAIL);

    expect(form.access).toEqual({
      USER: ["VIEW", "UPDATE"],
      ACTIVITY_LOG: ["VIEW"],
    });
    expect(toRoleUserPayload(form)).toEqual({
      name: "Operator Sistem",
      isAdmin: false,
      menuAccess: [
        { slug: "USER", actions: ["VIEW", "UPDATE"] },
        { slug: "ACTIVITY_LOG", actions: ["VIEW"] },
      ],
    });
  });

  test("isAdmin Ya: payload tanpa menuAccess", () => {
    expect(
      toRoleUserPayload({
        name: " Admin ",
        isAdmin: "true",
        access: { USER: ["VIEW"] },
      }),
    ).toEqual({ name: "Admin", isAdmin: true });
  });

  test("aksi di luar editor (APPROVE) dibuang, menu tanpa aksi tidak dikirim", () => {
    const form = toRoleUserForm({
      ...DETAIL,
      menuAccess: [{ action: "APPROVE", menu: { slug: "PERMINTAAN" } }],
    });

    expect(form.access).toEqual({});
  });
});

describe("ketergantungan Lihat", () => {
  test("mencentang aksi lain ikut mencentang Lihat", () => {
    expect(withMenu({}, "USER", toggleAction([], "DELETE", true))).toEqual({
      USER: ["VIEW", "DELETE"],
    });
  });

  test("membuang Lihat membuang seluruh baris", () => {
    expect(
      withMenu(
        { USER: ["VIEW", "UPDATE"] },
        "USER",
        toggleAction(["VIEW", "UPDATE"], "VIEW", false),
      ),
    ).toEqual({});
  });

  test("membuang aksi lain mempertahankan Lihat", () => {
    expect(toggleAction(["VIEW", "UPDATE"], "UPDATE", false)).toEqual(["VIEW"]);
  });
});

describe("pilih semua", () => {
  const rows = [
    { slug: "A", pickable: ["VIEW", "CREATE"] as const },
    { slug: "B", pickable: ["VIEW"] as const },
    { slug: "C", pickable: [] as const },
  ].map((row) => ({ ...row, pickable: [...row.pickable] }));

  test("baris: tri-state dan toggle", () => {
    expect(rowState(undefined, ["VIEW", "CREATE"])).toBe("none");
    expect(rowState(["VIEW"], ["VIEW", "CREATE"])).toBe("some");
    expect(rowState(["VIEW", "CREATE"], ["VIEW", "CREATE"])).toBe("all");
    expect(toggleRow(["VIEW"], ["VIEW", "CREATE"])).toEqual([
      "VIEW",
      "VIEW",
      "CREATE",
    ]);
    expect(toggleRow(["VIEW", "CREATE"], ["VIEW", "CREATE"])).toEqual([]);
  });

  test("grup: tidak ada → semua → tidak ada, sebagian = indeterminate", () => {
    expect(groupState({}, rows)).toBe("none");
    expect(groupState({ A: ["VIEW"] }, rows)).toBe("some");

    const all = toggleGroup({ A: ["VIEW"] }, rows);
    expect(all).toEqual({ A: ["VIEW", "CREATE"], B: ["VIEW"] });
    expect(groupState(all, rows)).toBe("all");
    expect(toggleGroup(all, rows)).toEqual({});
  });

  test("grup hanya memberi aksi yang boleh diberikan aktor", () => {
    expect(toggleGroup({}, [{ slug: "A", pickable: ["VIEW"] }])).toEqual({
      A: ["VIEW"],
    });
  });
});

describe("aktor", () => {
  const menu = leaf("USER", ["VIEW", "CREATE", "UPDATE", "DELETE", "RESET"]);

  test("admin boleh memberi semua aksi menu", () => {
    expect(pickableActions(menu, null)).toEqual(menu.actions);
  });

  test("non-admin hanya aksi yang ia pegang; tanpa Lihat tidak ada", () => {
    expect(pickableActions(menu, [held("USER", ["VIEW", "RESET"])])).toEqual([
      "VIEW",
      "RESET",
    ]);
    expect(pickableActions(menu, [held("USER", ["UPDATE"])])).toEqual([]);
    expect(pickableActions(menu, [])).toEqual([]);
  });

  test("role berizin di luar aktor, atau role admin → hanya-baca", () => {
    const actor = [
      held("USER", ["VIEW", "UPDATE"]),
      held("ACTIVITY_LOG", ["VIEW"]),
    ];

    expect(isBeyondActor(DETAIL, actor)).toBe(false);
    expect(isBeyondActor(DETAIL, [held("USER", ["VIEW"])])).toBe(true);
    expect(
      isBeyondActor({ ...DETAIL, isAdmin: true, menuAccess: [] }, actor),
    ).toBe(true);
    expect(isBeyondActor(DETAIL, null)).toBe(false);
  });
});

describe("pohon menu-options → grup", () => {
  test("urut order, aksi di luar kolom dibuang, grup tanpa menu hilang", () => {
    const groups = toAccessGroups([
      {
        ...leaf("SETTINGS", [], 2),
        isGroup: true,
        children: [leaf("USER_ROLE", ["VIEW"], 2), leaf("USER", ["VIEW"], 1)],
      },
      {
        ...leaf("APPROVAL", [], 1),
        isGroup: true,
        children: [leaf("SETELAN", ["APPROVE"])],
      },
    ]);

    expect(groups.map((group) => group.slug)).toEqual(["SETTINGS"]);
    expect(groups[0].children.map((menu) => menu.slug)).toEqual([
      "USER",
      "USER_ROLE",
    ]);
  });
});

describe("galat server", () => {
  test("issue menuAccess → galat form dengan pesan issue", () => {
    const mapped = toRoleSaveError(
      new FetchError(400, "Validasi gagal", [
        { path: "menuAccess.0.slug", message: "Menu ganda" },
      ]),
    );

    expect(mapped).toBeInstanceOf(FetchError);
    expect((mapped as FetchError).message).toBe("Menu ganda");
    expect((mapped as FetchError).issues).toEqual([]);
  });

  test("issue field lain dan galat non-server tidak diubah", () => {
    const nameIssue = new FetchError(400, "x", [
      { path: "name", message: "Mohon Lengkapi Nama Role" },
    ]);
    const network = new TypeError("fetch");

    expect(toRoleSaveError(nameIssue)).toBe(nameIssue);
    expect(toRoleSaveError(network)).toBe(network);
  });

  test("Role Sudah Tersedia → field nama", () => {
    expect(serverFieldError("Role Sudah Tersedia")).toEqual({
      field: "name",
      message: "Nama ini sudah dipakai role lain.",
    });
    expect(
      serverFieldError("Anda Tidak Memiliki Izin Untuk Mengatur Status Admin"),
    ).toBeNull();
  });
});
