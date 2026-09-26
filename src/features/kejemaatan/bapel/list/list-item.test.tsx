import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { BapelListItem } from "../types";

import { BapelListItemRow, bapelTable } from "./list-item";

afterEach(cleanup);

const BAPEL: BapelListItem = {
  id: 1,
  publicId: "a",
  code: "BPL-0001",
  name: "Komisi Pemuda",
  rules: [
    {
      id: 1,
      publicId: "r",
      type: "NO_DAY",
      dayOfWeek: 0,
      date: null,
      startTime: null,
      endTime: null,
      weekOfMonth: null,
    },
  ],
};

const onRenderRow = (isCanUpdate: boolean, bapel = BAPEL) =>
  render(
    <ul>
      <BapelListItemRow bapel={bapel} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode bapel", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Komisi Pemuda" });
    expect(action.getAttribute("href")).toBe("/kejemaatan/bapel/BPL-0001/ubah");
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta: kode dan jumlah aturan; baris membawa id sorot", () => {
    onRenderRow(true);

    expect(screen.getByText("BPL-0001 · 1 aturan")).toBeTruthy();
    expect(document.querySelector('[data-row-id="BPL-0001"]')).not.toBeNull();
  });

  test("tanpa aturan: meta menyebut tanpa aturan", () => {
    onRenderRow(true, { ...BAPEL, rules: [] });

    expect(screen.getByText("BPL-0001 · Tanpa aturan")).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom Nama | Kode | Larangan jadwal, semua tampil di tablet, ubah hanya dengan UPDATE", () => {
    const table = bapelTable(true);

    expect(table.columns.map((column) => column.header)).toEqual([
      "Nama",
      "Kode",
      "Larangan jadwal",
    ]);
    expect(table.columns.some((column) => column.isSecondary)).toBe(false);
    expect(table.getRowHref?.(BAPEL)).toBe("/kejemaatan/bapel/BPL-0001/ubah");
    expect(bapelTable(false).getRowHref).toBeUndefined();
  });
});
