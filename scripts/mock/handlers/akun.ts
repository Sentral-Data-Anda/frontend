/**
 * Tiruan `/api/v1/account` (be-sada `modules/account`) di atas larik ACCOUNT store Keuangan.
 *
 *   MOCK_NO_ACCOUNTS=1            → chart of accounts kosong (404): keadaan instalasi baru
 *   MOCK_EMPTY=1                  → daftar kosong (404)
 *   MOCK_500=1                    → daftar menjawab 500
 *   MOCK_ACCOUNT_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { ACCOUNT_TYPES } from "../../../src/types/keuangan";
import {
  ACCOUNT,
  accountOf,
  accountView,
  isLive,
  nextId,
  type AccountRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Akun Tidak Ditemukan";
const MAX_DEPTH = 4;

type Body = {
  code?: unknown;
  name?: unknown;
  type?: unknown;
  parentAccountId?: unknown;
  isActive?: unknown;
};

const fieldError = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const findRow = (code: string) =>
  ACCOUNT.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const codeError = (code: string) => {
  if (code.length < 1) return "Mohon Lengkapi Kode Akun";
  if (code.length > 20) return "Kode Akun tidak boleh lebih dari 20 karakter";
  if (!/^[A-Za-z0-9.-]+$/.test(code)) return "Format Kode Akun Tidak Valid";

  return null;
};

const nameError = (name: string) => {
  if (name.length < 1) return "Mohon Lengkapi Nama Akun";
  if (name.length > 100) return "Nama Akun tidak boleh lebih dari 100 karakter";

  return null;
};

function parse(body: Body) {
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const codeMessage = codeError(code);

  if (codeMessage) return { failure: fieldError(400, "code", codeMessage) };

  const name = typeof body.name === "string" ? collapseSpaces(body.name) : "";
  const nameMessage = nameError(name);

  if (nameMessage) return { failure: fieldError(400, "name", nameMessage) };

  const type = body.type;

  if (!ACCOUNT_TYPES.some((value) => value === type)) {
    return { failure: fieldError(400, "type", "Mohon Lengkapi Tipe Akun") };
  }

  const parentAccountId =
    typeof body.parentAccountId === "number" ? body.parentAccountId : null;

  return {
    code,
    name,
    type: type as AccountRow["type"],
    parentAccountId,
    isActive: body.isActive !== false,
  };
}

const depthOf = (parentAccountId: number | null) => {
  let depth = 1;
  let parent = accountOf(parentAccountId);

  while (parent) {
    depth += 1;
    parent = accountOf(parent.parentAccountId);
  }

  return depth;
};

const isDescendant = (candidateId: number, rootId: number) => {
  let parent = accountOf(candidateId);

  while (parent) {
    if (parent.id === rootId) return true;
    parent = accountOf(parent.parentAccountId);
  }

  return false;
};

function parentFailure(
  parentAccountId: number | null,
  type: AccountRow["type"],
  selfId: number | null,
) {
  if (parentAccountId === null) return null;

  const parent = accountOf(parentAccountId);

  if (!parent || !isLive(parent)) {
    return fieldError(404, "parentAccountId", "Akun Induk Tidak Ditemukan");
  }

  if (selfId !== null && isDescendant(parent.id, selfId)) {
    return fieldError(
      400,
      "parentAccountId",
      "Akun Induk Tidak Boleh Akun Itu Sendiri atau Turunannya",
    );
  }

  if (parent.type !== type) {
    return fieldError(400, "parentAccountId", "Akun Induk Harus Bertipe Sama");
  }

  if (depthOf(parentAccountId) > MAX_DEPTH) {
    return fieldError(
      400,
      "parentAccountId",
      `Akun Tidak Boleh Lebih Dalam dari ${MAX_DEPTH} Tingkat`,
    );
  }

  return null;
}

const hasChildren = (id: number) =>
  ACCOUNT.some((row) => isLive(row) && row.parentAccountId === id);

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const akunMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/account" && !path.startsWith("/account/")) return null;

  const code = path.match(/^\/account\/([^/]+)$/)?.[1];

  if (!can(MENU.AKUN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_ACCOUNT_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/account" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const type = url.searchParams.get("type");
    const isActive = url.searchParams.get("isActive");
    const parentAccountId = url.searchParams.get("parentAccountId");
    const rows = process.env.MOCK_NO_ACCOUNTS
      ? []
      : ACCOUNT.filter(
          (row) =>
            isLive(row) &&
            (!filter ||
              row.code.toLowerCase().includes(filter) ||
              row.name.toLowerCase().includes(filter)) &&
            (!type || row.type === type) &&
            (!isActive || row.isActive === (isActive === "true")) &&
            (!parentAccountId ||
              row.parentAccountId === Number(parentAccountId)),
        )
          .sort((a, b) => a.code.localeCompare(b.code, "id"))
          .map(accountView);

    return list(rows, url, "Akun", "Akun");
  }

  if (path === "/account" && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    if (findRow(parsed.code)) {
      return fieldError(409, "code", "Akun Sudah Tersedia");
    }

    const failure = parentFailure(parsed.parentAccountId, parsed.type, null);
    if (failure) return failure;

    const row: AccountRow = {
      id: nextId(ACCOUNT),
      publicId: crypto.randomUUID(),
      code: parsed.code.toUpperCase(),
      name: parsed.name,
      type: parsed.type,
      parentAccountId: parsed.parentAccountId,
      isActive: parsed.isActive,
      deletedAt: null,
      hasJournal: false,
    };
    ACCOUNT.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Akun", data: accountView(row) },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const isRecoded = parsed.code.toLowerCase() !== row.code.toLowerCase();
    if (isRecoded && findRow(parsed.code)) {
      return fieldError(409, "code", "Akun Sudah Tersedia");
    }

    const failure = parentFailure(parsed.parentAccountId, parsed.type, row.id);
    if (failure) return failure;

    if (parsed.type !== row.type && row.hasJournal) {
      return fieldError(
        400,
        "type",
        "Tipe Akun Tidak Dapat Diubah Karena Sudah Dipakai Jurnal",
      );
    }

    row.name = parsed.name;
    row.type = parsed.type;
    row.parentAccountId = parsed.parentAccountId;
    row.isActive = parsed.isActive;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Akun",
      data: accountView(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Akun",
      data: accountView(row),
    });
  }

  if (method === "DELETE") {
    if (hasChildren(row.id)) {
      return json(
        {
          status: 400,
          error: "Akun Tidak Dapat Dihapus Karena Masih Memiliki Sub Akun",
        },
        400,
      );
    }

    if (row.hasJournal) {
      return json(
        {
          status: 400,
          error:
            "Akun Tidak Dapat Dihapus Karena Sudah Dipakai Jurnal. Nonaktifkan Saja",
        },
        400,
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Akun",
      data: accountView(row),
    });
  }

  return null;
};
