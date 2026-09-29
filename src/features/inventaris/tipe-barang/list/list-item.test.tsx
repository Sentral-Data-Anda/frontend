import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { TipeBarang } from "../types";

import { TipeBarangListItemRow, tipeBarangTable } from "./list-item";

afterEach(cleanup);

const TIPE: TipeBarang = {
  publicId: "p-1",
  code: "TYP_ITM-0001",
  name: "Elektronik",
};

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <TipeBarangListItemRow tipeBarang={TIPE} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode tipe", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Elektronik" });
    expect(action.getAttribute("href")).toBe(
      "/inventaris/tipe-barang/TYP_ITM-0001/ubah",
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
    expect(table.getRowHref?.(TIPE)).toBe(
      "/inventaris/tipe-barang/TYP_ITM-0001/ubah",
    );
    expect(tipeBarangTable(false).getRowHref).toBeUndefined();
  });
});
