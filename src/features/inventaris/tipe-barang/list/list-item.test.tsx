import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { TipeBarang } from "../types";

import { TipeBarangListItemRow, tipeBarangTable } from "./list-item";

afterEach(cleanup);

const TIPE: TipeBarang = {
  publicId: "p-1",
  code: "TYP_ITM-0001",
  name: "Elektronik",
  assetAccount: null,
  depreciationExpenseAccount: null,
  accumulatedDepreciationAccount: null,
  inventoryExpenseAccount: null,
};

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <RowActionsProvider
      value={tipeBarangTable(isCanUpdate).getRowActions?.(TIPE)}
    >
      <ul>
        <TipeBarangListItemRow tipeBarang={TIPE} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode tipe", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Elektronik" });
    expect(action.getAttribute("href")).toBe(
      "/inventory/item-category/edit/p-1",
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta = kode, baris ditandai kode untuk sorotan", () => {
    onRenderRow(true);

    expect(screen.getByText("TYP_ITM-0001")).toBeTruthy();
    expect(
      document.querySelector('[data-row-id="TYP_ITM-0001"]'),
    ).not.toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom Nama 2.5fr | Kode 1fr, ubah hanya dengan UPDATE", () => {
    const table = tipeBarangTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([
      ["Nama", "minmax(0,2.5fr)"],
      ["Kode", "minmax(0,1fr)"],
    ]);
    expect(table.getRowActions?.(TIPE)?.edit?.href).toBe(
      "/inventory/item-category/edit/p-1",
    );
    expect(
      tipeBarangTable(false).getRowActions?.(TIPE)?.edit?.href,
    ).toBeUndefined();
  });
});
