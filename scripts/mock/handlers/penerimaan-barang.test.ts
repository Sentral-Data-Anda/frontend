import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { ASSET, STOCK_ITEM, STOCK_MOVEMENT } from "../inventaris-store";
import type { MockAction, MockContext } from "../kit";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
  TODAY,
  purchaseOrderByCode,
} from "../pengadaan-store";

import { penerimaanBarangMock } from "./penerimaan-barang";

const snapshot = <T extends object>(rows: T[]) => {
  const copy = rows.map((row) => structuredClone(row));

  return () => {
    rows.splice(copy.length);
    copy.forEach((row, index) => Object.assign(rows[index] as T, row));
  };
};

const restores = [
  PURCHASE_ORDER,
  GOODS_RECEIPT,
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
].map((rows) => snapshot<object>(rows));

afterEach(() => {
  for (const restore of restores) restore();
  delete process.env.MOCK_500;
  delete process.env.MOCK_GR_SAVE_ERROR;
});

const call = async (
  method: string,
  path: string,
  body?: FormData,
  granted: MockAction[] = ["VIEW", "CREATE"],
) => {
  const url = new URL(`http://mock.test/api/v1${path}`);
  const request = new Request(url, { method });
  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body) request.formData = async () => body;
  const context: MockContext = {
    request,
    url,
    path: url.pathname.replace("/api/v1", ""),
    method,
    can: (slug, action) =>
      slug === MENU.PENERIMAAN_BARANG && granted.includes(action),
    isAdmin: false,
    sessionCode: "test",
  };
  const response = await penerimaanBarangMock(context);
  if (!response) throw new Error("handler tidak menjawab");

  return { status: response.status, body: await response.json() };
};

const orderOf = (code: string) => {
  const row = purchaseOrderByCode(code);
  if (!row) throw new Error(`pesanan ${code} tidak ada`);

  return row;
};

const formOf = (
  fields: Record<string, string>,
  items: unknown,
  files: File[] = [],
) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append(
    "items",
    typeof items === "string" ? items : JSON.stringify(items),
  );
  for (const file of files) form.append("image", file, file.name);

  return form;
};

const photo = (name: string) =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

describe("GET", () => {
  test("daftar: urut tanggal terima, itemCount = baris pesanan, cari supplier", async () => {
    const { status, body } = await call(
      "GET",
      "/penerimaan-barang?filter=agape",
    );

    expect(status).toBe(200);
    expect(body.message).toBe("Berhasil Mendapatkan Penerimaan Barang");
    expect(body.data.map((row: { code: string }) => row.code)).toEqual([
      "GRN-2026-0002",
      "GRN-2026-0001",
    ]);
    expect(body.data[1].itemCount).toBe(2);
    expect(body.data[1].items).toBeUndefined();
  });

  test("daftar kosong 404; MOCK_500 500; tanpa VIEW 403", async () => {
    expect((await call("GET", "/penerimaan-barang?filter=zzz")).status).toBe(
      404,
    );
    process.env.MOCK_500 = "1";
    expect((await call("GET", "/penerimaan-barang")).status).toBe(500);
    expect(
      (await call("GET", "/penerimaan-barang/GRN-2026-0001", undefined, []))
        .status,
    ).toBe(403);
  });

  test("detail tanpa peka huruf besar; tidak ada 404", async () => {
    const found = await call("GET", "/penerimaan-barang/grn-2026-0001");

    expect(found.status).toBe(200);
    expect(
      found.body.data.attachments.map((item: { name: string }) => item.name),
    ).toEqual(["Nota Toko Buku Agape", "Surat jalan"]);
    expect(found.body.data.items[0].unitPriceIDR).toBe("55000");
    expect(
      (await call("GET", "/penerimaan-barang/GRN-2026-9999")).body.error,
    ).toBe("Penerimaan Barang Tidak Ditemukan");
  });
});

describe("POST", () => {
  test("zod: urutan dan path issues", async () => {
    const { status, body } = await call(
      "POST",
      "/penerimaan-barang",
      formOf({ receivedDate: "2999-01-01" }, [{ quantityReceived: 0 }]),
    );

    expect(status).toBe(400);
    expect(body.issues).toEqual([
      { path: "purchaseOrderId", message: "Mohon Lengkapi Pesanan Pembelian" },
      {
        path: "receivedDate",
        message: "Tanggal Terima Tidak Boleh Di Masa Depan",
      },
      {
        path: "items.0.purchaseOrderItemId",
        message: "Mohon Lengkapi Baris Pesanan",
      },
      {
        path: "items.0.quantityReceived",
        message: "Jumlah Diterima harus lebih dari 0",
      },
      {
        path: "items.0.target",
        message: "Mohon Lengkapi Jenis Penerimaan",
      },
    ]);
  });

  test("items bukan JSON; lampiran ke-4 dan ke-5", async () => {
    const order = orderOf("PO-2026-0006");
    const fields = { purchaseOrderId: String(order.id), receivedDate: TODAY };

    expect(
      (await call("POST", "/penerimaan-barang", formOf(fields, "[{"))).body
        .issues[0],
    ).toEqual({ path: "items", message: "Format Barang Tidak Valid" });

    const line = [
      {
        purchaseOrderItemId: order.items[0]?.id,
        quantityReceived: 1,
        target: "ASSET",
      },
    ];
    const four = await call(
      "POST",
      "/penerimaan-barang",
      formOf(fields, line, ["a", "b", "c", "d"].map(photo)),
    );
    expect(four.body.issues).toEqual([
      { path: "image", message: "Lampiran Maksimal 3" },
    ]);

    const five = await call(
      "POST",
      "/penerimaan-barang",
      formOf(fields, line, ["a", "b", "c", "d", "e"].map(photo)),
    );
    expect(five.body.error).toBe("Unexpected field");
  });

  test("Barang jumlah 2 → 2 barang, receivedBy diabaikan, lampiran tersimpan", async () => {
    const order = orderOf("PO-2026-0006");
    const assets = ASSET.length;
    const form = formOf(
      {
        purchaseOrderId: String(order.id),
        receivedDate: TODAY,
        receivedBy: "99",
      },
      [
        {
          purchaseOrderItemId: order.items[0]?.id,
          quantityReceived: 2,
          target: "ASSET",
          stockItemId: 5,
        },
      ],
      [photo("nota.jpg")],
    );
    const { status, body } = await call("POST", "/penerimaan-barang", form);

    expect(status).toBe(201);
    expect(body.message).toBe("Berhasil Menambahkan Penerimaan Barang");
    expect(body.data.items).toHaveLength(2);
    expect(body.data.items[0].asset.code).toStartWith("AST_");
    expect(body.data.items[0].stockItem).toBeNull();
    expect(body.data.attachments[0].name).toBe("nota");
    expect(ASSET.length).toBe(assets + 2);
    expect(ASSET.at(-1)?.acquisitionCost).toBe(215_000);
    expect(body.data.receivedBy).not.toBeNull();

    const listed = await call(
      "GET",
      `/penerimaan-barang?filter=${body.data.code}`,
    );
    expect(listed.body.data[0].itemCount).toBe(1);
  });

  test("persediaan: satuan beda ditolak di baris; persediaan baru dibuat", async () => {
    const order = orderOf("PO-2026-0006");
    const otherUnit = STOCK_ITEM.find(
      (row) => row.unitId !== order.items[0]?.unitId,
    );
    const fields = { purchaseOrderId: String(order.id), receivedDate: TODAY };
    const line = {
      purchaseOrderItemId: order.items[0]?.id,
      quantityReceived: 3,
      target: "STOCK",
    };

    const rejected = await call(
      "POST",
      "/penerimaan-barang",
      formOf(fields, [{ ...line, stockItemId: otherUnit?.id }]),
    );
    expect(rejected.body.issues[0].path).toBe("items.0.stockItemId");
    expect(rejected.body.error).toStartWith(
      "Satuan Barang Persediaan Berbeda Dengan Pesanan",
    );

    const stocks = STOCK_ITEM.length;
    const created = await call(
      "POST",
      "/penerimaan-barang",
      formOf(fields, [{ ...line, stockItemId: null }]),
    );
    expect(created.status).toBe(201);
    expect(STOCK_ITEM.length).toBe(stocks + 1);
    expect(STOCK_MOVEMENT.at(-1)?.note).toBe(
      `Penerimaan ${created.body.data.code}`,
    );
  });

  test("urutan: semua baris dicek dulu, baru persediaan", async () => {
    const order = orderOf("PO-2026-0003");
    const [projector, paper] = order.items;
    const otherUnit = STOCK_ITEM.find((row) => row.unitId !== paper?.unitId);
    const { body } = await call(
      "POST",
      "/penerimaan-barang",
      formOf({ purchaseOrderId: String(order.id), receivedDate: TODAY }, [
        {
          purchaseOrderItemId: paper?.id,
          quantityReceived: 1,
          target: "STOCK",
          stockItemId: otherUnit?.id,
        },
        {
          purchaseOrderItemId: projector?.id,
          quantityReceived: 5,
          target: "ASSET",
        },
      ]),
    );

    expect(body.issues[0].path).toBe("items.1.quantityReceived");
    expect(body.error).toContain("Melebihi Jumlah Yang Dipesan");
  });

  test("tanpa CREATE 403; MOCK_GR_SAVE_ERROR 500", async () => {
    const form = formOf({}, []);

    expect(
      (await call("POST", "/penerimaan-barang", form, ["VIEW"])).status,
    ).toBe(403);
    process.env.MOCK_GR_SAVE_ERROR = "500";
    expect(
      (await call("POST", "/penerimaan-barang", formOf({}, []))).status,
    ).toBe(500);
  });
});
