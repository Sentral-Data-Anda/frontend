import { describe, expect, test } from "bun:test";

import {
  DEFAULT_LIMIT,
  LIMIT_ALL,
  readLimit,
  toApiQuery,
} from "./use-list-params";

describe("toApiQuery", () => {
  test("menerjemahkan search menjadi filter", () => {
    const query = toApiQuery({
      page: 1,
      limit: DEFAULT_LIMIT,
      search: "budi",
      status: "",
    });

    expect(new URLSearchParams(query).get("filter")).toBe("budi");
    expect(new URLSearchParams(query).has("search")).toBe(false);
  });

  test("membuang kata kunci dan status yang kosong", () => {
    const query = toApiQuery({ page: 2, limit: 25, search: "", status: "" });

    expect(query).toBe("page=2&limit=25");
  });

  test("meneruskan `all` apa adanya, bukan sebagai angka", () => {
    // Backend hanya mematikan paging untuk kata ini; `Number("all")` adalah
    // NaN, dan `limit=NaN` dibaca backend sebagai ukuran halaman bawaan.
    const query = toApiQuery({
      page: 1,
      limit: LIMIT_ALL,
      search: "",
      status: "",
    });

    expect(new URLSearchParams(query).get("limit")).toBe("all");
  });
});

describe("readLimit", () => {
  test("mengenali `all` dari URL, apa pun huruf besar-kecilnya", () => {
    // Tanpa ini pengguna memilih "Semua", URL-nya benar (?limit=all), tapi
    // tabelnya tetap sepuluh baris.
    expect(readLimit("all", DEFAULT_LIMIT)).toBe(LIMIT_ALL);
    expect(readLimit("ALL", DEFAULT_LIMIT)).toBe(LIMIT_ALL);
    expect(readLimit(" All ", DEFAULT_LIMIT)).toBe(LIMIT_ALL);
  });

  test("tetap membaca angka, dan jatuh ke bawaan untuk yang lain", () => {
    expect(readLimit("25", DEFAULT_LIMIT)).toBe(25);
    expect(readLimit("abc", DEFAULT_LIMIT)).toBe(DEFAULT_LIMIT);
    expect(readLimit(null, DEFAULT_LIMIT)).toBe(DEFAULT_LIMIT);
    expect(readLimit("0", DEFAULT_LIMIT)).toBe(DEFAULT_LIMIT);
  });

  test("membawa status sebagai parameter facet tersendiri", () => {
    const query = toApiQuery({
      page: 1,
      limit: DEFAULT_LIMIT,
      search: "",
      status: "TIDAK_AKTIF",
    });

    expect(new URLSearchParams(query).get("status")).toBe("TIDAK_AKTIF");
  });

  test("meng-encode kata kunci yang mengandung spasi dan ampersand", () => {
    const query = toApiQuery({
      page: 1,
      limit: DEFAULT_LIMIT,
      search: "budi & ani",
      status: "",
    });

    expect(query).toContain("filter=budi+%26+ani");
    expect(new URLSearchParams(query).get("filter")).toBe("budi & ani");
  });

  test("filter skema dikirim dengan nama be-sada, yang kosong dibuang", () => {
    const query = toApiQuery({
      page: 1,
      limit: DEFAULT_LIMIT,
      search: "",
      status: "",
      apiFilters: { zone: "2", other: "" },
    });

    expect(new URLSearchParams(query).get("zone")).toBe("2");
    expect(new URLSearchParams(query).has("wilayah")).toBe(false);
    expect(new URLSearchParams(query).has("other")).toBe(false);
  });
});
