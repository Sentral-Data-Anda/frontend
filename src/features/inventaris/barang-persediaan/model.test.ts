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
  valueOf,
  type StockFormValues,
} from "./model";

const VALID: StockFormValues = {
  ...EMPTY_STOCK_FORM,
  name: "  lilin   ALTAR ",
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
      name: "lilin ALTAR",
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

describe("valueOf", () => {
  /**
   * Nilai persediaan barang ini: jumlah x harga RATA-RATA.
   *
   * Bukan harga beli terakhir, karena inilah angka yang dibawa Persediaan di
   * Neraca. Menampilkan jumlah x harga terakhir di sebelahnya akan memberi dua
   * angka berbeda untuk satu hal, dan salah satunya pasti tidak cocok dengan
   * buku besar.
   */
  test("jumlah dikali harga rata-rata", () => {
    expect(valueOf({ quantity: 12, avgUnitPrice: "82500.00" })).toBe(
      "990000.00",
    );
  });

  test("tanpa harga rata-rata nilainya nol, bukan NaN", () => {
    expect(valueOf({ quantity: 12, avgUnitPrice: null })).toBe("0");
  });

  test("stok nol bernilai nol", () => {
    expect(valueOf({ quantity: 0, avgUnitPrice: "82500.00" })).toBe("0.00");
  });

  /**
   * Kasus nyata tempat `Number(harga) * jumlah` salah satu sen.
   *
   * Ditemukan dengan mencari, bukan dengan menduga: tebakan pertama saya
   * (10.000 x 1.234.567,89) HIJAU di kedua implementasi, jadi test itu tidak
   * membuktikan apa pun tentang BigInt-nya. Angka ini memang di luar skala
   * gereja — sekitar 50 triliun — dan itu bagian dari apa yang dikatakannya:
   * perhitungan sen ini murah, bukan mendesak.
   */
  test("perhitungan sen tidak membulat seperti double", () => {
    expect(valueOf({ quantity: 720_023, avgUnitPrice: "70073865.88" })).toBe(
      "50454795132515.24",
    );
    expect((Number("70073865.88") * 720_023).toFixed(2)).toBe(
      "50454795132515.23",
    );
  });

  // Mock menjawab "82500" tanpa desimal sementara server menjawab "82500.00".
  // Keduanya harus terurai sama, atau layar yang ditinjau terhadap mock
  // menunjukkan angka yang berbeda dari produksi.
  test("harga tanpa desimal terurai sama dengan yang berdesimal", () => {
    expect(valueOf({ quantity: 3, avgUnitPrice: "82500" })).toBe(
      valueOf({ quantity: 3, avgUnitPrice: "82500.00" }),
    );
  });
});
