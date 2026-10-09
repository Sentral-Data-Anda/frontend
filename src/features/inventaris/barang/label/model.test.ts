import { describe, expect, test } from "bun:test";

import {
  codePartsOf,
  labelHrefOf,
  labelSourceOf,
  labelUrlOf,
  sheetsOf,
} from "./model";

describe("label barang", () => {
  test("?kode= → daftar kode unik, tanpa query daftar", () => {
    expect(
      labelSourceOf(new URLSearchParams("kode=A_1, B-2,,A_1&status=dilepas")),
    ).toEqual({ kind: "code", codes: ["A_1", "B-2"] });
    expect(labelSourceOf(new URLSearchParams("kode="))).toEqual({
      kind: "code",
      codes: [],
    });
  });

  test("filter daftar → query be-sada, bawaan status aktif, 100 per halaman", () => {
    expect(labelSourceOf(new URLSearchParams(""))).toEqual({
      kind: "filter",
      query: "page=1&limit=100&status=aktif",
    });
    expect(
      labelSourceOf(
        new URLSearchParams(
          "search=kursi&status=dilepas&kondisi=BAIK&sumber=GRANT&tipe=3&ruang=2&bapel=1&page=4",
        ),
      ),
    ).toEqual({
      kind: "filter",
      query:
        "page=1&limit=100&filter=kursi&status=dilepas&condition=BAIK&acquisitionSource=GRANT&typeId=3&roomId=2&bapelId=1",
    });
  });

  test("tautan cetak membawa filter yang terisi saja", () => {
    expect(labelHrefOf({ search: "", status: "aktif", ruang: "2" })).toBe(
      "/fixed-asset/asset-master/label?status=aktif&ruang=2",
    );
    expect(labelHrefOf({ kode: "AST_0001_0002-0001" })).toBe(
      "/fixed-asset/asset-master/label?kode=AST_0001_0002-0001",
    );
    expect(labelHrefOf({})).toBe("/fixed-asset/asset-master/label");
  });

  test("isi QR = URL halaman barang", () => {
    expect(labelUrlOf("https://sada.example/", "AST_0001_0002-0001")).toBe(
      "https://sada.example/fixed-asset/asset-master/AST_0001_0002-0001",
    );
  });

  test("24 label per lembar, sisa di lembar terakhir", () => {
    const items = Array.from({ length: 50 }, (_, index) => index);
    const sheets = sheetsOf(items);

    expect(sheets.map((sheet) => sheet.length)).toEqual([24, 24, 2]);
    expect(sheets[2]).toEqual([48, 49]);
    expect(sheetsOf([])).toEqual([]);
  });

  test("kode boleh turun baris sesudah _ dan -", () => {
    expect(codePartsOf("AST_0001_0002-0001")).toEqual([
      "AST_",
      "0001_",
      "0002-",
      "0001",
    ]);
  });
});
