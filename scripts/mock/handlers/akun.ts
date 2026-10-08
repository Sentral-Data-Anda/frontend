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
  ACCOUNTING_SETTING,
  TYPE_PERSEMBAHAN,
  accountOf,
  accountView,
  isLive,
  nextId,
  type AccountRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Akun Tidak Ditemukan";
const MAX_DEPTH = 4;

const IN_USE_SOURCES: [string, (row: AccountRow) => boolean][] = [
  ["Baris Jurnal", (row) => row.hasJournal],
  [
    "Setelan Akuntansi",
    (row) => ACCOUNTING_SETTING.some((item) => item.accountId === row.id),
  ],
  [
    "Tipe Persembahan",
    (row) => TYPE_PERSEMBAHAN.some((item) => item.accountId === row.id),
  ],
];

const usedBy = (row: AccountRow) =>
  IN_USE_SOURCES.filter(([, isUsed]) => isUsed(row)).map(([label]) => label);

type Body = {
  code?: unknown;
  name?: unknown;
  type?: unknown;
  parentAccountId?: unknown;
  isActive?: unknown;
  netAssetClass?: unknown;
  cashFlowCategory?: unknown;
};

const fieldError = (
  status: number,
  path: string,
  message: string,
  code?: string,
) =>
  json({ status, error: message, code, issues: [{ path, message }] }, status);

const refusal = (code: string, message: string) =>
  json({ status: 400, error: message, code }, 400);

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

  // `undefined` berarti "jangan ubah", null berarti "kosongkan". Dua hal
  // berbeda, sama seperti `isActive` di atas: form yang tidak mengirim field
  // tidak boleh diam-diam mengubah klasifikasi yang sudah dipilih seseorang.
  const classOf = <T extends string>(value: unknown, allowed: readonly T[]) =>
    value === undefined
      ? undefined
      : value === null
        ? null
        : allowed.includes(value as T)
          ? (value as T)
          : undefined;

  return {
    code,
    name,
    type: type as AccountRow["type"],
    parentAccountId,
    isActive: body.isActive !== false,
    netAssetClass: classOf(body.netAssetClass, [
      "TANPA_PEMBATASAN",
      "DENGAN_PEMBATASAN",
    ] as const),
    cashFlowCategory: classOf(body.cashFlowCategory, [
      "KAS",
      "OPERASI",
      "INVESTASI",
      "PENDANAAN",
    ] as const),
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

  if (selfId !== null && parent.id === selfId) {
    return fieldError(
      400,
      "parentAccountId",
      "Akun Induk Tidak Boleh Akun Itu Sendiri",
    );
  }

  if (selfId !== null && isDescendant(parent.id, selfId)) {
    return fieldError(
      400,
      "parentAccountId",
      "Akun Induk Tidak Boleh Membentuk Siklus",
    );
  }

  if (parent.type !== type) {
    return fieldError(400, "parentAccountId", "Akun Induk Harus Bertipe Sama");
  }

  if (depthOf(parentAccountId) > MAX_DEPTH) {
    return fieldError(
      400,
      "parentAccountId",
      `Akun Tidak Boleh Lebih Dari ${MAX_DEPTH} Tingkat`,
    );
  }

  return null;
}

const hasChildren = (id: number) =>
  ACCOUNT.some((row) => isLive(row) && row.parentAccountId === id);

// `1`/`true`/`0`/`false` bebas huruf besar-kecil; tidak terbaca = tidak menyaring.
const boolParam = (value: string | null) => {
  const text = (value ?? "").toLowerCase();

  if (text === "1" || text === "true") return true;
  if (text === "0" || text === "false") return false;

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
    const isActive = boolParam(url.searchParams.get("isActive"));
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
            (isActive === null || row.isActive === isActive) &&
            (!parentAccountId ||
              row.parentAccountId === Number(parentAccountId)),
        )
          .sort((a, b) => a.code.localeCompare(b.code, "id"))
          .map((row) => accountView(row));

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
      netAssetClass: parsed.netAssetClass ?? null,
      cashFlowCategory: parsed.cashFlowCategory ?? null,
    };
    ACCOUNT.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Akun",
        data: accountView(row, true),
      },
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
        "Tipe Akun Tidak Dapat Diubah Karena Sudah Memiliki Baris Jurnal",
        "ACCOUNT_TYPE_LOCKED",
      );
    }

    row.name = parsed.name;
    row.type = parsed.type;
    row.parentAccountId = parsed.parentAccountId;
    row.isActive = parsed.isActive;
    if (parsed.netAssetClass !== undefined) {
      row.netAssetClass = parsed.netAssetClass;
    }
    if (parsed.cashFlowCategory !== undefined) {
      row.cashFlowCategory = parsed.cashFlowCategory;
    }

    return json({
      status: 200,
      message: "Berhasil Memperbarui Akun",
      data: accountView(row, true),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Akun",
      data: accountView(row, true),
    });
  }

  if (method === "DELETE") {
    if (hasChildren(row.id)) {
      return refusal(
        "ACCOUNT_HAS_CHILDREN",
        "Akun Tidak Dapat Dihapus Karena Masih Memiliki Akun Turunan",
      );
    }

    const sources = usedBy(row);

    if (sources.length > 0) {
      return refusal(
        "ACCOUNT_IN_USE",
        `Akun Tidak Dapat Dihapus Karena Sudah Dipakai ${sources.join(", ")}. Nonaktifkan Saja`,
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Akun",
      data: accountView(row, true),
    });
  }

  return null;
};
