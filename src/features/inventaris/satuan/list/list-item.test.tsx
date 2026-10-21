import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

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
    <RowActionsProvider
      value={satuanTable(isCanUpdate).getRowActions?.(SATUAN_ROW)}
    >
      <ul>
        <SatuanListItemRow satuan={SATUAN_ROW} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode satuan", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Buah" });
    expect(action.getAttribute("href")).toBe("/inventory/satuan/edit/p-1");
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
    expect(table.getRowActions?.(SATUAN_ROW)?.edit?.href).toBe(
      "/inventory/satuan/edit/p-1",
    );
    expect(
      satuanTable(false).getRowActions?.(SATUAN_ROW)?.edit?.href,
    ).toBeUndefined();
  });
});
