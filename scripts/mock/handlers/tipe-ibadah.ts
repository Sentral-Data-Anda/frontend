/**
 * Tiruan `/api/v1/type-ibadah` (be-sada `modules/type_ibadah`) dan
 * `GET /ddl/type-ibadah` dari state yang sama, supaya menonaktifkan atau
 * mengganti nama tipe langsung terlihat di form dan filter Ibadah.
 *
 *   MOCK_EMPTY=1                       → daftar tipe ibadah kosong (404)
 *   MOCK_500=1                         → daftar tipe ibadah menjawab 500
 *   MOCK_TIPE_IBADAH_SAVE_ERROR=500    → POST/PUT/DELETE menjawab 500
 *   MOCK_DDL_EMPTY=1                   → ddl kosong (404), sama dengan ddl lain
 *
 * Tipe seed (id 1–5) dipakai ibadah mock, jadi hapusnya 400. Tipe baru bisa dihapus.
 */
import { MENU } from "../../../src/config/menu";
import { TYPE_IBADAH_ROWS } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Row = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string | null;
  deletedBy: number | null;
  deletedAt: string | null;
};

type Body = { name?: unknown; isActive?: unknown };

const SEEDED_AT = "2026-01-05T02:00:00.000Z";
const USED_IDS = new Set(TYPE_IBADAH_ROWS.map((row) => row.id));
const NOT_FOUND = "Tipe Ibadah Tidak Ditemukan";
const IN_USE =
  "Tipe Ibadah Tidak Dapat Dihapus Karena Masih Digunakan oleh Data Ibadah. Nonaktifkan Tipe Ibadah Ini Jika Tidak Ingin Dipakai Lagi";

const toRow = (id: number, name: string, isActive: boolean): Row => ({
  id,
  publicId: `type-ibadah-${id}`,
  code: `TYP_IBD-${String(id).padStart(4, "0")}`,
  name,
  isActive,
  createdBy: 1,
  createdAt: SEEDED_AT,
  updatedBy: null,
  updatedAt: null,
  deletedBy: null,
  deletedAt: null,
});

const rows: Row[] = TYPE_IBADAH_ROWS.map((row) =>
  toRow(row.id, row.name, row.isActive),
);

export const findTipeIbadah = (id: number) => rows.find((row) => row.id === id);

let lastId = Math.max(0, ...rows.map((row) => row.id));

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const byName = (a: Row, b: Row) => a.name.localeCompare(b.name);

const findRow = (code: string) =>
  rows.find((row) => row.code.toLowerCase() === code.toLowerCase());

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const BOOLEAN_TEXT: Record<string, boolean> = {
  true: true,
  "1": true,
  on: true,
  yes: true,
  false: false,
  "0": false,
  off: false,
  no: false,
};

const readActive = (value: unknown): boolean | null => {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;

  return BOOLEAN_TEXT[value.trim().toLowerCase()] ?? null;
};

const parse = (body: Body) => {
  const issues: { path: string; message: string }[] = [];
  const name = typeof body.name === "string" ? normalize(body.name) : "";
  const isActive = readActive(body.isActive);

  if (!name) {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Tipe Ibadah" });
  } else if (name.length > 50) {
    issues.push({
      path: "name",
      message: "Nama Tipe Ibadah tidak boleh lebih dari 50 karakter",
    });
  }
  if (isActive === null) {
    issues.push({
      path: "isActive",
      message: "Status Aktif harus bernilai true atau false",
    });
  }

  if (issues.length) {
    return {
      failure: json({ status: 400, error: issues[0].message, issues }, 400),
    };
  }

  return { value: { name, isActive: isActive ?? true } };
};

const isNameTaken = (name: string) =>
  rows.some((row) => row.name.toLowerCase() === name.toLowerCase());

const taken = () =>
  json({ status: 409, error: "Tipe Ibadah Sudah Tersedia" }, 409);

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const tipeIbadahMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/type-ibadah" && method === "GET") {
    if (!can(MENU.TIPE_IBADAH, "VIEW") && !can(MENU.IBADAH, "VIEW")) {
      return denied();
    }
    if (process.env.MOCK_DDL_EMPTY || rows.length === 0) return notFound();

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Tipe Ibadah",
      data: [...rows]
        .sort(byName)
        .map(({ id, code, name, isActive }) => ({ id, code, name, isActive })),
    });
  }

  if (path !== "/type-ibadah" && !path.startsWith("/type-ibadah/")) {
    return null;
  }

  const code = path.match(/^\/type-ibadah\/([^/]+)$/)?.[1];

  if (!can(MENU.TIPE_IBADAH, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_TIPE_IBADAH_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/type-ibadah" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const isActive = url.searchParams.get("isActive");

    return list(
      rows
        .filter(
          (row) =>
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter),
        )
        .filter(
          (row) =>
            (isActive !== "true" && isActive !== "false") ||
            row.isActive === (isActive === "true"),
        )
        .sort(byName),
      url,
      "Tipe Ibadah",
      "Tipe Ibadah",
    );
  }

  if (path === "/type-ibadah" && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.value.name)) return taken();

    lastId += 1;
    const row = toRow(lastId, parsed.value.name, parsed.value.isActive);
    row.createdAt = new Date().toISOString();
    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Tipe Ibadah", data: row },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const isRenamed =
      parsed.value.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.value.name)) return taken();

    row.name = parsed.value.name;
    row.isActive = parsed.value.isActive;
    row.updatedBy = 1;
    row.updatedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Memperbarui Tipe Ibadah",
      data: row,
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Tipe Ibadah",
      data: row,
    });
  }

  if (method === "DELETE") {
    if (USED_IDS.has(row.id)) {
      return json({ status: 400, error: IN_USE }, 400);
    }

    rows.splice(rows.indexOf(row), 1);
    row.deletedBy = 1;
    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Tipe Ibadah",
      data: row,
    });
  }

  return null;
};
