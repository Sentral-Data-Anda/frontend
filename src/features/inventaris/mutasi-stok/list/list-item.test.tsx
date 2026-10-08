import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { stockItemHref } from "../model";
import type { Movement } from "../types";

import { MutasiListItemRow, mutasiTable } from "./list-item";

afterEach(cleanup);

const MOVEMENT: Movement = {
  id: 30,
  publicId: "mv30",
  stockItemId: 1,
  type: "IN",
  source: "MANUAL",
  quantity: 10,
  balanceAfter: 58,
  value: "750000.00",
  movementDate: "2026-09-20T00:00:00.000Z",
  note: "Toko Sinar",
  stockItem: {
    publicId: "s1",
    code: "BRP-0001",
    name: "Lilin Altar",
    unit: { publicId: "u1", name: "Buah" },
    room: { code: "RM-0001", name: "Gedung Gereja" },
  },
};

test("baris: jumlah bertanda + satuan, Sisa; tanpa pensil; tautan barang hanya dengan izin", () => {
  render(
    <ul>
      <MutasiListItemRow movement={MOVEMENT} />
    </ul>,
  );

  expect(screen.getByText("+10 Buah")).toBeTruthy();
  expect(screen.getByText("Sisa 58")).toBeTruthy();
  expect(screen.getByText("20 September 2026 · Beli langsung")).toBeTruthy();
  expect(screen.queryAllByRole("link")).toEqual([]);

  cleanup();
  render(
    <ul>
      <MutasiListItemRow
        movement={{ ...MOVEMENT, type: "OUT", source: "USAGE", quantity: 5 }}
        isCanViewItem
      />
    </ul>,
  );
  expect(screen.getByText("−5 Buah")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Lilin Altar" }).getAttribute("href"),
  ).toBe(stockItemHref("BRP-0001"));
});

test("tabel: kolom brief, tanpa tautan baris dan tanpa kolom aksi", () => {
  const table = mutasiTable();

  expect(table.columns.map((column) => column.key)).toEqual([
    "date",
    "item",
    "type",
    "source",
    "quantity",
    "balance",
    "note",
  ]);
  expect(table.getRowHref).toBeUndefined();
});
