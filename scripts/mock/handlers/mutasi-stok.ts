/**
 * Tiruan `/api/v1/mutasi-stok` (be-sada `modules/mutasi_stok`, bentuk kontrak final
 * inventaris-gaps) dari larik `STOCK_MOVEMENT`; tulis hanya lewat `applyMovement`.
 *
 *   MOCK_EMPTY=1                          → daftar kosong (404)
 *   MOCK_500=1                            → daftar menjawab 500
 *   MOCK_STOCK_MOVEMENT_500=1             → daftar dan riwayat per barang menjawab 500
 *   MOCK_STOCK_MOVEMENT_SAVE_ERROR=500    → POST menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  STOCK_ITEM,
  STOCK_MOVEMENT,
  TODAY,
  applyMovement,
  movementView,
  type MovementSource,
  type MovementType,
} from "../inventaris-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Issue = { path: string; message: string };

type Body = Partial<Record<string, unknown>>;

const PAIRS: Record<MovementType, MovementSource[]> = {
  IN: ["DONATION", "MANUAL"],
  OUT: ["USAGE", "DISPOSAL", "MANUAL"],
  ADJUSTMENT: ["MANUAL"],
};

const PROCESS_SOURCES: MovementSource[] = [
  "OPENING_BALANCE",
  "GOODS_RECEIPT",
  "STOCK_OPNAME",
];

const SOURCES: MovementSource[] = [
  "OPENING_BALANCE",
  "GOODS_RECEIPT",
  "DONATION",
  "USAGE",
  "TRANSFER",
  "DISPOSAL",
  "STOCK_OPNAME",
  "PURCHASE_RETURN",
  "MANUAL",
];

const serverError = () =>
  json({ status: 500, error: "Internal Server Error" }, 500);

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const isType = (value: unknown): value is MovementType =>
  typeof value === "string" && value in PAIRS;

const isSource = (value: unknown): value is MovementSource =>
  SOURCES.includes(value as MovementSource);

const listRows = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const stockItemId = Number(params.get("stockItemId")) || null;
  const type = params.get("type") ?? "";
  const source = params.get("source") ?? "";
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const matchesItem = (id: number) => {
    const item = STOCK_ITEM.find((row) => row.id === id);

    return (
      !filter ||
      Boolean(
        item &&
        (item.name.toLowerCase().includes(filter) ||
          item.code.toLowerCase().includes(filter)),
      )
    );
  };

  return STOCK_MOVEMENT.filter(
    (row) =>
      (stockItemId === null || row.stockItemId === stockItemId) &&
      (!type || row.type === type) &&
      (!source || row.source === source) &&
      (!startDate || row.movementDate >= startDate) &&
      (!endDate || row.movementDate <= endDate) &&
      matchesItem(row.stockItemId),
  )
    .sort((a, b) => b.movementDate.localeCompare(a.movementDate) || b.id - a.id)
    .map(movementView);
};

const parseIssues = (body: Body): Issue[] => {
  const issues: Issue[] = [];
  const { stockItemId, type, source, quantity, movementDate, note, value } =
    body;

  if (typeof stockItemId !== "number" || stockItemId <= 0) {
    issues.push({
      path: "stockItemId",
      message: "Mohon Lengkapi Barang Persediaan",
    });
  }
  if (!isType(type)) {
    issues.push({ path: "type", message: "Mohon Lengkapi Jenis Mutasi" });
  }
  if (!isSource(source)) {
    issues.push({ path: "source", message: "Mohon Lengkapi Sumber Mutasi" });
  }
  if (typeof quantity !== "number") {
    issues.push({ path: "quantity", message: "Mohon Lengkapi Jumlah" });
  } else if (!Number.isInteger(quantity)) {
    issues.push({ path: "quantity", message: "Jumlah harus bilangan bulat" });
  } else if (quantity === 0) {
    issues.push({ path: "quantity", message: "Jumlah tidak boleh 0" });
  } else if (type !== "ADJUSTMENT" && quantity < 0) {
    issues.push({
      path: "quantity",
      message: "Jumlah harus lebih dari 0 untuk mutasi masuk atau keluar",
    });
  }
  if (
    typeof movementDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(movementDate)
  ) {
    issues.push({
      path: "movementDate",
      message: "Mohon Lengkapi Tanggal Mutasi",
    });
  } else if (movementDate > TODAY) {
    issues.push({
      path: "movementDate",
      message: "Tanggal Mutasi Tidak Boleh Di Masa Depan",
    });
  }
  if (typeof note === "string" && note.length > 250) {
    issues.push({
      path: "note",
      message: "Catatan tidak boleh lebih dari 250 karakter",
    });
  }
  if (
    isType(type) &&
    isSource(source) &&
    !PROCESS_SOURCES.includes(source) &&
    !PAIRS[type].includes(source)
  ) {
    issues.push({
      path: "source",
      message: "Sumber Tidak Sesuai Dengan Jenis Mutasi",
    });
  }

  // Tiga aturan nilai, sama seperti server. Mock yang lebih longgar di sini
  // membuat setiap layar dibangun melawan aturan yang tidak ada.
  if (value !== undefined && value !== null) {
    if (typeof value !== "number" || value <= 0) {
      issues.push({ path: "value", message: "Nilai harus lebih dari 0" });
    } else if (Math.round(value * 100) !== value * 100) {
      issues.push({
        path: "value",
        message: "Nilai maksimal 2 angka di belakang koma",
      });
    } else if (
      isType(type) &&
      type !== "IN" &&
      !PROCESS_SOURCES.includes(source as MovementSource)
    ) {
      issues.push({
        path: "value",
        message:
          "Nilai Hanya Diisi Untuk Mutasi Masuk. Mutasi Keluar Memakai Harga Rata-Rata",
      });
    }
  } else if (source === "DONATION") {
    issues.push({
      path: "value",
      message: "Mohon Lengkapi Nilai Barang Sumbangan",
    });
  }

  return issues;
};

const create = (body: Body) => {
  const issues = parseIssues(body);
  if (issues.length) return invalid(issues);

  const source = body.source as MovementSource;
  if (PROCESS_SOURCES.includes(source)) {
    return json(
      {
        status: 400,
        error:
          "Sumber Mutasi Ini Ditulis Oleh Proses Lain: Stok Awal, Penerimaan Barang, Atau Stok Opname",
      },
      400,
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  const result = applyMovement(body.stockItemId as number, {
    type: body.type as MovementType,
    source,
    quantity: body.quantity as number,
    movementDate: body.movementDate as string,
    note: note || null,
    value: typeof body.value === "number" ? body.value : null,
  });

  if ("failure" in result) {
    const { status, message, path } = result.failure;

    return json(
      {
        status,
        error: message,
        issues: path ? [{ path, message }] : [],
      },
      status,
    );
  }

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Mutasi Stok",
      data: movementView(result.movement),
    },
    201,
  );
};

export const mutasiStokMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/mutasi-stok") return null;

  if (method === "GET") {
    if (!can(MENU.MUTASI_STOK, "VIEW")) return denied();
    if (process.env.MOCK_500 || process.env.MOCK_STOCK_MOVEMENT_500) {
      return serverError();
    }

    return list(
      listRows(url.searchParams),
      url,
      "Mutasi Stok",
      "Mutasi Stok",
      "Berhasil Mendapatkan Mutasi Stok",
    );
  }

  if (method !== "POST") return null;
  if (!can(MENU.MUTASI_STOK, "CREATE")) return denied();
  if (process.env.MOCK_STOCK_MOVEMENT_SAVE_ERROR === "500")
    return serverError();

  return create(await readBody<Body>(request));
};
