import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import { stockDetailHref, stockEditHref } from "../model";
import type { StockItem } from "../types";

import { persediaanTable, StockListItemRow } from "./list-item";

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
  avgUnitPrice: null,
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
    <RowActionsProvider value={persediaanTable(false).getRowActions?.(ROTI)}>
      <ul>
        <StockListItemRow item={ROTI} />
      </ul>
    </RowActionsProvider>,
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
    <RowActionsProvider
      value={persediaanTable(true).getRowActions?.({ ...ROTI, quantity: 0 })}
    >
      <ul>
        <StockListItemRow item={{ ...ROTI, quantity: 0 }} />
      </ul>
    </RowActionsProvider>,
  );
  expect(screen.getByText("Habis")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Ubah Roti Perjamuan" })
      .getAttribute("href"),
  ).toBe(stockEditHref("s2"));
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
  expect(persediaanTable(true).getRowActions?.(ROTI)?.edit?.href).toContain(
    "/edit/",
  );
  expect(persediaanTable(false).getRowActions?.(ROTI)?.edit).toBeUndefined();
  expect(persediaanTable(false).getRowActions?.(ROTI)?.view?.href).toBe(
    stockDetailHref("BRP-0002"),
  );
});
