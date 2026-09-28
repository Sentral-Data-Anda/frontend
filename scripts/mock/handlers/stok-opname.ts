/**
 * Tiruan `/api/v1/stok-opname` (be-sada `inventaris-gaps`, kontrak Inventaris §Stok Opname).
 * Mengubah hanya `OPNAME`; posting menulis stok lewat `applyMovement`.
 *
 *   MOCK_EMPTY=1                  → daftar kosong (404)
 *   MOCK_500=1                    → daftar menjawab 500
 *   MOCK_OPNAME_SAVE_ERROR=500    → POST/PUT menjawab 500
 *   MOCK_OPNAME_ACTION_500=1      → /selesai, /posting, /batal menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  OPNAME,
  STOCK_ITEM,
  STOCK_MOVEMENT,
  TODAY,
  applyMovement,
  codeOf,
  isLive,
  opnameView,
  roomRowOf,
  stockItemOf,
  type OpnameItem,
  type OpnameRow,
} from "../inventaris-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockContext,
  type MockHandler,
} from "../kit";

type Issue = { path: string; message: string };

type Line = {
  stockItemId: number;
  physicalQuantity: number;
  note: string | null;
};

type Parsed = {
  opnameDate: string;
  roomId: number | null;
  note: string | null;
  items: Line[];
};

const NOT_FOUND = "Stok Opname Tidak Ditemukan";
const NOTE_TOO_LONG = "Catatan tidak boleh lebih dari 250 karakter";

const failure = (status: number, error: string, issues?: Issue[]) =>
  json(issues ? { status, error, issues } : { status, error }, status);

const invalid = (issues: Issue[], status = 400) =>
  failure(status, issues[0].message, issues);

const ok = (message: string, row: OpnameRow, status = 200) =>
  json({ status, message, data: opnameView(row, true) }, status);

const findRow = (code: string) => {
  const lower = decodeURIComponent(code).toLowerCase();

  return OPNAME.find((row) => row.code.toLowerCase() === lower);
};

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const textOf = (value: unknown) =>
  isBlank(value) ? null : String(value).trim() || null;

const parse = (body: Record<string, unknown>): Parsed | Issue[] => {
  const issues: Issue[] = [];
  const opnameDate = isBlank(body.opnameDate) ? "" : String(body.opnameDate);
  const note = textOf(body.note);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!/^\d{4}-\d{2}-\d{2}/.test(opnameDate)) {
    issues.push({
      path: "opnameDate",
      message: "Mohon Lengkapi Tanggal Opname",
    });
  } else if (opnameDate.slice(0, 10) > TODAY) {
    issues.push({
      path: "opnameDate",
      message: "Tanggal Opname Tidak Boleh Di Masa Depan",
    });
  }
  if (note && note.length > 250) {
    issues.push({ path: "note", message: NOTE_TOO_LONG });
  }
  if (rawItems.length === 0) {
    issues.push({
      path: "items",
      message: "Stok Opname harus memiliki minimal 1 barang",
    });
  }

  const items = rawItems.map((raw: Record<string, unknown>, index) => {
    const stockItemId = Number(raw.stockItemId);
    const physical = raw.physicalQuantity;
    const lineNote = textOf(raw.note);

    if (isBlank(raw.stockItemId)) {
      issues.push({
        path: `items.${index}.stockItemId`,
        message: "Mohon Lengkapi Barang Persediaan",
      });
    }
    if (isBlank(physical) || Number.isNaN(Number(physical))) {
      issues.push({
        path: `items.${index}.physicalQuantity`,
        message: "Mohon Lengkapi Jumlah Fisik",
      });
    } else if (!Number.isInteger(Number(physical))) {
      issues.push({
        path: `items.${index}.physicalQuantity`,
        message: "Jumlah Fisik harus bilangan bulat",
      });
    } else if (Number(physical) < 0) {
      issues.push({
        path: `items.${index}.physicalQuantity`,
        message: "Jumlah Fisik tidak boleh negatif",
      });
    }
    if (lineNote && lineNote.length > 250) {
      issues.push({ path: `items.${index}.note`, message: NOTE_TOO_LONG });
    }

    return {
      stockItemId,
      physicalQuantity: Number(physical),
      note: lineNote,
    };
  });

  if (issues.length > 0) return issues;

  return {
    opnameDate: opnameDate.slice(0, 10),
    roomId: isBlank(body.roomId) ? null : Number(body.roomId),
    note,
    items,
  };
};

const lineFailure = (parsed: Parsed): Response | null => {
  if (parsed.roomId !== null) {
    const room = roomRowOf(parsed.roomId);

    if (!room || !isLive(room)) {
      return invalid(
        [{ path: "roomId", message: "Ruang Tidak Ditemukan" }],
        404,
      );
    }
  }

  const firstRowOf = new Map<number, number>();
  const duplicates = parsed.items.flatMap((line, index) => {
    const first = firstRowOf.get(line.stockItemId);

    if (first === undefined) {
      firstRowOf.set(line.stockItemId, index);
      return [];
    }

    return [
      {
        path: `items.${index}.stockItemId`,
        message: `Barang Sudah Ada Di Baris ${first + 1}`,
      },
    ];
  });
  if (duplicates.length > 0) return invalid(duplicates);

  const missing = parsed.items.flatMap((line, index) =>
    stockItemOf(line.stockItemId)
      ? []
      : [
          {
            path: `items.${index}.stockItemId`,
            message: "Barang Persediaan Tidak Ditemukan",
          },
        ],
  );
  if (missing.length > 0) return invalid(missing, 404);

  if (parsed.roomId !== null) {
    const elsewhere = parsed.items.flatMap((line, index) =>
      stockItemOf(line.stockItemId)?.roomId === parsed.roomId
        ? []
        : [
            {
              path: `items.${index}.stockItemId`,
              message: "Barang Tidak Berada Di Ruang Ini",
            },
          ],
    );
    if (elsewhere.length > 0) return invalid(elsewhere);
  }

  return null;
};

const toItems = (lines: Line[], seed: number): OpnameItem[] =>
  lines.map((line, index) => {
    const systemQuantity = stockItemOf(line.stockItemId)?.quantity ?? 0;

    return {
      publicId: `00000000-0000-4000-de00-${String(seed * 1000 + index).padStart(12, "0")}`,
      stockItemId: line.stockItemId,
      systemQuantity,
      physicalQuantity: line.physicalQuantity,
      difference: line.physicalQuantity - systemQuantity,
      note: line.note,
    };
  });

const listRows = (url: URL) => {
  const params = url.searchParams;
  const roomId = Number(params.get("roomId")) || null;
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const filter = (params.get("filter") ?? "").toLowerCase();

  return OPNAME.filter((row) => roomId === null || row.roomId === roomId)
    .filter((row) => !status || row.status === status)
    .filter((row) => !startDate || row.opnameDate >= startDate)
    .filter((row) => !endDate || row.opnameDate <= endDate)
    .filter((row) => !filter || row.code.toLowerCase().includes(filter))
    .sort((a, b) => b.opnameDate.localeCompare(a.opnameDate) || b.id - a.id)
    .map((row) => opnameView(row));
};

const nameOf = (stockItemId: number) =>
  STOCK_ITEM.find((row) => row.id === stockItemId)?.name ?? "Barang";

const postFailure = (row: OpnameRow): Response | null => {
  const different = row.items.filter((item) => item.difference !== 0);

  for (const item of different) {
    const isMovedAfter = STOCK_MOVEMENT.some(
      (movement) =>
        movement.stockItemId === item.stockItemId &&
        movement.movementDate > row.opnameDate,
    );

    if (isMovedAfter) {
      return failure(
        409,
        `Ada Mutasi ${nameOf(item.stockItemId)} Sesudah Tanggal Opname. Ulangi Stok Opname`,
      );
    }
  }

  for (const item of different) {
    const current = stockItemOf(item.stockItemId)?.quantity ?? 0;

    if (current !== item.systemQuantity) {
      return failure(
        409,
        `Stok ${nameOf(item.stockItemId)} Sudah Berubah Sejak Dihitung (${item.systemQuantity} Menjadi ${current}). Ulangi Stok Opname`,
      );
    }
  }

  return null;
};

const onSave = async (ctx: MockContext, code: string | null) => {
  if (process.env.MOCK_OPNAME_SAVE_ERROR === "500") {
    return failure(500, "Internal Server Error");
  }

  const parsed = parse(await readBody<Record<string, unknown>>(ctx.request));
  if (Array.isArray(parsed)) return invalid(parsed);

  if (code === null) {
    const rejected = lineFailure(parsed);
    if (rejected) return rejected;

    const id = OPNAME.length + 1;
    const row: OpnameRow = {
      id,
      publicId: `00000000-0000-4000-dd00-${String(id).padStart(12, "0")}`,
      code: codeOf("OPN", { yearly: true }),
      opnameDate: parsed.opnameDate,
      status: "DRAFT",
      roomId: parsed.roomId,
      note: parsed.note,
      completedById: null,
      completedAt: null,
      postedById: null,
      postedAt: null,
      items: toItems(parsed.items, id),
    };
    OPNAME.push(row);

    return ok("Berhasil Menambahkan Stok Opname", row, 201);
  }

  const row = findRow(code);
  if (!row) return failure(404, NOT_FOUND);
  if (row.status !== "DRAFT") {
    return failure(400, "Hanya Stok Opname Berstatus Draft Yang Dapat Diubah");
  }

  const rejected = lineFailure(parsed);
  if (rejected) return rejected;

  Object.assign(row, {
    opnameDate: parsed.opnameDate,
    roomId: parsed.roomId,
    note: parsed.note,
    items: toItems(parsed.items, row.id),
  });

  return ok("Berhasil Mengubah Stok Opname", row);
};

const onComplete = (row: OpnameRow) => {
  if (row.status !== "DRAFT") {
    return failure(400, "Hanya Stok Opname Berstatus Draft Yang Dapat Diubah");
  }

  const unexplained = row.items.flatMap((item, index) =>
    item.difference !== 0 && !item.note?.trim()
      ? [{ path: `items.${index}.note`, message: "Tulis Alasan Selisih" }]
      : [],
  );
  if (unexplained.length > 0) return invalid(unexplained);

  Object.assign(row, {
    status: "COMPLETED",
    completedById: SESSION_USER_ID,
    completedAt: new Date().toISOString(),
  });

  return ok("Berhasil Menyelesaikan Stok Opname", row);
};

const onPost = (row: OpnameRow) => {
  if (row.status !== "COMPLETED") {
    return failure(
      400,
      "Stok Opname Ini Belum Diselesaikan Atau Sudah Diposting",
    );
  }

  const rejected = postFailure(row);
  if (rejected) return rejected;

  for (const item of row.items.filter((line) => line.difference !== 0)) {
    applyMovement(item.stockItemId, {
      type: "ADJUSTMENT",
      source: "STOCK_OPNAME",
      quantity: item.difference,
      movementDate: row.opnameDate,
      note: `Stok opname ${row.code}`,
    });
  }

  Object.assign(row, {
    status: "POSTED",
    postedById: SESSION_USER_ID,
    postedAt: new Date().toISOString(),
  });

  return ok("Berhasil Memposting Stok Opname", row);
};

const onCancel = (row: OpnameRow) => {
  if (row.status === "POSTED") {
    return failure(
      400,
      "Stok Opname Ini Sudah Diposting Dan Tidak Dapat Dibatalkan",
    );
  }
  if (row.status === "CANCELLED") {
    return failure(400, "Stok Opname Ini Sudah Dibatalkan");
  }

  row.status = "CANCELLED";

  return ok("Berhasil Membatalkan Stok Opname", row);
};

const ACTIONS = {
  selesai: { guard: "UPDATE", run: onComplete },
  posting: { guard: "UPDATE", run: onPost },
  batal: { guard: "DELETE", run: onCancel },
} as const satisfies Record<
  string,
  { guard: MockAction; run: (row: OpnameRow) => Response }
>;

export const stokOpnameMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/stok-opname(?:\/([^/]+))?(?:\/(selesai|posting|batal))?$/,
  );
  if (!match) return null;

  const [, code, actionName] = match;
  const can = (action: MockAction) => ctx.can(MENU.STOK_OPNAME, action);

  if (actionName) {
    const action = ACTIONS[actionName as keyof typeof ACTIONS];

    if (ctx.method !== "PUT") return null;
    if (!can(action.guard)) return denied();
    if (process.env.MOCK_OPNAME_ACTION_500) {
      return failure(500, "Internal Server Error");
    }

    const row = findRow(code);

    return row ? action.run(row) : failure(404, NOT_FOUND);
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();
    if (!code) {
      if (process.env.MOCK_500) return failure(500, "Internal Server Error");

      return list(
        listRows(ctx.url),
        ctx.url,
        "Stok Opname",
        "Stok Opname",
        "Berhasil Mendapatkan Stok Opname",
      );
    }

    const row = findRow(code);

    return row
      ? ok("Berhasil Mendapatkan Stok Opname", row)
      : failure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !code) {
    return can("CREATE") ? onSave(ctx, null) : denied();
  }
  if (ctx.method === "PUT" && code) {
    return can("UPDATE") ? onSave(ctx, code) : denied();
  }

  return null;
};
