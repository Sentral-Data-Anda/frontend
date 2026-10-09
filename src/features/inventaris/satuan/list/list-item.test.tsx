import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { Satuan } from "../types";

import { SatuanListItemRow, satuanTable } from "./list-item";

afterEach(cleanup);

const SATUAN_ROW: Satuan = {
  publicId: "p-1",
  code: "UNT-0001",
  name: "Buah",
};

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <SatuanListItemRow satuan={SATUAN_ROW} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode satuan", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Buah" });
    expect(action.getAttribute("href")).toBe("/inventory/satuan/UNT-0001/ubah");
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta = kode, baris ditandai kode untuk sorotan", () => {
    onRenderRow(true);

    expect(screen.getByText("UNT-0001")).toBeTruthy();
    expect(document.querySelector('[data-row-id="UNT-0001"]')).not.toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom Nama 2.5fr | Kode 1fr, ubah hanya dengan UPDATE", () => {
    const table = satuanTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([
      ["Nama", "minmax(0,2.5fr)"],
      ["Kode", "minmax(0,1fr)"],
    ]);
    expect(table.getRowHref?.(SATUAN_ROW)).toBe(
      "/inventory/satuan/UNT-0001/ubah",
    );
    expect(satuanTable(false).getRowHref).toBeUndefined();
  });
});
