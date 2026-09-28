import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { RolePelayan } from "../types";

import { RolePelayanListItemRow, rolePelayanTable } from "./list-item";

afterEach(cleanup);

const LITURGIS: RolePelayan = { id: 1, name: "Liturgis" };
const PEMUSIK: RolePelayan = { id: 2, name: "Pemusik" };

const onRenderRow = (isCanUpdate: boolean, rolePelayan = LITURGIS) =>
  render(
    <ul>
      <RolePelayanListItemRow
        rolePelayan={rolePelayan}
        isCanUpdate={isCanUpdate}
      />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: pensil menunjuk rute id, tanpa meta", () => {
    onRenderRow(true);

    expect(
      screen.getByRole("link", { name: "Ubah Liturgis" }).getAttribute("href"),
    ).toBe("/pelayanan/role-pelayan/1/ubah");
    expect(document.querySelector('[data-row-id="1"]')).not.toBeNull();
    expect(screen.queryByText(/alat musik/)).toBeNull();
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(false);

    expect(screen.getByText("Liturgis")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("Pemusik: meta menjelaskan pemakaiannya oleh sistem", () => {
    onRenderRow(true, PEMUSIK);

    expect(
      screen.getByText("Dipakai untuk memilih alat musik di jadwal"),
    ).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("satu kolom Nama 1fr; tautan baris hanya dengan UPDATE", () => {
    const table = rolePelayanTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([["Nama", "minmax(0,1fr)"]]);
    expect(table.getRowHref?.(LITURGIS)).toBe("/pelayanan/role-pelayan/1/ubah");
    expect(rolePelayanTable(false).getRowHref).toBeUndefined();
  });
});
