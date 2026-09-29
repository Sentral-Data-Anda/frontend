/**
 * Tiruan `/api/v1/type-persembahan` (be-sada `modules/type_persembahan`).
 *
 *   MOCK_EMPTY=1                 → daftar kosong (404)
 *   MOCK_500=1                   → daftar menjawab 500
 *   MOCK_TYPE_SAVE_ERROR=500     → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import {
  TYPE_PERSEMBAHAN,
  accountOf,
  isLive,
  nextId,
  typePersembahanView,
  type TypePersembahanRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Tipe Persembahan Tidak Ditemukan";
const IN_USE =
  "Tipe Persembahan Tidak Dapat Dihapus Karena Sudah Dipakai Persembahan";

type Body = {
  name?: unknown;
  isActive?: unknown;
  hasPeriod?: unknown;
  requiresJemaat?: unknown;
  accountId?: unknown;
};

const issue = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

const findRow = (code: string) =>
  TYPE_PERSEMBAHAN.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const nameMessageOf = (name: string) => {
  if (name.length < 4) {
    return "Nama Tipe Persembahan harus memiliki setidaknya 4 karakter";
  }
  if (name.length > 50) {
    return "Nama Tipe Persembahan tidak boleh lebih dari 50 karakter";
  }

  return null;
};

const isNameTaken = (name: string, skipId: number | null) =>
  TYPE_PERSEMBAHAN.some(
    (row) =>
      isLive(row) &&
      row.id !== skipId &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

const parse = (body: Body) => {
  if (typeof body.name !== "string") {
    return {
      failure: issue(400, "name", "Mohon Lengkapi Nama Tipe Persembahan"),
    };
  }

  const name = collapseSpaces(body.name);
  const message = nameMessageOf(name);

  if (message) return { failure: issue(400, "name", message) };

  const accountId =
    body.accountId === null || body.accountId === undefined
      ? null
      : Number(body.accountId);

  return {
    name,
    accountId,
    isActive: body.isActive !== false,
    hasPeriod: body.hasPeriod === true,
    requiresJemaat: body.requiresJemaat === true,
  };
};

const accountFailure = (accountId: number | null) => {
  if (accountId === null) return null;

  const account = accountOf(accountId);

  if (!account || !isLive(account)) {
    return issue(404, "accountId", "Akun Tidak Ditemukan");
  }
  if (!account.isActive) return issue(400, "accountId", "Akun Tidak Aktif");
  if (account.type !== "INCOME") {
    return issue(400, "accountId", "Akun Harus Bertipe Pendapatan");
  }

  return null;
};

// Larik Persembahan belum ada di store; akun yang sudah berjurnal jadi penandanya.
const isInUse = (row: TypePersembahanRow) =>
  accountOf(row.accountId)?.hasJournal === true;

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const tipePersembahanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/type-persembahan" && !path.startsWith("/type-persembahan/")) {
    return null;
  }

  const code = path.match(/^\/type-persembahan\/([^/]+)$/)?.[1];

  if (!can(MENU.TIPE_PERSEMBAHAN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_TYPE_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/type-persembahan" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const isActive = url.searchParams.get("isActive");

    return list(
      TYPE_PERSEMBAHAN.filter(
        (row) =>
          isLive(row) &&
          row.name.toLowerCase().includes(filter) &&
          (!isActive || row.isActive === (isActive === "true")),
      )
        .sort((a, b) => a.name.localeCompare(b.name, "id"))
        .map(typePersembahanView),
      url,
      "Tipe Persembahan",
      "Tipe Persembahan",
    );
  }

  if (path === "/type-persembahan" && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    if (isNameTaken(parsed.name, null)) {
      return issue(409, "name", "Tipe Persembahan Sudah Tersedia");
    }

    const failure = accountFailure(parsed.accountId);
    if (failure) return failure;

    const id = nextId(TYPE_PERSEMBAHAN);
    const row: TypePersembahanRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `TPS-${String(id).padStart(4, "0")}`,
      name: parsed.name,
      isActive: parsed.isActive,
      hasPeriod: parsed.hasPeriod,
      requiresJemaat: parsed.requiresJemaat,
      accountId: parsed.accountId,
      deletedAt: null,
    };
    TYPE_PERSEMBAHAN.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Tipe Persembahan",
        data: typePersembahanView(row),
      },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return json({ status: 404, error: NOT_FOUND }, 404);

    if (isNameTaken(parsed.name, row.id)) {
      return issue(409, "name", "Tipe Persembahan Sudah Tersedia");
    }

    const failure = accountFailure(parsed.accountId);
    if (failure) return failure;

    row.name = parsed.name;
    row.isActive = parsed.isActive;
    row.hasPeriod = parsed.hasPeriod;
    row.requiresJemaat = parsed.requiresJemaat;
    row.accountId = parsed.accountId;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Tipe Persembahan",
      data: typePersembahanView(row),
    });
  }

  const row = findRow(code);
  if (!row) return json({ status: 404, error: NOT_FOUND }, 404);

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Tipe Persembahan",
      data: typePersembahanView(row),
    });
  }

  if (method === "DELETE") {
    if (isInUse(row)) return json({ status: 400, error: IN_USE }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Tipe Persembahan",
      data: typePersembahanView(row),
    });
  }

  return null;
};
