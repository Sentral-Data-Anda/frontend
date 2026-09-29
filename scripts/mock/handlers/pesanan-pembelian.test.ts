import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";
import {
  PURCHASE_ORDER,
  PURCHASE_REQUEST,
  SUPPLIER,
  TODAY,
} from "../pengadaan-store";

import { pesananPembelianMock } from "./pesanan-pembelian";

const SNAPSHOT = structuredClone(PURCHASE_ORDER);

afterEach(() => {
  PURCHASE_ORDER.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  delete process.env.MOCK_PO_ACTION_500;
});

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data: Record<string, unknown> & Record<string, unknown>[];
};

const onCall = async (
  input: string,
  init: { method?: string; body?: unknown } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const response = (await pesananPembelianMock({
    request: new Request(url, {
      method,
      body: init.body ? JSON.stringify(init.body) : undefined,
    }),
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Body };
};

const orderAt = (index: number) =>
  PURCHASE_ORDER[index] as (typeof PURCHASE_ORDER)[number];

const approved = PURCHASE_REQUEST.find(
  (row) => row.purpose === "Perlengkapan retret pemuda Oktober",
);
const retired = SUPPLIER.find((row) => !row.isActive && !row.deletedAt);
const active = SUPPLIER.find((row) => row.isActive && !row.deletedAt);

const line = (extra: Record<string, unknown> = {}) => ({
  name: "Tenda dome",
  description: "Kapasitas 6 orang",
  quantity: 2,
  unitPrice: 520.5,
  typeId: 3,
  roomId: 2,
  unitId: 1,
  ...extra,
});

const body = (extra: Record<string, unknown> = {}) => ({
  purchaseRequestId: approved?.id,
  supplierId: active?.id,
  currencyCode: "USD",
  orderDate: TODAY,
  items: [line()],
  ...extra,
});

describe("baca", () => {
  test("detail boleh dengan VIEW Penerimaan saja; daftar tidak", async () => {
    const onlyReceiving = (slug: string, action: MockAction) =>
      slug === MENU.PENERIMAAN_BARANG && action === "VIEW";

    expect(
      (await onCall(`/pesanan-pembelian/${orderAt(2).code}`, {}, onlyReceiving))
        .status,
    ).toBe(200);
    expect((await onCall("/pesanan-pembelian", {}, onlyReceiving)).status).toBe(
      403,
    );
  });

  test("daftar: urut orderDate turun, filter supplier + kode", async () => {
    const all = await onCall("/pesanan-pembelian?limit=100");
    const dates = all.body.data.map((row) => String(row.orderDate));

    expect(dates).toEqual([...dates].sort().reverse());
    expect("items" in all.body.data[0]).toBe(false);

    const bySupplier = await onCall(
      `/pesanan-pembelian?supplierId=${orderAt(3).supplierId}&filter=${orderAt(3).code.toLowerCase()}`,
    );

    expect(bySupplier.body.data.map((row) => row.code)).toEqual([
      orderAt(3).code,
    ]);
  });
});

describe("simpan", () => {
  test("USD: kurs dibekukan, total Rupiah dibulatkan sekali", async () => {
    const created = await onCall("/pesanan-pembelian", {
      method: "POST",
      body: body(),
    });

    expect(created.status).toBe(201);
    expect(created.body.data.currencyCode).toBe("USD");
    expect(Number(created.body.data.totalForeignCurrency)).toBe(1041);
    expect(Number(created.body.data.totalIDR)).toBe(1041 * 15_800);
    expect(created.body.data.status).toBe("ISSUED");
  });

  test("zod dulu: semua field wajib dengan path", async () => {
    const result = await onCall("/pesanan-pembelian", {
      method: "POST",
      body: { items: [{}] },
    });

    expect(result.status).toBe(400);
    expect(result.body.issues?.map((issue) => issue.path)).toEqual([
      "purchaseRequestId",
      "supplierId",
      "currencyCode",
      "orderDate",
      "items.0.name",
      "items.0.description",
      "items.0.quantity",
      "items.0.unitPrice",
      "items.0.typeId",
      "items.0.roomId",
      "items.0.unitId",
    ]);
  });

  test("EUR tanpa kurs → 400 currencyCode", async () => {
    const result = await onCall("/pesanan-pembelian", {
      method: "POST",
      body: body({ currencyCode: "EUR" }),
    });

    expect(result.status).toBe(400);
    expect(result.body.issues).toEqual([
      {
        path: "currencyCode",
        message:
          "Belum Ada Kurs EUR Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu",
      },
    ]);
  });

  test("ruang nonaktif di baris → items.<i>.roomId", async () => {
    const result = await onCall("/pesanan-pembelian", {
      method: "POST",
      body: body({ items: [line(), line({ roomId: 5 })] }),
    });

    expect(result.body.issues).toEqual([
      { path: "items.1.roomId", message: "Ruang Tidak Aktif" },
    ]);
  });

  test("supplier nonaktif: ditolak di pesanan baru, boleh bila tidak diganti", async () => {
    const rejected = await onCall("/pesanan-pembelian", {
      method: "POST",
      body: body({ supplierId: retired?.id }),
    });

    expect(rejected.body.issues).toEqual([
      { path: "supplierId", message: "Supplier Tidak Aktif" },
    ]);

    const target = orderAt(5);
    target.supplierId = retired?.id ?? 0;
    const kept = await onCall(`/pesanan-pembelian/${target.code}`, {
      method: "PUT",
      body: body({
        supplierId: retired?.id,
        purchaseRequestId: target.purchaseRequestId,
        currencyCode: "IDR",
      }),
    });

    expect(kept.status).toBe(200);
  });

  test("ubah pesanan Diterima sebagian ditolak", async () => {
    const result = await onCall(`/pesanan-pembelian/${orderAt(2).code}`, {
      method: "PUT",
      body: body(),
    });

    expect(result.body.error).toBe(
      "Hanya Pesanan Berstatus Dipesan Yang Dapat Diubah",
    );
  });
});

describe("aksi", () => {
  test("tutup hanya Diterima sebagian; hasilnya closedShort", async () => {
    const issued = await onCall(`/pesanan-pembelian/${orderAt(5).code}/tutup`, {
      method: "PUT",
    });

    expect(issued.body.error).toBe(
      "Hanya Pesanan Diterima Sebagian Yang Dapat Ditutup",
    );

    const closed = await onCall(`/pesanan-pembelian/${orderAt(2).code}/tutup`, {
      method: "PUT",
    });

    expect(closed.body.data.status).toBe("RECEIVED");
    expect(closed.body.data.closedShort).toBe(true);
  });

  test("hapus mengembalikan publicId + code, lalu 404", async () => {
    const target = orderAt(5);
    const deleted = await onCall(`/pesanan-pembelian/${target.code}`, {
      method: "DELETE",
    });

    expect(Object.entries(deleted.body.data)).toEqual([
      ["publicId", target.publicId],
      ["code", target.code],
    ]);
    expect((await onCall(`/pesanan-pembelian/${target.code}`)).status).toBe(
      404,
    );
  });

  test("batal butuh DELETE", async () => {
    const result = await onCall(
      `/pesanan-pembelian/${orderAt(5).code}/batal`,
      { method: "PUT" },
      (_slug, action) => action !== "DELETE",
    );

    expect(result.status).toBe(403);
  });
});
