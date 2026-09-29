/**
 * Tiruan `/api/v1/penerimaan-barang` (be-sada `pengadaan-gaps`, kontrak Pengadaan §Penerimaan Barang).
 * `GOODS_RECEIPT` hanya ditulis lewat `receiveGoods` (barang ke ASSET, stok lewat `applyMovement`).
 *
 *   MOCK_EMPTY=1              → daftar kosong (404)
 *   MOCK_500=1                → daftar menjawab 500
 *   MOCK_GR_SAVE_ERROR=500    → POST menjawab 500
 *   MOCK_RECEIPT_RACE=1       → POST ditolak melebihi pesanan (dibaca `receiveGoods`)
 *   MOCK_MEDIA_EXPIRED=1      → lampiran 403 (dibaca `serveMedia`)
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
  SUPPLIER,
  TODAY,
  goodsReceiptByCode,
  goodsReceiptView,
  receiveGoods,
  type ReceiveLine,
} from "../pengadaan-store";

type Issue = { path: string; message: string };

const MAX_ATTACHMENTS = 3;

const MAX_LINES = 50;

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const textOf = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const readItems = (raw: string): unknown[] | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const TARGETS = ["ASSET", "STOCK"];

const parseLine = (
  raw: Record<string, unknown>,
  index: number,
  issues: Issue[],
): ReceiveLine => {
  const path = (field: string) => `items.${index}.${field}`;
  const quantity = Number(raw.quantityReceived);

  if (isBlank(raw.purchaseOrderItemId)) {
    issues.push({
      path: path("purchaseOrderItemId"),
      message: "Mohon Lengkapi Baris Pesanan",
    });
  }
  if (isBlank(raw.quantityReceived) || Number.isNaN(quantity)) {
    issues.push({
      path: path("quantityReceived"),
      message: "Mohon Lengkapi Jumlah Diterima",
    });
  } else if (!Number.isInteger(quantity)) {
    issues.push({
      path: path("quantityReceived"),
      message: "Jumlah Diterima harus bilangan bulat",
    });
  } else if (quantity <= 0) {
    issues.push({
      path: path("quantityReceived"),
      message: "Jumlah Diterima harus lebih dari 0",
    });
  }
  if (!TARGETS.includes(String(raw.target))) {
    issues.push({
      path: path("target"),
      message: "Mohon Lengkapi Jenis Penerimaan",
    });
  }

  return {
    purchaseOrderItemId: Number(raw.purchaseOrderItemId),
    quantityReceived: quantity,
    target: raw.target === "STOCK" ? "STOCK" : "ASSET",
    stockItemId:
      raw.target === "STOCK" && !isBlank(raw.stockItemId)
        ? Number(raw.stockItemId)
        : null,
  };
};

const parse = (form: FormData) => {
  const issues: Issue[] = [];
  const rawOrder = textOf(form.get("purchaseOrderId"));
  const receivedDate = textOf(form.get("receivedDate")).slice(0, 10);
  const note = textOf(form.get("note"));
  const rawItems = readItems(textOf(form.get("items")));
  const files = filesOf(form, "image");

  if (!rawOrder) {
    issues.push({
      path: "purchaseOrderId",
      message: "Mohon Lengkapi Pesanan Pembelian",
    });
  } else if (!/^\d+$/.test(rawOrder)) {
    issues.push({
      path: "purchaseOrderId",
      message: "Pesanan Pembelian tidak valid",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) {
    issues.push({
      path: "receivedDate",
      message: "Mohon Lengkapi Tanggal Terima",
    });
  } else if (receivedDate > TODAY) {
    issues.push({
      path: "receivedDate",
      message: "Tanggal Terima Tidak Boleh Di Masa Depan",
    });
  }
  if (note.length > 250) {
    issues.push({
      path: "note",
      message: "Catatan tidak boleh lebih dari 250 karakter",
    });
  }
  if (rawItems === null) {
    issues.push({ path: "items", message: "Format Barang Tidak Valid" });
  } else if (rawItems.length === 0) {
    issues.push({
      path: "items",
      message: "Penerimaan Barang harus memiliki minimal 1 baris",
    });
  } else if (rawItems.length > MAX_LINES) {
    issues.push({
      path: "items",
      message: "Penerimaan Barang tidak boleh lebih dari 50 baris",
    });
  }

  const items = (rawItems ?? []).map((raw, index) =>
    parseLine((raw ?? {}) as Record<string, unknown>, index, issues),
  );

  if (files.length > MAX_ATTACHMENTS) {
    issues.push({ path: "image", message: "Lampiran Maksimal 3" });
  }

  if (issues.length > 0) return { failure: invalid(issues) };

  return {
    value: {
      purchaseOrderId: Number(rawOrder),
      receivedDate,
      note: note || null,
      items,
      files,
    },
  };
};

const orderRefOf = (orderId: number) => {
  const order = PURCHASE_ORDER.find((row) => row.id === orderId);

  return {
    orderCode: order?.code ?? "",
    supplierName:
      SUPPLIER.find((row) => row.id === order?.supplierId)?.name ?? "",
  };
};

const orderLineCountOf = (receiptId: number) =>
  new Set(
    GOODS_RECEIPT.find((row) => row.id === receiptId)?.items.map(
      (item) => item.purchaseOrderItemId,
    ),
  ).size;

const listRows = (url: URL) => {
  const params = url.searchParams;
  const orderId = Number(params.get("purchaseOrderId")) || null;
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const filter = (params.get("filter") ?? "").toLowerCase();

  return GOODS_RECEIPT.filter(
    (row) => orderId === null || row.purchaseOrderId === orderId,
  )
    .filter((row) => !startDate || row.receivedDate >= startDate)
    .filter((row) => !endDate || row.receivedDate <= endDate)
    .filter((row) => {
      if (!filter) return true;

      const { orderCode, supplierName } = orderRefOf(row.purchaseOrderId);

      return [row.code, orderCode, supplierName].some((value) =>
        value.toLowerCase().includes(filter),
      );
    })
    .sort(
      (a, b) =>
        b.receivedDate.localeCompare(a.receivedDate) ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .map((row) => ({
      ...goodsReceiptView(row),
      itemCount: orderLineCountOf(row.id),
    }));
};

export const penerimaanBarangMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  const [, root, code, extra] = path.split("/");
  if (root !== "penerimaan-barang" || extra !== undefined) return null;
  if (code ? method !== "GET" : method !== "GET" && method !== "POST") {
    return null;
  }

  if (!can(MENU.PENERIMAAN_BARANG, method === "POST" ? "CREATE" : "VIEW")) {
    return denied();
  }

  if (method === "GET" && !code) {
    if (process.env.MOCK_500) return serverError();

    return list(
      listRows(url),
      url,
      "Penerimaan Barang",
      "Penerimaan Barang",
      "Berhasil Mendapatkan Penerimaan Barang",
    );
  }

  if (method === "GET") {
    const row = goodsReceiptByCode(decodeURIComponent(code ?? ""));

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Penerimaan Barang",
          data: goodsReceiptView(row, true),
        })
      : json({ status: 404, error: "Penerimaan Barang Tidak Ditemukan" }, 404);
  }

  if (process.env.MOCK_GR_SAVE_ERROR === "500") return serverError();

  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form);
  if (parsed.failure) return parsed.failure;

  const { files, ...input } = parsed.value;
  const result = receiveGoods({
    ...input,
    attachments: await Promise.all(
      files.map(async (file) => ({
        ...(await putMedia(file, "goods-receipt")),
        publicId: crypto.randomUUID(),
      })),
    ),
  });

  if ("failure" in result) {
    const { status, message, path: field } = result.failure;

    return json(
      field
        ? { status, error: message, issues: [{ path: field, message }] }
        : { status, error: message },
      status,
    );
  }

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Penerimaan Barang",
      data: goodsReceiptView(result.receipt, true),
    },
    201,
  );
};
