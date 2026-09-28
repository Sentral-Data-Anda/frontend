/**
 * Tiruan `/api/v1/unit` (be-sada `modules/unit`) di atas larik UNIT store Inventaris.
 *
 *   MOCK_EMPTY=1                    → daftar kosong (404)
 *   MOCK_500=1                      → daftar menjawab 500
 *   MOCK_UNIT_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import {
  STOCK_ITEM,
  UNIT,
  codeOf,
  isLive,
  nextId,
  type MasterRow,
} from "../inventaris-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Satuan Tidak Ditemukan";
const IN_USE = "Satuan Tidak Dapat Dihapus Karena Terhubung dengan Data Barang";

const view = ({ id, publicId, code, name }: MasterRow) => ({
  id,
  publicId,
  code,
  name,
});

const byName = (a: MasterRow, b: MasterRow) =>
  a.name.localeCompare(b.name, "id");

const findRow = (code: string) =>
  UNIT.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const nameError = (status: number, message: string) =>
  json({ status, error: message, issues: [{ path: "name", message }] }, status);

const messageOf = (name: string) => {
  if (name.length < 1) {
    return "Nama Satuan tidak boleh kurang dari 1 karakter";
  }
  if (name.length > 30) {
    return "Nama Satuan tidak boleh lebih dari 30 karakter";
  }

  return null;
};

const parse = (body: { name?: unknown }) => {
  if (typeof body.name !== "string") {
    return { failure: nameError(400, "Mohon Lengkapi Nama Satuan") };
  }

  const name = collapseSpaces(body.name);
  const message = messageOf(name);

  return message ? { failure: nameError(400, message) } : { name };
};

const isNameTaken = (name: string) =>
  UNIT.some(
    (row) => isLive(row) && row.name.toLowerCase() === name.toLowerCase(),
  );

const taken = () => nameError(409, "Satuan Sudah Tersedia");

const isInUse = (id: number) =>
  STOCK_ITEM.some((row) => isLive(row) && row.unitId === id);

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const satuanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/unit" && !path.startsWith("/unit/")) return null;

  const code = path.match(/^\/unit\/([^/]+)$/)?.[1];

  if (!can(MENU.SATUAN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_UNIT_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/unit" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      UNIT.filter(
        (row) => isLive(row) && row.name.toLowerCase().includes(filter),
      )
        .sort(byName)
        .map(view),
      url,
      "Satuan",
      "Satuan",
    );
  }

  if (path === "/unit" && method === "POST") {
    const parsed = parse(await readBody<{ name?: unknown }>(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.name)) return taken();

    const id = nextId(UNIT);
    const row: MasterRow = {
      id,
      publicId: crypto.randomUUID(),
      code: codeOf("UNT"),
      name: parsed.name,
      deletedAt: null,
    };
    UNIT.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Satuan", data: view(row) },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<{ name?: unknown }>(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const isRenamed = parsed.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.name)) return taken();

    row.name = parsed.name;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Satuan",
      data: view(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Satuan",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (isInUse(row.id)) return json({ status: 400, error: IN_USE }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Satuan",
      data: view(row),
    });
  }

  return null;
};
