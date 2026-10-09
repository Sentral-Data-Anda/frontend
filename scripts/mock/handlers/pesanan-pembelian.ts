/**
 * Tiruan `/api/v1/pesanan-pembelian` (be-sada `pengadaan-gaps`, kontrak Pengadaan §Pesanan Pembelian).
 * Mengubah hanya `PURCHASE_ORDER`; kurs lewat `rateOn` dari store.
 *
 *   MOCK_EMPTY=1              → daftar kosong (404)
 *   MOCK_500=1                → daftar menjawab 500
 *   MOCK_PO_SAVE_ERROR=500    → POST/PUT menjawab 500
 *   MOCK_PO_ACTION_500=1      → /batal, /tutup, DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { roomOf } from "../fasilitas-store";
import { typeItemOf, unitOf } from "../inventaris-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockContext,
  type MockHandler,
} from "../kit";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
  SUPPLIER,
  TODAY,
  codeOf,
  currencyOf,
  isLive,
  noRateMessage,
  orderItem,
  purchaseOrderView,
  purchaseRequestOf,
  rateOn,
  type OrderItem,
  type PurchaseOrderRow,
} from "../pengadaan-store";

type Issue = { path: string; message: string };

type Line = Omit<OrderItem, "id" | "publicId">;

type Parsed = {
  purchaseRequestId: number;
  supplierId: number;
  currencyCode: string;
  orderDate: string;
  items: Line[];
};

const NOT_FOUND = "Pesanan Pembelian Tidak Ditemukan";

const failure = (status: number, error: string, issues?: Issue[]) =>
  json(issues ? { status, error, issues } : { status, error }, status);

const invalid = (issues: Issue[], status = 400) =>
  failure(status, issues[0].message, issues);

const fieldFailure = (status: number, path: string, message: string) =>
  invalid([{ path, message }], status);

const ok = (message: string, row: PurchaseOrderRow, status = 200) =>
  json({ status, message, data: purchaseOrderView(row, true) }, status);

const findRow = (code: string) => {
  const lower = decodeURIComponent(code).toLowerCase();

  return PURCHASE_ORDER.find(
    (row) => isLive(row) && row.code.toLowerCase() === lower,
  );
};

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const hasReceipt = (row: PurchaseOrderRow) =>
  GOODS_RECEIPT.some((receipt) => receipt.purchaseOrderId === row.id);

const idOf = (
  issues: Issue[],
  value: unknown,
  path: string,
  label: string,
  requiredMessage = `Mohon Lengkapi ${label}`,
) => {
  if (isBlank(value)) issues.push({ path, message: requiredMessage });
  else if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    issues.push({ path, message: `${label} tidak valid` });
  }

  return Number(value);
};

const parseLine = (
  raw: Record<string, unknown>,
  index: number,
  issues: Issue[],
) => {
  const at = (field: string) => `items.${index}.${field}`;
  const name = isBlank(raw.name) ? "" : String(raw.name).trim();
  const description = isBlank(raw.description)
    ? ""
    : String(raw.description).trim();
  const quantity = Number(raw.quantity);
  const unitPrice = Number(raw.unitPrice);

  if (!name)
    issues.push({ path: at("name"), message: "Mohon Lengkapi Nama Barang" });
  else if (name.length > 150) {
    issues.push({
      path: at("name"),
      message: "Nama Barang tidak boleh lebih dari 150 karakter",
    });
  }
  if (!description) {
    issues.push({
      path: at("description"),
      message: "Mohon Lengkapi Keterangan",
    });
  } else if (description.length > 250) {
    issues.push({
      path: at("description"),
      message: "Keterangan tidak boleh lebih dari 250 karakter",
    });
  }
  if (isBlank(raw.quantity)) {
    issues.push({ path: at("quantity"), message: "Mohon Lengkapi Jumlah" });
  } else if (!Number.isInteger(quantity)) {
    issues.push({
      path: at("quantity"),
      message: "Jumlah harus bilangan bulat",
    });
  } else if (quantity <= 0) {
    issues.push({ path: at("quantity"), message: "Jumlah harus lebih dari 0" });
  }
  if (isBlank(raw.unitPrice)) {
    issues.push({
      path: at("unitPrice"),
      message: "Mohon Lengkapi Harga Satuan",
    });
  } else if (!(unitPrice > 0)) {
    issues.push({
      path: at("unitPrice"),
      message: "Harga Satuan harus lebih dari 0",
    });
  }

  return {
    name,
    description,
    quantity,
    unitPrice: Math.round(unitPrice * 10_000) / 10_000,
    typeId: idOf(issues, raw.typeId, at("typeId"), "Tipe Barang"),
    roomId: idOf(issues, raw.roomId, at("roomId"), "Ruang"),
    unitId: idOf(issues, raw.unitId, at("unitId"), "Satuan"),
  };
};

const parse = (body: Record<string, unknown>): Parsed | Issue[] => {
  const issues: Issue[] = [];
  const purchaseRequestId = idOf(
    issues,
    body.purchaseRequestId,
    "purchaseRequestId",
    "Permintaan Pembelian",
  );
  const supplierId = idOf(issues, body.supplierId, "supplierId", "Supplier");
  const currencyCode = isBlank(body.currencyCode)
    ? ""
    : String(body.currencyCode).toUpperCase();
  const orderDate = isBlank(body.orderDate) ? "" : String(body.orderDate);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!currencyCode) {
    issues.push({ path: "currencyCode", message: "Mohon Lengkapi Mata Uang" });
  } else if (!/^[A-Z]{3}$/.test(currencyCode)) {
    issues.push({
      path: "currencyCode",
      message: "Kode Mata Uang harus 3 huruf",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}/.test(orderDate)) {
    issues.push({
      path: "orderDate",
      message: "Mohon Lengkapi Tanggal Pesanan",
    });
  } else if (orderDate.slice(0, 10) > TODAY) {
    issues.push({
      path: "orderDate",
      message: "Tanggal Pesanan Tidak Boleh Di Masa Depan",
    });
  }
  if (rawItems.length === 0) {
    issues.push({
      path: "items",
      message: "Pesanan Pembelian harus memiliki minimal 1 barang",
    });
  }

  const items = rawItems.map((raw: Record<string, unknown>, index) =>
    parseLine(raw, index, issues),
  );

  if (issues.length > 0) return issues;

  return {
    purchaseRequestId,
    supplierId,
    currencyCode,
    orderDate: orderDate.slice(0, 10),
    items,
  };
};

const lockFailure = (row: PurchaseOrderRow) => {
  if (row.status !== "ISSUED") {
    return failure(400, "Hanya Pesanan Berstatus Dipesan Yang Dapat Diubah");
  }

  return hasReceipt(row)
    ? failure(400, "Pesanan Ini Sudah Ada Penerimaan Barang")
    : null;
};

const relationFailure = (
  parsed: Parsed,
  current: PurchaseOrderRow | null,
): Response | null => {
  const request = purchaseRequestOf(parsed.purchaseRequestId);
  if (!request) {
    return fieldFailure(
      404,
      "purchaseRequestId",
      "Permintaan Pembelian Tidak Ditemukan",
    );
  }
  if (request.status !== "APPROVED") {
    return fieldFailure(
      400,
      "purchaseRequestId",
      "Permintaan Pembelian Ini Belum Disetujui",
    );
  }

  const supplier = SUPPLIER.find(
    (row) => row.id === parsed.supplierId && isLive(row),
  );
  if (!supplier) {
    return fieldFailure(404, "supplierId", "Supplier Tidak Ditemukan");
  }
  if (!supplier.isActive && current?.supplierId !== supplier.id) {
    return fieldFailure(400, "supplierId", "Supplier Tidak Aktif");
  }

  for (const [index, line] of parsed.items.entries()) {
    const at = (field: string) => `items.${index}.${field}`;
    const room = roomOf(line.roomId);

    if (!typeItemOf(line.typeId)) {
      return fieldFailure(404, at("typeId"), "Tipe Barang Tidak Ditemukan");
    }
    if (!room) return fieldFailure(404, at("roomId"), "Ruang Tidak Ditemukan");
    if (!room.isActive) {
      return fieldFailure(400, at("roomId"), "Ruang Tidak Aktif");
    }
    if (!unitOf(line.unitId)) {
      return fieldFailure(404, at("unitId"), "Satuan Tidak Ditemukan");
    }
  }

  if (!currencyOf(parsed.currencyCode)) {
    return fieldFailure(404, "currencyCode", "Mata Uang Tidak Ditemukan");
  }

  return rateOn(parsed.currencyCode, parsed.orderDate)
    ? null
    : fieldFailure(400, "currencyCode", noRateMessage(parsed.currencyCode));
};

const write = (row: PurchaseOrderRow, parsed: Parsed) => {
  const rate = rateOn(parsed.currencyCode, parsed.orderDate);

  Object.assign(row, {
    supplierId: parsed.supplierId,
    purchaseRequestId: parsed.purchaseRequestId,
    currencyCode: parsed.currencyCode,
    orderDate: parsed.orderDate,
    exchangeRate: rate?.rate ?? 1,
    rateSource: rate?.source ?? "MANUAL",
    rateDate: rate?.rateDate ?? parsed.orderDate,
    items: parsed.items.map(orderItem),
  });
};

const onSave = async (ctx: MockContext, code: string | null) => {
  if (process.env.MOCK_PO_SAVE_ERROR === "500") {
    return failure(500, "Internal Server Error");
  }

  const parsed = parse(await readBody<Record<string, unknown>>(ctx.request));
  if (Array.isArray(parsed)) return invalid(parsed);

  if (code === null) {
    const rejected = relationFailure(parsed, null);
    if (rejected) return rejected;

    const id = PURCHASE_ORDER.length + 1;
    const row: PurchaseOrderRow = {
      id,
      publicId: `00000000-0000-4000-e700-${String(id).padStart(12, "0")}`,
      code: codeOf("PO", { yearly: true }),
      status: "ISSUED",
      deletedAt: null,
      createdAt: new Date().toISOString(),
      supplierId: 0,
      purchaseRequestId: 0,
      currencyCode: "IDR",
      exchangeRate: 1,
      rateSource: "MANUAL",
      rateDate: parsed.orderDate,
      orderDate: parsed.orderDate,
      items: [],
    };
    write(row, parsed);
    PURCHASE_ORDER.push(row);

    return ok("Berhasil Menambahkan Pesanan Pembelian", row, 201);
  }

  const row = findRow(code);
  if (!row) return failure(404, NOT_FOUND);

  const rejected = lockFailure(row) ?? relationFailure(parsed, row);
  if (rejected) return rejected;

  write(row, parsed);

  return ok("Berhasil Mengubah Pesanan Pembelian", row);
};

const onCancel = (row: PurchaseOrderRow) => {
  const rejected = lockFailure(row);
  if (rejected) return rejected;

  row.status = "CANCELLED";

  return ok("Berhasil Membatalkan Pesanan Pembelian", row);
};

const onClose = (row: PurchaseOrderRow) => {
  if (row.status !== "PARTIALLY_RECEIVED") {
    return failure(400, "Hanya Pesanan Diterima Sebagian Yang Dapat Ditutup");
  }

  row.status = "RECEIVED";

  return ok("Berhasil Menutup Pesanan Pembelian", row);
};

const onDelete = (row: PurchaseOrderRow) => {
  const rejected = lockFailure(row);
  if (rejected) return rejected;

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menghapus Pesanan Pembelian",
    data: { publicId: row.publicId, code: row.code },
  });
};

const ACTIONS = {
  batal: { guard: "DELETE", run: onCancel },
  tutup: { guard: "UPDATE", run: onClose },
} as const satisfies Record<
  string,
  { guard: MockAction; run: (row: PurchaseOrderRow) => Response }
>;

const listRows = (url: URL) => {
  const params = url.searchParams;
  const supplierId = Number(params.get("supplierId")) || null;
  const requestId = Number(params.get("purchaseRequestId")) || null;
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const filter = (params.get("filter") ?? "").toLowerCase();
  const supplierName = (id: number) =>
    SUPPLIER.find((row) => row.id === id)?.name.toLowerCase() ?? "";

  return PURCHASE_ORDER.filter(isLive)
    .filter((row) => supplierId === null || row.supplierId === supplierId)
    .filter((row) => requestId === null || row.purchaseRequestId === requestId)
    .filter((row) => !status || row.status === status)
    .filter((row) => !startDate || row.orderDate >= startDate)
    .filter((row) => !endDate || row.orderDate <= endDate)
    .filter(
      (row) =>
        !filter ||
        row.code.toLowerCase().includes(filter) ||
        supplierName(row.supplierId).includes(filter),
    )
    .sort(
      (a, b) =>
        b.orderDate.localeCompare(a.orderDate) ||
        b.createdAt.localeCompare(a.createdAt) ||
        b.id - a.id,
    )
    .map((row) => purchaseOrderView(row));
};

export const pesananPembelianMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/pesanan-pembelian(?:\/([^/]+))?(?:\/(batal|tutup))?$/,
  );
  if (!match) return null;

  const [, code, actionName] = match;
  const can = (action: MockAction) => ctx.can(MENU.PURCHASE_ORDER, action);

  if (actionName) {
    const action = ACTIONS[actionName as keyof typeof ACTIONS];

    if (ctx.method !== "PUT") return null;
    if (!can(action.guard)) return denied();
    if (process.env.MOCK_PO_ACTION_500) {
      return failure(500, "Internal Server Error");
    }

    const row = findRow(code);

    return row ? action.run(row) : failure(404, NOT_FOUND);
  }

  if (ctx.method === "GET") {
    if (!code) {
      if (!can("VIEW")) return denied();
      if (process.env.MOCK_500) return failure(500, "Internal Server Error");

      return list(
        listRows(ctx.url),
        ctx.url,
        "Pesanan Pembelian",
        "Pesanan Pembelian",
        "Berhasil Mendapatkan Pesanan Pembelian",
      );
    }

    if (!can("VIEW") && !ctx.can(MENU.GOODS_RECEIPT, "VIEW")) {
      return denied();
    }

    const row = findRow(code);

    return row
      ? ok("Berhasil Mendapatkan Pesanan Pembelian", row)
      : failure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !code) {
    return can("CREATE") ? onSave(ctx, null) : denied();
  }
  if (ctx.method === "PUT" && code) {
    return can("UPDATE") ? onSave(ctx, code) : denied();
  }
  if (ctx.method === "DELETE" && code) {
    if (!can("DELETE")) return denied();
    if (process.env.MOCK_PO_ACTION_500) {
      return failure(500, "Internal Server Error");
    }

    const row = findRow(code);

    return row ? onDelete(row) : failure(404, NOT_FOUND);
  }

  return null;
};
