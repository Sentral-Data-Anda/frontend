import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { Wilayah } from "../types";

import { WilayahListItemRow, wilayahTable } from "./list-item";

afterEach(cleanup);

const WILAYAH: Wilayah = {
  id: 1,
  publicId: "6f1c2a7e-6c1a-4f2e-9b4a-2d9a8c3e5f10",
  code: "ZC-0001",
  name: "Wilayah I",
  isActive: true,
};

const onRenderRow = (isCanUpdate: boolean, wilayah = WILAYAH) =>
  render(
    <RowActionsProvider
      value={wilayahTable(isCanUpdate).getRowActions?.(wilayah)}
    >
      <ul>
        <WilayahListItemRow wilayah={wilayah} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute publicId, bukan kode", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Wilayah I" });
    expect(action.getAttribute("href")).toBe(
      "/kejemaatan/wilayah/edit/6f1c2a7e-6c1a-4f2e-9b4a-2d9a8c3e5f10",
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta kode; Aktif tanpa badge, Nonaktif dengan badge", () => {
    onRenderRow(true);

    expect(screen.getByText("ZC-0001")).toBeTruthy();
    expect(document.querySelector('[data-row-id="ZC-0001"]')).not.toBeNull();
    expect(screen.queryByText("Aktif")).toBeNull();

    cleanup();
    onRenderRow(true, { ...WILAYAH, isActive: false });
    expect(screen.getByText("Nonaktif")).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom Nama 2fr | Kode 1fr | Status 1fr, ubah hanya dengan UPDATE", () => {
    const table = wilayahTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([
      ["Nama", "minmax(0,2fr)"],
      ["Kode", "minmax(0,1fr)"],
      ["Status", "minmax(0,1fr)"],
    ]);
    expect(table.columns.some((column) => column.isSecondary)).toBe(false);
    expect(table.getRowActions?.(WILAYAH)?.edit?.href).toBe(
      "/kejemaatan/wilayah/edit/6f1c2a7e-6c1a-4f2e-9b4a-2d9a8c3e5f10",
    );
    expect(
      wilayahTable(false).getRowActions?.(WILAYAH)?.edit?.href,
    ).toBeUndefined();
  });
});
