import { describe, expect, test } from "bun:test";

import { DEFAULT_LIMIT, toApiQuery } from "./use-list-params";

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
