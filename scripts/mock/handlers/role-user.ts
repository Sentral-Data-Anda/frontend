/**
 * Tiruan `/api/v1/role` (be-sada `modules/role`) + `/ddl/role-user` tanpa `assignable`.
 *
 *   MOCK_500=1                  → daftar role menjawab 500
 *   MOCK_ROLE_SAVE_ERROR=500    → simpan (POST/PUT) menjawab 500
 *   MOCK_ROLE_NO_COUNT=1        → tanpa `userCount` (be-sada sebelum B6)
 *   MOCK_ROLE_OPTIONS_ERROR=500 → /role/menu-options menjawab 500
 *
 * Nama ganda → 404 "Role Sudah Tersedia", peka huruf besar (seperti be-sada).
 * Role id 1–2 masih dipakai akun, jadi hapusnya 400.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import type { MenuAction } from "../../../src/types/menu";
import { NAME, TREE } from "../../menu-tree";
import { PERSONAS, ROLE_USERS } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Grants = Partial<Record<string, MenuAction[]>>;

type Row = {
  id: number;
  publicId: string;
  name: string;
  isAdmin: boolean;
  grants: Grants;
  userCount: number;
};

type Body = {
  name?: string;
  isAdmin?: boolean;
  menuAccess?: { slug: string; actions: MenuAction[] }[];
};

const V: MenuAction[] = ["VIEW"];
const VC: MenuAction[] = ["VIEW", "CREATE"];
const CRUD: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

// Tabel aksi per menu dari brief role-user (MENU_ACTIONS be-sada, B1).
const ACTIONS: Partial<Record<MenuSlug, MenuAction[]>> = {
  [MENU.ACTIVITY_LOG]: V,
  [MENU.LAPORAN_KEUANGAN]: V,
  [MENU.REPORT_JEMAAT]: V,
  [MENU.MUTASI_STOK]: VC,
  [MENU.PEMBAYARAN]: VC,
  [MENU.PENERIMAAN_BARANG]: VC,
  [MENU.PENDAFTARAN_EVENT]: ["VIEW", "CREATE", "DELETE"],
  [MENU.PERSEMBAHAN]: ["VIEW", "CREATE", "DELETE"],
  [MENU.PERIODE_FISKAL]: ["VIEW", "CREATE", "UPDATE"],
  [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW", "UPDATE"],
  [MENU.SETELAN_AKUNTANSI]: ["VIEW", "UPDATE"],
  [MENU.USER]: [...CRUD, "RESET"],
};

const leaves = () => new Set(Object.values(TREE).flat());

const menuActionsOf = (slug: string): MenuAction[] =>
  leaves().has(slug as MenuSlug) ? (ACTIONS[slug as MenuSlug] ?? CRUD) : [];

const menuOptions = () =>
  Object.entries(TREE).map(([domain, slugs], index) => ({
    slug: domain,
    name: NAME[domain as MenuSlug],
    order: index + 1,
    isGroup: true,
    actions: [],
    children: slugs.map((slug, leafIndex) => ({
      slug,
      name: NAME[slug],
      order: leafIndex + 1,
      isGroup: false,
      actions: menuActionsOf(slug),
      children: [],
    })),
  }));

const toGrants = (grants: Grants | null): Grants =>
  Object.fromEntries(
    Object.entries(grants ?? {})
      .map(([slug, actions = []]) => [
        slug,
        actions.filter((action) => menuActionsOf(slug).includes(action)),
      ])
      .filter(([, actions]) => actions.length > 0),
  );

const USER_COUNT: Record<number, number> = { 1: 2, 2: 3 };

const rows: Row[] = [...ROLE_USERS]
  .sort((a, b) => a.id - b.id)
  .map(({ id, name }) => {
    const persona = Object.values(PERSONAS).find(
      (item) => item.roleName === name,
    );

    return {
      id,
      publicId: `role-${id}`,
      name,
      isAdmin: persona?.isAdmin ?? false,
      grants: persona?.isAdmin ? {} : toGrants(persona?.grants ?? null),
      userCount: USER_COUNT[id] ?? 0,
    };
  });

const view = ({ grants: _grants, userCount, ...row }: Row) => ({
  ...row,
  createdAt: "2026-01-05T02:00:00.000Z",
  updatedAt: "2026-09-20T02:00:00.000Z",
  ...(process.env.MOCK_ROLE_NO_COUNT ? {} : { userCount }),
});

const detail = (row: Row) => ({
  ...view(row),
  menuAccess: Object.entries(row.grants).flatMap(([slug, actions = []]) =>
    actions.map((action) => ({
      id: `${row.id}-${slug}-${action}`,
      action,
      menu: { slug, name: NAME[slug as MenuSlug] },
    })),
  ),
});

const invalid = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const validate = (body: Body) => {
  const name = body.name?.trim() ?? "";

  if (!name) return invalid("name", "Mohon Lengkapi Nama Role");
  if (name.length < 4) {
    return invalid("name", "Nama Role harus memiliki setidaknya 4 karakter");
  }
  if (name.length > 25) {
    return invalid("name", "Nama Role tidak boleh lebih dari 25 karakter");
  }
  if (typeof body.isAdmin !== "boolean") {
    return invalid("isAdmin", "Mohon Lengkapi Status Admin");
  }
  if (body.isAdmin) return null;
  if (!body.menuAccess) {
    return invalid("menuAccess", "Mohon Lengkapi Hak Akses untuk Non-Admin");
  }
  if (body.menuAccess.length === 0) {
    return invalid(
      "menuAccess",
      "Minimal pilih satu Hak Akses untuk Non-Admin",
    );
  }

  const seen = new Set<string>();

  for (const [index, item] of body.menuAccess.entries()) {
    const allowed = menuActionsOf(item.slug);

    if (allowed.length === 0) {
      return invalid(`menuAccess.${index}.slug`, "Menu Tidak Dikenal");
    }
    if (seen.has(item.slug)) {
      return invalid(`menuAccess.${index}.slug`, "Menu Ganda");
    }
    seen.add(item.slug);

    if (
      item.actions.length === 0 ||
      new Set(item.actions).size !== item.actions.length
    ) {
      return invalid(`menuAccess.${index}.actions`, "Aksi Ganda atau Kosong");
    }

    const unknown = item.actions.find((action) => !allowed.includes(action));

    if (unknown) {
      return invalid(
        `menuAccess.${index}.actions`,
        `Aksi ${unknown} tidak tersedia untuk menu ${NAME[item.slug as MenuSlug]}`,
      );
    }
  }

  return null;
};

const forbidden = (message: string) =>
  json({ status: 403, error: message }, 403);

const actorFailure = (
  body: Body,
  row: Row | undefined,
  isAdmin: boolean,
  can: (slug: MenuSlug, action: MenuAction) => boolean,
) => {
  if (isAdmin) return null;
  if (body.isAdmin || (row && row.isAdmin !== body.isAdmin)) {
    return forbidden("Anda Tidak Memiliki Izin Untuk Mengatur Status Admin");
  }

  for (const item of body.menuAccess ?? []) {
    const missing = item.actions.find(
      (action) => !can(item.slug as MenuSlug, action),
    );

    if (missing) {
      return forbidden(
        `Anda Tidak Dapat Memberikan Hak Akses Yang Tidak Anda Miliki: ${item.slug} ${missing}`,
      );
    }
  }

  return null;
};

const toRowGrants = (body: Body): Grants =>
  body.isAdmin
    ? {}
    : Object.fromEntries(
        (body.menuAccess ?? []).map((item) => [item.slug, item.actions]),
      );

const isNameTaken = (name: string, ownId?: number) =>
  rows.some((row) => row.name === name.trim() && row.id !== ownId);

const ACTION_BY_METHOD: Record<string, MenuAction> = {
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

export const roleUserMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
  isAdmin,
}) => {
  if (path === "/ddl/role-user" && !url.searchParams.has("assignable")) {
    if (process.env.MOCK_DDL_EMPTY) {
      return json({ status: 404, error: "Data Tidak Ditemukan" }, 404);
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Data",
      data: rows
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  if (path !== "/role" && !path.startsWith("/role/")) return null;

  if (!can(MENU.ROLE_USER, ACTION_BY_METHOD[method] ?? "VIEW")) {
    return denied();
  }

  if (path === "/role/menu-options") {
    if (process.env.MOCK_ROLE_OPTIONS_ERROR === "500") {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Menu",
      data: menuOptions(),
    });
  }

  if (
    (method === "POST" || method === "PUT") &&
    process.env.MOCK_ROLE_SAVE_ERROR === "500"
  ) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/role" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      rows.filter((row) => row.name.toLowerCase().includes(filter)).map(view),
      url,
      "Role",
      "Role",
    );
  }

  if (path === "/role" && method === "POST") {
    const body = await readBody<Body>(request);
    const failure =
      validate(body) ?? actorFailure(body, undefined, isAdmin, can);
    if (failure) return failure;

    if (isNameTaken(body.name ?? "")) {
      return json({ status: 404, error: "Role Sudah Tersedia" }, 404);
    }

    const id = Math.max(0, ...rows.map((item) => item.id)) + 1;
    const row: Row = {
      id,
      publicId: `role-${id}`,
      name: (body.name ?? "").trim(),
      isAdmin: body.isAdmin ?? false,
      grants: toRowGrants(body),
      userCount: 0,
    };

    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Role", data: view(row) },
      201,
    );
  }

  const id = Number(path.match(/^\/role\/(\d+)$/)?.[1]);
  const row = rows.find((item) => item.id === id);

  if (!row) return json({ status: 404, error: "Role Tidak Ditemukan" }, 404);

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Role",
      data: detail(row),
    });
  }

  if (method === "PUT") {
    const body = await readBody<Body>(request);
    const failure = validate(body) ?? actorFailure(body, row, isAdmin, can);
    if (failure) return failure;

    if (isNameTaken(body.name ?? "", row.id)) {
      return json({ status: 404, error: "Role Sudah Tersedia" }, 404);
    }

    row.name = (body.name ?? "").trim();
    row.isAdmin = body.isAdmin ?? false;
    row.grants = toRowGrants(body);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Role",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (row.userCount > 0) {
      return json(
        {
          status: 400,
          error: `Role Masih Digunakan Oleh ${row.userCount} Akun. Pindahkan Akun Tersebut Terlebih Dahulu`,
        },
        400,
      );
    }

    rows.splice(rows.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Role",
      data: view(row),
    });
  }

  return null;
};
