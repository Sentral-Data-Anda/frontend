import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { TipeCuti } from "../types";

import { TipeCutiListItemRow, tipeCutiTable } from "./list-item";

afterEach(cleanup);

const ROW: TipeCuti = {
  id: 1,
  publicId: "p-1",
  code: "TCT-0001",
  name: "Cuti Tahunan",
  maxDaysPerYear: 12,
  isPaid: true,
  isActive: true,
};

const UNLIMITED: TipeCuti = {
  ...ROW,
  id: 3,
  publicId: "p-3",
  code: "TCT-0003",
  name: "Cuti Melahirkan",
  maxDaysPerYear: null,
};

const onRenderRow = (tipeCuti: TipeCuti, isCanUpdate: boolean) =>
  render(
    <ul>
      <TipeCutiListItemRow tipeCuti={tipeCuti} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode", () => {
    onRenderRow(ROW, true);

    expect(
      screen
        .getByRole("link", { name: "Ubah Cuti Tahunan" })
        .getAttribute("href"),
    ).toBe("/sdm/tipe-cuti/TCT-0001/ubah");
  });

  test("tanpa UPDATE: tidak ada aksi ubah, status tetap tampil", () => {
    onRenderRow(ROW, false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
    expect(screen.getByText("Aktif")).toBeTruthy();
  });

  test("meta = kode · jatah · dibayar, baris ditandai kode", () => {
    onRenderRow(ROW, true);

    expect(screen.getByText("TCT-0001 · 12 hari · Dibayar")).toBeTruthy();
    expect(document.querySelector('[data-row-id="TCT-0001"]')).not.toBeNull();
  });

  test("jatah null berbunyi Tanpa batas, bukan kosong", () => {
    onRenderRow(UNLIMITED, true);

    const meta = screen.getByText(/TCT-0003/);
    expect(meta.textContent).toBe("TCT-0003 · Tanpa batas · Dibayar");
    expect(meta.textContent).not.toContain("—");
  });

  test("tidak aktif memakai chip netral dengan teksnya", () => {
    onRenderRow({ ...ROW, isActive: false }, true);

    expect(screen.getByText("Tidak aktif")).toBeTruthy();
    expect(screen.queryByText("Aktif")).toBeNull();
  });

  test("tidak dibayar terbaca di meta", () => {
    onRenderRow({ ...ROW, isPaid: false }, true);

    expect(screen.getByText(/Tidak dibayar/)).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("lima kolom, semua fr proporsional, Dibayar sekunder", () => {
    const table = tipeCutiTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        column.isSecondary ?? false,
      ]),
    ).toEqual([
      ["Nama", "minmax(0,2.5fr)", false],
      ["Kode", "minmax(0,1fr)", false],
      ["Jatah / tahun", "minmax(0,1.2fr)", false],
      ["Dibayar", "minmax(0,1fr)", true],
      ["Status", "minmax(0,1fr)", false],
    ]);
  });

  test("tidak ada kolom yang dikunci rem", () => {
    const columns = tipeCutiTable(true).columns;
    // `?? ""` akan membuat kolom tanpa narrowWidth lolos tanpa diperiksa:
    // dinyatakan per kolom, dan kolom sekunder memang sengaja tidak punya.
    const narrow = columns.filter((column) => !column.isSecondary);

    expect(narrow).toHaveLength(4);
    for (const column of columns) {
      expect(column.width).toContain("fr)");
      expect(column.width).not.toContain("rem");
    }
    for (const column of narrow) {
      expect(typeof column.narrowWidth).toBe("string");
      expect(column.narrowWidth).toContain("fr)");
      expect(column.narrowWidth).not.toContain("rem");
    }
    for (const column of columns.filter((item) => item.isSecondary)) {
      expect(column.narrowWidth).toBeUndefined();
    }
  });

  test("tautan baris hanya dengan UPDATE", () => {
    expect(tipeCutiTable(true).getRowHref?.(ROW)).toBe(
      "/sdm/tipe-cuti/TCT-0001/ubah",
    );
    expect(tipeCutiTable(false).getRowHref).toBeUndefined();
  });

  test("sel jatah dan status merender teks yang sama dengan baris HP", () => {
    const table = tipeCutiTable(true);
    const quota = table.columns.find(
      (column) => column.key === "maxDaysPerYear",
    );

    render(<>{quota?.cell(UNLIMITED)}</>);
    expect(screen.getByText("Tanpa batas")).toBeTruthy();
  });
});
