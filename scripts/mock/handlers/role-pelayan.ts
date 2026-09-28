/**
 * Tiruan `/api/v1/role-pelayan` (be-sada `modules/role_pelayan`) atas larik
 * `ROLE_PELAYAN` store; `/ddl/role-pelayan` dijawab `pelayanan-ddl.ts`.
 *
 *   MOCK_EMPTY=1                      → daftar kosong (404)
 *   MOCK_500=1                        → daftar menjawab 500
 *   MOCK_ROLE_PELAYAN_SAVE_ERROR=500  → POST/PUT/DELETE menjawab 500
 *
 * Seed 1–7 dipakai (hapus 400); "Pemusik" terkunci; role baru bisa dihapus.
 */
import { MENU } from "../../../src/config/menu";
import { todayJakarta } from "../../../src/lib/date";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  GROUP_PELAYAN,
  isLive,
  JADWAL_PELAYAN,
  ROLE_PELAYAN,
  nextId,
  PELAYAN,
  TEMPLATE_JADWAL,
  type RolePelayanRow,
} from "../pelayanan-store";

const NOT_FOUND = "Role Pelayan Tidak Ditemukan";
const IN_USE = "Role Pelayan Tidak Dapat Dihapus Karena Masih Digunakan oleh";
const LOCKED =
  "Role Pemusik Dipakai Sistem dan Tidak Dapat Diubah atau Dihapus";

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const toRow = ({ id, name }: RolePelayanRow) => ({
  id,
  publicId: `role-pelayan-${id}`,
  name,
});

const byName = (a: RolePelayanRow, b: RolePelayanRow) =>
  a.name.localeCompare(b.name);

const liveRows = () => ROLE_PELAYAN.filter(isLive);

const findRow = (id: string) => liveRows().find((row) => String(row.id) === id);

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const nameErrorOf = (name: string | null) => {
  if (name === null) return "Mohon Lengkapi Nama Role Pelayan";
  if (name.length < 2) {
    return "Nama Role Pelayan harus memiliki setidaknya 2 karakter";
  }
  if (name.length > 50) {
    return "Nama Role Pelayan tidak boleh lebih dari 50 karakter";
  }

  return null;
};

const parse = (body: { name?: unknown }) => {
  const name = typeof body.name === "string" ? normalize(body.name) : null;
  const error = nameErrorOf(name);

  if (error !== null || name === null) {
    return {
      failure: json(
        { status: 400, error, issues: [{ path: "name", message: error }] },
        400,
      ),
    };
  }

  return { name };
};

const isNameTaken = (name: string) =>
  liveRows().some((row) => row.name.toLowerCase() === name.toLowerCase());

const TAKEN = "Role Pelayan Sudah Tersedia";

const taken = () =>
  json(
    { status: 409, error: TAKEN, issues: [{ path: "name", message: TAKEN }] },
    409,
  );

const isPemusik = (row: RolePelayanRow) =>
  row.name.trim().toLowerCase() === "pemusik";

const usageOf = (id: number) => {
  const today = todayJakarta();

  if (
    PELAYAN.some((row) => isLive(row) && row.roleIds.includes(id)) ||
    GROUP_PELAYAN.some((row) => isLive(row) && row.rolePelayanId === id)
  ) {
    return "Pelayan";
  }
  if (
    TEMPLATE_JADWAL.some(
      (row) =>
        isLive(row) && row.detail.some((slot) => slot.rolePelayanId === id),
    )
  ) {
    return "Template Jadwal";
  }
  if (
    JADWAL_PELAYAN.some(
      (row) =>
        isLive(row) &&
        row.date >= today &&
        row.detail.some((slot) => slot.rolePelayanId === id),
    )
  ) {
    return "Jadwal Pelayan";
  }

  return null;
};

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const rolePelayanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/role-pelayan" && !path.startsWith("/role-pelayan/")) {
    return null;
  }

  const id = path.match(/^\/role-pelayan\/([^/]+)$/)?.[1];

  if (!can(MENU.ROLE_PELAYAN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_ROLE_PELAYAN_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/role-pelayan" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      liveRows()
        .filter((row) => row.name.toLowerCase().includes(filter))
        .sort(byName)
        .map(toRow),
      url,
      "Role Pelayan",
      "Role Pelayan",
    );
  }

  if (path === "/role-pelayan" && method === "POST") {
    const parsed = parse(await readBody(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.name)) return taken();

    const row = {
      id: nextId(ROLE_PELAYAN),
      name: parsed.name,
      deletedAt: null,
    };
    ROLE_PELAYAN.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Role Pelayan",
        data: toRow(row),
      },
      201,
    );
  }

  if (!id) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(id);
    if (!row) return notFound();
    if (isPemusik(row)) return json({ status: 400, error: LOCKED }, 400);

    const isRenamed = parsed.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.name)) return taken();

    row.name = parsed.name;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Role Pelayan",
      data: toRow(row),
    });
  }

  const row = findRow(id);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Role Pelayan",
      data: toRow(row),
    });
  }

  if (method === "DELETE") {
    if (isPemusik(row)) return json({ status: 400, error: LOCKED }, 400);

    const usage = usageOf(row.id);
    if (usage) return json({ status: 400, error: `${IN_USE} ${usage}` }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Role Pelayan",
      data: toRow(row),
    });
  }

  return null;
};
