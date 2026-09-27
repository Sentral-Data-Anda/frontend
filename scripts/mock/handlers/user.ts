/**
 * Tiruan be-sada `/user` dengan kontrak B4, B5, B9, B10; juga `/ddl/jemaat?register=0`
 * dan `/ddl/role-user?assignable=1`.
 *
 *   MOCK_USER_SAVE_ERROR=500 → tambah/ubah role menjawab 500
 *   MOCK_USER_MANY=1         → ±150 akun (paginasi, infinite scroll)
 *   MOCK_500=1               → daftar akun menjawab 500
 *
 * Non-admin hanya boleh memberikan dan mengelola role Operator Sistem.
 */
import { MENU } from "../../../src/config/menu";
import type { UserStatus } from "../../../src/features/auth/types";
import { PERSONAS, ROLE_USERS, ddlRows } from "../../mock-dashboard";
import {
  denied,
  json,
  list,
  readBody,
  type MockContext,
  type MockHandler,
} from "../kit";

type Jemaat = { id: number; code: string; name: string; codeInduk: string };
type Role = { id: number; name: string; isAdmin: boolean };

type User = {
  publicId: string;
  code: string;
  username: string;
  status: UserStatus;
  lastLogin: string | null;
  lastLoginIp: string | null;
  deletedAt: string | null;
  role: Role;
  jemaat: Jemaat;
};

const ROLES: Role[] = ROLE_USERS.map((role) => ({
  ...role,
  isAdmin: role.name === "Administrator",
}));

const ADMIN_ROLE = ROLES.find((role) => role.isAdmin)!;
const OPERATOR_ROLE = ROLES.find((role) => role.name === "Operator Sistem")!;

const FIRST = ["Yohana", "Samuel", "Ruth", "Daniel", "Ester", "Markus"];
const LAST = ["Siregar", "Tambunan", "Lubis", "Pardede", "Sinaga", "Hasibuan"];
const EXTRA = process.env.MOCK_USER_MANY ? 150 : 30;

const DDL = (ddlRows("jemaat", new URLSearchParams()) ?? []) as Omit<
  Jemaat,
  "codeInduk"
>[];

const JEMAAT: Jemaat[] = [
  ...DDL,
  ...Array.from({ length: EXTRA }, (_, index) => ({
    id: 100 + index,
    code: `JMT-${String(100 + index).padStart(4, "0")}`,
    name: `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]}${index >= 36 ? ` ${Math.floor(index / 36) + 1}` : ""}`,
  })),
].map((jemaat) => ({
  ...jemaat,
  codeInduk: jemaat.id === 12 ? "" : `A-${String(jemaat.id).padStart(4, "0")}`,
}));

const STATUSES: UserStatus[] = ["ACTIVE", "ACTIVE", "PENDING", "DEACTIVATED"];

const at = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const newPassword = () =>
  `Sada-${Math.random().toString(36).slice(2, 6)}${Math.floor(Math.random() * 90 + 10)}`;

let nextCode = 2;
const newCode = () => `USR-${String(nextCode++).padStart(4, "0")}`;

const toUser = (
  code: string,
  jemaat: Jemaat,
  role: Role,
  status: UserStatus,
  index: number,
): User => ({
  publicId: `user-${code}`,
  code,
  username: jemaat.codeInduk,
  status,
  lastLogin: status === "PENDING" ? null : at(index % 40),
  lastLoginIp: status === "PENDING" ? null : "10.0.0.12",
  deletedAt: status === "DEACTIVATED" ? at(index % 60) : null,
  role,
  jemaat,
});

let seeded: User[] | null = null;

// Akun sendiri memakai kode sesi dan role persona; jemaat tanpa akun: id 1, 2, 12, dan 5 terakhir.
function rowsOf(sessionCode: string): User[] {
  if (seeded) return seeded;

  const persona = PERSONAS[process.env.MOCK_PERSONA ?? "admin"];
  const selfRole =
    ROLES.find((role) => role.name === persona?.roleName) ?? ADMIN_ROLE;
  const self = toUser(
    sessionCode,
    {
      id: 0,
      code: "JMT-0012",
      name: persona?.jemaatName ?? "Admin Sistem",
      codeInduk: "A-0184",
    },
    selfRole,
    "ACTIVE",
    0,
  );
  const owners = JEMAAT.filter(
    (jemaat) => ![1, 2, 12].includes(jemaat.id),
  ).slice(0, -5);

  seeded = [
    self,
    ...owners.map((jemaat, index) =>
      toUser(
        newCode(),
        jemaat,
        ROLES[index % ROLES.length],
        STATUSES[index % STATUSES.length],
        index + 1,
      ),
    ),
  ];

  return seeded;
}

const isAssignable = (role: Role, isAdmin: boolean) =>
  isAdmin || role.id === OPERATOR_ROLE.id;

const notFound = () =>
  json({ status: 404, error: "User Tidak Ditemukan" }, 404);

const forbidden = (error: string) => json({ status: 403, error }, 403);

const ACCOUNT_ABOVE =
  "Anda Tidak Dapat Mengelola Akun Dengan Hak Akses Melebihi Milik Anda";
const ROLE_ABOVE =
  "Anda Tidak Dapat Memberikan Role Dengan Hak Akses Melebihi Milik Anda";

const SERVER_ERROR = { status: 500, error: "Kesalahan server." };

const toListRow = ({ role, jemaat, ...user }: User) => ({
  ...user,
  roleUser: { id: role.id, name: role.name },
  jemaat: { id: jemaat.id, code: jemaat.code, name: jemaat.name },
});

const toDetail = ({ role, jemaat, ...user }: User) => ({
  ...user,
  roleUser: role,
  jemaat: { code: jemaat.code, name: jemaat.name, codeInduk: jemaat.codeInduk },
});

const toCredential = (user: User, password: string) => ({
  code: user.code,
  name: user.jemaat.name,
  username: user.username,
  password,
});

async function readIds(request: Request) {
  const body = await readBody<Partial<Record<string, unknown>>>(request);
  const issues = [
    ["jemaatId", "Mohon Lengkapi ID Jemaat"],
    ["roleUserId", "Mohon Lengkapi Type Role"],
  ]
    .filter(([key]) => !Number.isFinite(Number(body[key] ?? NaN)))
    .map(([path, message]) => ({ path, message }));

  return {
    issues,
    jemaatId: Number(body.jemaatId),
    roleUserId: Number(body.roleUserId),
  };
}

async function create(context: MockContext, rows: User[]) {
  if (process.env.MOCK_USER_SAVE_ERROR) return json(SERVER_ERROR, 500);

  const body = await readIds(context.request);
  if (body.issues.length > 0) {
    return json(
      { status: 400, error: body.issues[0].message, issues: body.issues },
      400,
    );
  }

  const role = ROLES.find((item) => item.id === body.roleUserId);
  if (role && !isAssignable(role, context.isAdmin)) {
    return forbidden(ROLE_ABOVE);
  }

  const jemaat = JEMAAT.find((item) => item.id === body.jemaatId);
  if (!jemaat) {
    return json({ status: 400, error: "Jemaat Tidak Ditemukan" }, 400);
  }
  if (!role) return json({ status: 404, error: "Role Tidak Ditemukan" }, 404);
  if (!jemaat.codeInduk) {
    return json(
      {
        status: 400,
        error:
          "Mohon Lengkapi Kode Induk Jemaat Untuk Keperluan Pendaftaran Akun",
      },
      400,
    );
  }
  if (rows.some((user) => user.jemaat.id === jemaat.id)) {
    return json(SERVER_ERROR, 500);
  }

  const password = newPassword();
  const user = toUser(newCode(), jemaat, role, "PENDING", 0);

  rows.push(user);

  return json(
    {
      status: 201,
      message: "Berhasil Membuat Data User",
      data: toCredential(user, password),
    },
    201,
  );
}

async function update(context: MockContext, user: User | undefined) {
  if (process.env.MOCK_USER_SAVE_ERROR) return json(SERVER_ERROR, 500);

  const body = await readIds(context.request);
  if (body.issues.length > 0) {
    return json(
      { status: 400, error: body.issues[0].message, issues: body.issues },
      400,
    );
  }
  if (!user) return notFound();

  const role = ROLES.find((item) => item.id === body.roleUserId);
  if (!role) return json({ status: 404, error: "Role Tidak Ditemukan" }, 404);

  if (role.id !== user.role.id) {
    if (!isAssignable(user.role, context.isAdmin)) {
      return forbidden(ACCOUNT_ABOVE);
    }
    if (!isAssignable(role, context.isAdmin)) return forbidden(ROLE_ABOVE);
  }

  user.role = role;

  const { roleUser: _roleUser, jemaat, ...raw } = toListRow(user);

  return json({
    status: 200,
    message: "Berhasil Memperbarui Data User",
    data: { ...raw, roleUserId: role.id, jemaatId: jemaat.id },
  });
}

function issuePassword(user: User, message: string) {
  const password = newPassword();

  user.status = "PENDING";
  user.deletedAt = null;

  return json({ status: 200, message, data: toCredential(user, password) });
}

function deactivate(context: MockContext, rows: User[], user: User) {
  if (user.code === context.sessionCode) {
    return json(
      { status: 400, error: "Anda Tidak Dapat Menonaktifkan Akun Sendiri" },
      400,
    );
  }
  if (!isAssignable(user.role, context.isAdmin)) {
    return forbidden(ACCOUNT_ABOVE);
  }

  const isLastAdmin =
    user.role.isAdmin &&
    rows.filter((row) => row.role.isAdmin && row.status !== "DEACTIVATED")
      .length <= 1;
  if (isLastAdmin) {
    return json(
      { status: 400, error: "Minimal Harus Ada Satu Akun Administrator Aktif" },
      400,
    );
  }

  user.status = "DEACTIVATED";
  user.deletedAt = new Date().toISOString();

  return json({ status: 200, message: "Berhasil Menghapus Data User" });
}

function ddl(context: MockContext, rows: User[]) {
  const { url, path, can, isAdmin } = context;

  if (path === "/ddl/role-user" && url.searchParams.get("assignable") === "1") {
    const data = ROLES.filter((role) => isAssignable(role, isAdmin)).map(
      ({ id, name }) => ({ id, name }),
    );

    return json({ status: 200, message: "Berhasil Mendapatkan Data", data });
  }

  if (path !== "/ddl/jemaat" || url.searchParams.get("register") !== "0") {
    return null;
  }
  if (!can(MENU.USER, "VIEW")) return denied();

  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
  const limit = Number(url.searchParams.get("limit")) || JEMAAT.length;
  const data = JEMAAT.filter(
    (jemaat) =>
      !rows.some((user) => user.jemaat.id === jemaat.id) &&
      (!filter || jemaat.name.toLowerCase().includes(filter)),
  )
    .slice(0, limit)
    .map(({ id, code, name }) => ({ id, code, name }));

  return data.length === 0
    ? json({ status: 404, error: "Data Tidak Ditemukan" }, 404)
    : json({ status: 200, message: "Berhasil Mendapatkan Data", data });
}

export const userMock: MockHandler = async (context) => {
  const { url, path, method, can, isAdmin, sessionCode } = context;
  const rows = rowsOf(sessionCode);

  if (path.startsWith("/ddl/")) return ddl(context, rows);

  if (path === "/user") {
    if (method === "POST") {
      return can(MENU.USER, "CREATE") ? create(context, rows) : denied();
    }
    if (!can(MENU.USER, "VIEW")) return denied();
    if (process.env.MOCK_500) return json(SERVER_ERROR, 500);

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const matched = rows
      .filter(
        (user) =>
          !filter ||
          user.code.toLowerCase().includes(filter) ||
          user.jemaat.name.toLowerCase().includes(filter),
      )
      .filter((user) => !status || user.status === status)
      .filter((user) => !role || String(user.role.id) === role)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(toListRow);

    return list(
      matched,
      url,
      "Data User",
      "User",
      "Berhasil Mendapatkan Semua Data User",
    );
  }

  const action = path.match(/^\/user\/(reset|restore)\/([^/]+)$/);
  if (action && method === "PUT") {
    const user = rows.find(
      (row) => row.code.toLowerCase() === action[2].toLowerCase(),
    );

    if (action[1] === "reset") {
      if (!can(MENU.USER, "RESET")) return denied();
      if (!user) return notFound();
      if (!isAssignable(user.role, isAdmin)) return forbidden(ACCOUNT_ABOVE);

      return issuePassword(user, "Berhasil Memperbarui Data User");
    }

    if (!can(MENU.USER, "UPDATE")) return denied();
    if (!isAdmin) {
      return forbidden("Anda Tidak Memiliki Izin Untuk Mengatur Role");
    }
    if (!user) return notFound();
    if (user.status !== "DEACTIVATED") {
      return json({ status: 400, error: "Akun Ini Masih Aktif" }, 400);
    }

    return issuePassword(user, "Berhasil Mengaktifkan Kembali Data User");
  }

  const match = path.match(/^\/user\/([^/]+)$/);
  if (!match) return null;

  const user = rows.find(
    (row) => row.code.toLowerCase() === match[1].toLowerCase(),
  );

  if (method === "PUT") {
    return can(MENU.USER, "UPDATE") ? update(context, user) : denied();
  }
  if (method === "DELETE") {
    if (!can(MENU.USER, "DELETE")) return denied();
    return user ? deactivate(context, rows, user) : notFound();
  }

  if (!can(MENU.USER, "VIEW")) return denied();
  return user
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Data User",
        data: toDetail(user),
      })
    : notFound();
};
