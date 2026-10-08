/**
 * Tiruan `/api/v1/barang-persediaan` (be-sada `modules/barang_persediaan`, bentuk
 * kontrak final inventaris-gaps) dari larik `STOCK_ITEM` di inventaris-store.
 *
 *   MOCK_EMPTY=1                        → daftar kosong (404)
 *   MOCK_500=1                          → daftar menjawab 500
 *   MOCK_STOCK_ITEM_SAVE_ERROR=500      → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { ROOM, bapelOf } from "../fasilitas-store";
import {
  STOCK_ITEM,
  TODAY,
  TYPE_ITEM,
  UNIT,
  applyMovement,
  codeOf,
  isLive,
  nextId,
  stockItemView,
  type StockItemRow,
} from "../inventaris-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

type Issue = { path: string; message: string };

type Body = Partial<Record<string, unknown>>;

type Input = {
  name: string;
  description: string;
  typeId: number;
  bapelId: number;
  roomId: number;
  unitId: number;
  reorderPoint: number | null;
  openingQuantity: number;
};

const NOT_FOUND = "Barang Persediaan Tidak Ditemukan";

const ACTION: Record<string, MockAction> = {
  GET: "VIEW",
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

const failure = (status: number, issues: Issue[]) =>
  json({ status, error: issues[0].message, issues }, status);

const serverError = () =>
  json({ status: 500, error: "Internal Server Error" }, 500);

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const idOf = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;

const isCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const view = (row: StockItemRow) => ({
  ...stockItemView(row),
  description: row.description ?? "",
});

const findRow = (code: string) =>
  STOCK_ITEM.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const isNameTaken = (name: string, exceptId?: number) =>
  STOCK_ITEM.some(
    (row) =>
      isLive(row) &&
      row.id !== exceptId &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

const parse = (body: Body): { issues: Issue[] } | { value: Input } => {
  const issues: Issue[] = [];
  const name = normalize(body.name);
  const description = normalize(body.description);
  const required: [string, string][] = [
    ["typeId", "Mohon Lengkapi Tipe Barang"],
    ["bapelId", "Mohon Lengkapi Badan Pelayanan"],
    ["roomId", "Mohon Lengkapi Ruang"],
    ["unitId", "Mohon Lengkapi Satuan"],
  ];

  if (!name)
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Barang" });
  if (name.length > 150) {
    issues.push({
      path: "name",
      message: "Nama Barang tidak boleh lebih dari 150 karakter",
    });
  }
  if (description.length > 250) {
    issues.push({
      path: "description",
      message: "Keterangan tidak boleh lebih dari 250 karakter",
    });
  }
  for (const [path, message] of required) {
    if (idOf(body[path]) === null) issues.push({ path, message });
  }
  if (body.reorderPoint != null && !isCount(body.reorderPoint)) {
    issues.push({
      path: "reorderPoint",
      message: "Titik Pemesanan Ulang harus bilangan bulat 0 atau lebih",
    });
  }
  if (body.openingQuantity != null && !isCount(body.openingQuantity)) {
    issues.push({
      path: "openingQuantity",
      message: "Stok Awal harus bilangan bulat 0 atau lebih",
    });
  }
  if (issues.length) return { issues };

  return {
    value: {
      name,
      description,
      typeId: body.typeId as number,
      bapelId: body.bapelId as number,
      roomId: body.roomId as number,
      unitId: body.unitId as number,
      reorderPoint: (body.reorderPoint as number | null | undefined) ?? null,
      openingQuantity: (body.openingQuantity as number | undefined) ?? 0,
    },
  };
};

const relationIssues = (input: Input): Issue[] =>
  [
    !TYPE_ITEM.some((row) => isLive(row) && row.id === input.typeId) && {
      path: "typeId",
      message: "Tipe Barang Tidak Ditemukan",
    },
    !bapelOf(input.bapelId) && {
      path: "bapelId",
      message: "Badan Pelayanan Tidak Ditemukan",
    },
    !UNIT.some((row) => isLive(row) && row.id === input.unitId) && {
      path: "unitId",
      message: "Satuan Tidak Ditemukan",
    },
    !ROOM.some((row) => isLive(row) && row.id === input.roomId) && {
      path: "roomId",
      message: "Ruang Tidak Ditemukan",
    },
  ].filter((issue): issue is Issue => Boolean(issue));

const isRoomInactive = (roomId: number) =>
  ROOM.find((row) => row.id === roomId)?.isActive === false;

const listRows = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const exact = (key: string) => Number(params.get(key)) || null;
  const typeId = exact("typeId");
  const bapelId = exact("bapelId");
  const roomId = exact("roomId");
  const unitId = exact("unitId");
  const isLow = params.get("menipis") === "ya";

  return STOCK_ITEM.filter(
    (row) =>
      isLive(row) &&
      (!filter ||
        row.name.toLowerCase().includes(filter) ||
        row.code.toLowerCase().includes(filter)) &&
      (typeId === null || row.typeId === typeId) &&
      (bapelId === null || row.bapelId === bapelId) &&
      (roomId === null || row.roomId === roomId) &&
      (unitId === null || row.unitId === unitId) &&
      (!isLow ||
        (row.reorderPoint !== null && row.quantity <= row.reorderPoint)),
  )
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map(view);
};

const create = (body: Body) => {
  const parsed = parse(body);
  if ("issues" in parsed) return failure(400, parsed.issues);

  const input = parsed.value;
  if (isNameTaken(input.name)) {
    return failure(409, [
      { path: "name", message: "Barang Persediaan Sudah Tersedia" },
    ]);
  }

  const missing = relationIssues(input);
  if (missing.length) return failure(404, missing);
  if (isRoomInactive(input.roomId)) {
    return failure(400, [{ path: "roomId", message: "Ruang Tidak Aktif" }]);
  }

  const id = nextId(STOCK_ITEM);
  const row: StockItemRow = {
    id,
    publicId: crypto.randomUUID(),
    code: codeOf("BRP"),
    name: input.name,
    description: input.description,
    quantity: 0,
    reorderPoint: input.reorderPoint,
    lastUnitPrice: null,
    // Barang baru belum punya harga sama sekali. Mutasi masuk pertamanya yang
    // menetapkan harga rata-ratanya, lewat helper yang sama.
    avgUnitPrice: null,
    typeId: input.typeId,
    bapelId: input.bapelId,
    roomId: input.roomId,
    unitId: input.unitId,
    deletedAt: null,
  };
  STOCK_ITEM.push(row);

  if (input.openingQuantity > 0) {
    applyMovement(id, {
      type: "IN",
      source: "OPENING_BALANCE",
      quantity: input.openingQuantity,
      movementDate: TODAY,
      note: "Stok awal",
    });
  }

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Barang Persediaan",
      data: view(row),
    },
    201,
  );
};

const update = (code: string, body: Body) => {
  const parsed = parse(body);
  if ("issues" in parsed) return failure(400, parsed.issues);

  const row = findRow(code);
  if (!row) return json({ status: 404, error: NOT_FOUND }, 404);

  const input = parsed.value;
  const isRenamed = input.name.toLowerCase() !== row.name.toLowerCase();
  if (isRenamed && isNameTaken(input.name, row.id)) {
    return failure(409, [
      { path: "name", message: "Barang Persediaan Sudah Tersedia" },
    ]);
  }

  const missing = relationIssues(input);
  if (missing.length) return failure(404, missing);
  if (input.roomId !== row.roomId && isRoomInactive(input.roomId)) {
    return failure(400, [{ path: "roomId", message: "Ruang Tidak Aktif" }]);
  }

  Object.assign(row, {
    name: input.name,
    description: input.description,
    typeId: input.typeId,
    bapelId: input.bapelId,
    roomId: input.roomId,
    unitId: input.unitId,
    reorderPoint: input.reorderPoint,
  });

  return json({
    status: 200,
    message: "Berhasil Mengubah Barang Persediaan",
    data: view(row),
  });
};

const remove = (code: string) => {
  const row = findRow(code);
  if (!row) return json({ status: 404, error: NOT_FOUND }, 404);
  if (row.quantity !== 0) {
    return json(
      {
        status: 400,
        error: `Barang Ini Masih Memiliki Stok ${row.quantity}. Keluarkan Stoknya Terlebih Dahulu`,
      },
      400,
    );
  }

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menghapus Barang Persediaan",
    data: view(row),
  });
};

export const barangPersediaanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  const [, root, code, extra] = path.split("/");
  if (root !== "barang-persediaan" || extra !== undefined) return null;

  const action = ACTION[method];
  const isRouted = code ? method !== "POST" : ["GET", "POST"].includes(method);
  if (!action || !isRouted) return null;
  if (!can(MENU.BARANG_PERSEDIAAN, action)) return denied();

  if (method !== "GET" && process.env.MOCK_STOCK_ITEM_SAVE_ERROR === "500") {
    return serverError();
  }

  if (!code && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    return list(
      listRows(url.searchParams),
      url,
      "Barang Persediaan",
      "Barang Persediaan",
      "Berhasil Mendapatkan Barang Persediaan",
    );
  }

  if (!code) return create(await readBody<Body>(request));
  if (method === "PUT") return update(code, await readBody<Body>(request));
  if (method === "DELETE") return remove(code);

  const row = findRow(code);

  return row
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Barang Persediaan",
        data: view(row),
      })
    : json({ status: 404, error: NOT_FOUND }, 404);
};
