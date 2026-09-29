import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { stockDetailHref, stockEditHref } from "../model";
import type { StockItem } from "../types";

import { StockListItemRow, persediaanTable } from "./list-item";

afterEach(cleanup);

const ref = (code: string, name: string) => ({ publicId: code, code, name });

const ROTI: StockItem = {
  id: 2,
  publicId: "s2",
  code: "BRP-0002",
  name: "Roti Perjamuan",
  description: "",
  quantity: 3,
  reorderPoint: 5,
  lastUnitPrice: null,
  typeId: 6,
  bapelId: 1,
  roomId: 1,
  unitId: 3,
  type: ref("TYP_ITM-0006", "Perlengkapan Ibadah"),
  bapel: ref("BPL-1", "Majelis Jemaat"),
  room: ref("RM-0001", "Gedung Gereja"),
  unit: ref("UNT-0003", "Pak"),
};

test("baris: judul ke halaman; meta stok + ruang; Menipis; pensil hanya dengan UPDATE", () => {
  render(
    <ul>
      <StockListItemRow item={ROTI} />
    </ul>,
  );

  expect(
    screen
      .getByRole("link", { name: "Lihat barang persediaan Roti Perjamuan" })
      .getAttribute("href"),
  ).toBe(stockDetailHref("BRP-0002"));
  expect(screen.getByText("3 Pak · Gedung Gereja")).toBeTruthy();
  expect(screen.getByText("Menipis")).toBeTruthy();
  expect(
    screen.queryByRole("link", { name: "Ubah Roti Perjamuan" }),
  ).toBeNull();

  cleanup();
  render(
    <ul>
      <StockListItemRow item={{ ...ROTI, quantity: 0 }} isCanUpdate />
    </ul>,
  );
  expect(screen.getByText("Habis")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Ubah Roti Perjamuan" })
      .getAttribute("href"),
  ).toBe(stockEditHref("BRP-0002"));
});

test("tabel: kolom sesuai brief; aksi hanya dengan UPDATE", () => {
  expect(persediaanTable(false).columns.map((column) => column.key)).toEqual([
    "item",
    "quantity",
    "reorderPoint",
    "room",
    "type",
    "status",
  ]);
  expect(persediaanTable(true).columns.at(-1)?.key).toBe("edit");
  expect(persediaanTable(false).getRowHref?.(ROTI)).toBe(
    stockDetailHref("BRP-0002"),
  );
});
