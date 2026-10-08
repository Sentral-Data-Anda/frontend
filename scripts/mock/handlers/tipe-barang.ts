/**
 * Tiruan `/api/v1/type-item` (be-sada `modules/type_item`) di atas larik TYPE_ITEM store Inventaris.
 *
 *   MOCK_EMPTY=1                    → daftar kosong (404)
 *   MOCK_500=1                      → daftar menjawab 500
 *   MOCK_TYPE_ITEM_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import {
  ASSET,
  STOCK_ITEM,
  TYPE_ITEM,
  codeOf,
  isLive,
  nextId,
  type TypeItemRow,
} from "../inventaris-store";
import { accountRef } from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Tipe Barang Tidak Ditemukan";
const IN_USE =
  "Tipe Barang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang";

/**
 * Bentuk yang sama dengan be-sada: id akun TETAP ada di baris (form memakainya
 * untuk memilih ulang) DAN akun yang sudah diselesaikan ada di sebelahnya.
 * Sebelumnya hanya id-nya yang dikirim, dan layar membaca objeknya -- jadi
 * setiap field terkunci berbunyi "Belum diatur" betapa pun terisinya datanya.
 */
const view = (row: TypeItemRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  assetAccountId: row.assetAccountId,
  depreciationExpenseAccountId: row.depreciationExpenseAccountId,
  accumulatedDepreciationAccountId: row.accumulatedDepreciationAccountId,
  assetAccount: accountRef(row.assetAccountId),
  depreciationExpenseAccount: accountRef(row.depreciationExpenseAccountId),
  accumulatedDepreciationAccount: accountRef(
    row.accumulatedDepreciationAccountId,
  ),
});

const byName = (a: TypeItemRow, b: TypeItemRow) =>
  a.name.localeCompare(b.name, "id");

const findRow = (code: string) =>
  TYPE_ITEM.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const nameError = (status: number, message: string) =>
  json({ status, error: message, issues: [{ path: "name", message }] }, status);

const messageOf = (name: string) => {
  if (name.length < 2) {
    return "Nama Tipe Barang harus memiliki setidaknya 2 karakter";
  }
  if (name.length > 50) {
    return "Nama Tipe Barang tidak boleh lebih dari 50 karakter";
  }

  return null;
};

/** Id akun dari body: null yang berarti kosong, bukan field yang hilang. */
const idOf = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;

const parse = (body: Record<string, unknown>) => {
  if (typeof body.name !== "string") {
    return { failure: nameError(400, "Mohon Lengkapi Nama Tipe Barang") };
  }

  const name = collapseSpaces(body.name);
  const message = messageOf(name);
  if (message) return { failure: nameError(400, message) };

  return {
    name,
    accounts: {
      assetAccountId: idOf(body.assetAccountId),
      depreciationExpenseAccountId: idOf(body.depreciationExpenseAccountId),
      accumulatedDepreciationAccountId: idOf(
        body.accumulatedDepreciationAccountId,
      ),
    },
  };
};

const isNameTaken = (name: string) =>
  TYPE_ITEM.some(
    (row) => isLive(row) && row.name.toLowerCase() === name.toLowerCase(),
  );

const taken = () => nameError(409, "Tipe Barang Sudah Tersedia");

const isInUse = (id: number) =>
  ASSET.some((row) => isLive(row) && row.typeId === id) ||
  STOCK_ITEM.some((row) => isLive(row) && row.typeId === id);

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const tipeBarangMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/type-item" && !path.startsWith("/type-item/")) return null;

  const code = path.match(/^\/type-item\/([^/]+)$/)?.[1];

  if (!can(MENU.TIPE_BARANG, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_TYPE_ITEM_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/type-item" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      TYPE_ITEM.filter(
        (row) => isLive(row) && row.name.toLowerCase().includes(filter),
      )
        .sort(byName)
        .map(view),
      url,
      "Tipe Barang",
      "Tipe Barang",
    );
  }

  if (path === "/type-item" && method === "POST") {
    const parsed = parse(await readBody<Record<string, unknown>>(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.name)) return taken();

    const id = nextId(TYPE_ITEM);
    const row: TypeItemRow = {
      id,
      publicId: crypto.randomUUID(),
      code: codeOf("TYP_ITM"),
      name: parsed.name,
      deletedAt: null,
      ...parsed.accounts,
    };
    TYPE_ITEM.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Tipe Barang", data: view(row) },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<Record<string, unknown>>(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const isRenamed = parsed.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.name)) return taken();

    row.name = parsed.name;
    Object.assign(row, parsed.accounts);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Tipe Barang",
      data: view(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Tipe Barang",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (isInUse(row.id)) return json({ status: 400, error: IN_USE }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Tipe Barang",
      data: view(row),
    });
  }

  return null;
};
