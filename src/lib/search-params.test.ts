import { describe, expect, test } from "bun:test";

import { parseSearch, stringifySearch } from "./search-params";

describe("query string URL tetap URLSearchParams biasa", () => {
  test("angka dan teks dibaca sebagai string, bukan JSON", () => {
    expect(parseSearch("?page=1&search=Budi")).toEqual({
      page: "1",
      search: "Budi",
    });
  });

  test("ditulis tanpa tanda kutip JSON", () => {
    expect(stringifySearch({ page: "1", search: "Budi Santoso" })).toBe(
      "?page=1&search=Budi+Santoso",
    );
  });

  test("bolak-balik menghasilkan string yang sama", () => {
    const search = "?status=AKTIF&page=3&redirect=%2Fjemaat%3Fpage%3D2";

    expect(stringifySearch(parseSearch(search))).toBe(search);
  });

  test("kunci berulang dipertahankan", () => {
    const parsed = parseSearch("?tag=a&tag=b");

    expect(parsed).toEqual({ tag: ["a", "b"] });
    expect(stringifySearch(parsed)).toBe("?tag=a&tag=b");
  });

  test("nilai kosong dibuang, query kosong tanpa tanda tanya", () => {
    expect(stringifySearch({ page: undefined, search: null })).toBe("");
  });
});
