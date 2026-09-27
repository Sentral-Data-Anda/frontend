import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { TipeIbadah } from "../types";

import { TipeIbadahListItemRow, tipeIbadahTable } from "./list-item";

afterEach(cleanup);

const TIPE: TipeIbadah = {
  code: "TYP_IBD-0001",
  name: "Ibadah Minggu I",
  isActive: true,
};

const onRenderRow = (isCanUpdate: boolean, tipeIbadah = TIPE) =>
  render(
    <ul>
      <TipeIbadahListItemRow
        tipeIbadah={tipeIbadah}
        isCanUpdate={isCanUpdate}
      />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode tipe", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Ibadah Minggu I" });
    expect(action.getAttribute("href")).toBe(
      "/peribadahan/tipe-ibadah/TYP_IBD-0001/ubah",
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta kode; Aktif tanpa badge, Nonaktif dengan badge", () => {
    onRenderRow(true);

    expect(screen.getByText("TYP_IBD-0001")).toBeTruthy();
    expect(
      document.querySelector('[data-row-id="TYP_IBD-0001"]'),
    ).not.toBeNull();
    expect(screen.queryByText("Aktif")).toBeNull();

    cleanup();
    onRenderRow(true, { ...TIPE, isActive: false });
    expect(screen.getByText("Nonaktif")).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom Nama 2fr | Kode 1fr | Status 1fr, ubah hanya dengan UPDATE", () => {
    const table = tipeIbadahTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([
      ["Nama", "minmax(0,2fr)"],
      ["Kode", "minmax(0,1fr)"],
      ["Status", "minmax(0,1fr)"],
    ]);
    expect(table.columns.some((column) => column.isSecondary)).toBe(false);
    expect(table.getRowHref?.(TIPE)).toBe(
      "/peribadahan/tipe-ibadah/TYP_IBD-0001/ubah",
    );
    expect(tipeIbadahTable(false).getRowHref).toBeUndefined();
  });
});
