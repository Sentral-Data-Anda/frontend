import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { RoleJemaatItem } from "../types";

import { RoleJemaatListItemRow, roleJemaatTable } from "./list-item";

afterEach(cleanup);

const ROLE: RoleJemaatItem = {
  id: 42,
  publicId: "abc",
  name: "Sekretaris",
  startPeriode: "2025-01-01T00:00:00.000Z",
  endPeriode: "2026-12-31T00:00:00.000Z",
  status: true,
  jemaat: { id: 4, code: "JMT-0004", name: "Debora Manurung" },
  bapel: { id: 2, code: "BPL-0002", name: "Komisi Pemuda" },
};

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <RoleJemaatListItemRow role={ROLE} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("judul nama jemaat, meta jabatan · bapel, status teks", () => {
    onRenderRow(false);

    expect(screen.getByText("Debora Manurung")).toBeTruthy();
    expect(screen.getByText("Sekretaris · Komisi Pemuda")).toBeTruthy();
    expect(screen.getByText("Aktif")).toBeTruthy();
  });

  test("dengan UPDATE: tautan ubah menunjuk rute id angka", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", {
      name: "Ubah Sekretaris Debora Manurung",
    });
    expect(action.getAttribute("href")).toBe("/kejemaatan/role-jemaat/42/ubah");
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("baris membawa id supaya bisa disorot saat kembali", () => {
    onRenderRow(true);

    expect(document.querySelector('[data-row-id="42"]')).not.toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom sesuai brief; periode hanya di tabel lebar", () => {
    const table = roleJemaatTable(true);

    expect(table.columns.map((column) => column.header)).toEqual([
      "Jemaat",
      "Jabatan",
      "Badan pelayanan",
      "Periode",
      "Status",
    ]);
    expect(
      table.columns
        .filter((column) => column.isSecondary)
        .map((column) => column.key),
    ).toEqual(["periode"]);
    expect(table.getRowHref?.(ROLE)).toBe("/kejemaatan/role-jemaat/42/ubah");
  });

  test("tanpa UPDATE: baris tabel tidak bisa dibuka", () => {
    expect(roleJemaatTable(false).getRowHref).toBeUndefined();
  });
});
