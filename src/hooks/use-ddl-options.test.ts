import { expect, test } from "bun:test";

import { ddlSearchPath, toDdlOptions } from "./use-ddl-options";

const ROWS = [
  { id: 1, code: "ZC-0001", name: "Satu" },
  { id: 2, code: "ZC-0002", name: "Dua", isActive: false },
  { id: 3, code: "ZC-0003", name: "Tiga", isActive: true },
];

test("toDdlOptions: baris nonaktif disembunyikan kecuali nilai tersimpan", () => {
  expect(toDdlOptions(ROWS, "id")).toEqual([
    { value: "1", label: "Satu" },
    { value: "3", label: "Tiga" },
  ]);
  expect(toDdlOptions(ROWS, "id", "2")).toEqual([
    { value: "1", label: "Satu" },
    { value: "2", label: "Dua (nonaktif)" },
    { value: "3", label: "Tiga" },
  ]);
});

test("ddlSearchPath: resource boleh membawa query sendiri", () => {
  expect(ddlSearchPath("jemaat", "")).toBe("jemaat?limit=20");
  expect(ddlSearchPath("jemaat?register=0", "a b")).toBe(
    "jemaat?register=0&limit=20&filter=a%20b",
  );
});

test("toDdlOptions: hintOf mengisi hint tiap opsi", () => {
  const rows = [
    { id: 7, code: "BRP-0007", name: "Lilin", quantity: 12, unit: "Buah" },
  ];

  expect(
    toDdlOptions(rows, "id", "", (row) => `Stok ${row.quantity} ${row.unit}`),
  ).toEqual([{ value: "7", label: "Lilin", hint: "Stok 12 Buah" }]);
  expect(toDdlOptions(rows, "id")).toEqual([{ value: "7", label: "Lilin" }]);
});
