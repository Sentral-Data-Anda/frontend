import { describe, expect, test } from "bun:test";

import { toApiQuery } from "@/hooks/use-list-params";

import {
  EMPTY_STOCK_FORM,
  STOCK_FILTERS,
  serverFieldError,
  signedQuantityOf,
  sourceLabelOf,
  stockFormSchema,
  stockStatusOf,
  toStockPayload,
  type StockFormValues,
} from "./model";

const VALID: StockFormValues = {
  ...EMPTY_STOCK_FORM,
  name: "  Lilin   Altar ",
  typeId: "6",
  unitId: "1",
  roomId: "1",
  bapelId: "1",
};

describe("status stok", () => {
  test("Habis, Menipis tepat di batas, Tersedia, tanpa batas", () => {
    expect(stockStatusOf({ quantity: 0, reorderPoint: 5 })).toBe("HABIS");
    expect(stockStatusOf({ quantity: 0, reorderPoint: null })).toBe("HABIS");
    expect(stockStatusOf({ quantity: 5, reorderPoint: 5 })).toBe("MENIPIS");
    expect(stockStatusOf({ quantity: 6, reorderPoint: 5 })).toBe("TERSEDIA");
    expect(stockStatusOf({ quantity: 1, reorderPoint: null })).toBe("TERSEDIA");
  });
});

describe("skema", () => {
  test("wajib: nama, tipe, satuan, ruang, badan pelayanan", () => {
    const result = stockFormSchema.safeParse(EMPTY_STOCK_FORM);
    const messages = result.error?.issues.map((issue) => issue.message);

    expect(messages).toEqual([
      "Isi nama barang",
      "Pilih tipe barang",
      "Pilih satuan",
      "Pilih ruang",
      "Pilih badan pelayanan",
    ]);
  });

  test("batas panjang dan angka bulat", () => {
    const result = stockFormSchema.safeParse({
      ...VALID,
      name: "a".repeat(151),
      description: "b".repeat(251),
      openingQuantity: "1.5",
    });

    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "name",
      "description",
      "openingQuantity",
    ]);
    expect(stockFormSchema.safeParse(VALID).success).toBe(true);
  });
});

describe("payload", () => {
  test("tambah menyertakan openingQuantity; keterangan kosong tidak dikirim; batas kosong null", () => {
    expect(toStockPayload(VALID, false)).toEqual({
      name: "Lilin Altar",
      typeId: 6,
      bapelId: 1,
      roomId: 1,
      unitId: 1,
      reorderPoint: null,
      openingQuantity: 0,
    });
    expect(
      toStockPayload({ ...VALID, openingQuantity: "25" }, false)
        .openingQuantity,
    ).toBe(25);
  });

  test("ubah tanpa openingQuantity", () => {
    const payload = toStockPayload(
      {
        ...VALID,
        openingQuantity: "9",
        reorderPoint: "20",
        description: " Untuk altar ",
      },
      true,
    );

    expect(payload).not.toHaveProperty("openingQuantity");
    expect(payload.reorderPoint).toBe(20);
    expect(payload.description).toBe("Untuk altar");
  });
});

test("galat duplikat → field nama dengan teks sendiri", () => {
  expect(serverFieldError("Barang Persediaan Sudah Tersedia")).toEqual({
    field: "name",
    message: "Barang persediaan dengan nama ini sudah ada. Pakai nama lain.",
  });
  expect(serverFieldError("Tipe Barang Tidak Ditemukan")).toBeNull();
});

test("filter → toApiQuery: menipis=ya dan relasi", () => {
  const apiFilters = Object.fromEntries(
    Object.entries(STOCK_FILTERS).map(([key, { api }]) => [
      api,
      { stok: "ya", tipe: "6", ruang: "2", satuan: "", bapel: "1" }[key] ?? "",
    ]),
  );

  expect(
    toApiQuery({ page: 1, limit: 10, search: "", status: "", apiFilters }),
  ).toBe("page=1&limit=10&menipis=ya&typeId=6&roomId=2&bapelId=1");
});

test("tanda jumlah per jenis; Masuk lainnya = Beli langsung", () => {
  expect(signedQuantityOf({ type: "IN", quantity: 10 })).toBe("+10");
  expect(signedQuantityOf({ type: "OUT", quantity: 5 })).toBe("−5");
  expect(signedQuantityOf({ type: "ADJUSTMENT", quantity: -2 })).toBe("−2");
  expect(signedQuantityOf({ type: "ADJUSTMENT", quantity: 3 })).toBe("+3");
  expect(sourceLabelOf({ type: "IN", source: "MANUAL" })).toBe("Beli langsung");
  expect(sourceLabelOf({ type: "ADJUSTMENT", source: "MANUAL" })).toBe(
    "Lainnya",
  );
});
