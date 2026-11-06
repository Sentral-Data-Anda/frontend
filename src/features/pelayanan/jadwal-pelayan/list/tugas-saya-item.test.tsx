import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { todayJakarta } from "@/lib/date";

import type { TugasSayaItem } from "../api";

import {
  TugasSayaListItemRow,
  tugasSayaKeyOf,
  tugasSayaTable,
} from "./tugas-saya-item";

afterEach(cleanup);

const ITEM: TugasSayaItem = {
  date: "2026-10-04T00:00:00.000Z",
  startTime: "07:30",
  endTime: "10:00",
  jadwal: { code: "JDL_0001-2026-0002", name: "Pelayan Ibadah Minggu I" },
  bapel: { name: "Majelis Jemaat" },
  role: { name: "Pemusik" },
  musikSkill: { name: "Keyboard" },
  group: { name: "Band Pemuda" },
  ibadah: [{ code: "IBD_1", typeIbadah: { name: "Ibadah Minggu I" } }],
};

const renderRow = (item: TugasSayaItem = ITEM) =>
  render(
    <ul>
      <TugasSayaListItemRow item={item} />
    </ul>,
  );

describe("baris tugas saya", () => {
  test("tugas + alat jadi judul, kelompok ditandai, meta menyebut tanggal, jam, tempat, bapel", () => {
    renderRow();

    expect(
      screen
        .getByRole("link", { name: /^Lihat jadwal Pelayan Ibadah Minggu I/ })
        .getAttribute("href"),
    ).toBe("/pelayanan/jadwal-pelayan/JDL_0001-2026-0002");
    expect(screen.getByText("Pemusik · Keyboard")).toBeTruthy();
    expect(screen.getByText("Band Pemuda")).toBeTruthy();
    expect(
      screen.getByText(
        "Minggu, 4 Okt 2026 · 07:30–10:00 · Ibadah Minggu I · Majelis Jemaat",
      ),
    ).toBeTruthy();
  });

  test("tanpa langit-langit tugas memakai nama jadwal dan tanpa kelompok", () => {
    renderRow({ ...ITEM, musikSkill: null, group: null, ibadah: [] });

    expect(screen.getByText("Pemusik")).toBeTruthy();
    expect(
      screen.getByText(
        "Minggu, 4 Okt 2026 · 07:30–10:00 · Pelayan Ibadah Minggu I · Majelis Jemaat",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Band Pemuda")).toBeNull();
  });

  test("badge Hari ini hanya untuk tanggal hari ini", () => {
    renderRow({ ...ITEM, date: `${todayJakarta()}T00:00:00.000Z` });

    expect(screen.getByText("Hari ini")).toBeTruthy();
  });

  test("kunci baris membedakan tugas di jadwal dan jam yang sama", () => {
    const other = { ...ITEM, role: { name: "Liturgis" } };

    expect(tugasSayaKeyOf(ITEM)).not.toBe(tugasSayaKeyOf(other));
  });
});

describe("tabel", () => {
  test("kolom, proporsi fr, dan aksi lihat ke halaman baca", () => {
    const table = tugasSayaTable;

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Tanggal", "minmax(0,1.5fr)", false],
      ["Jam", "minmax(0,0.9fr)", false],
      ["Tugas", "minmax(0,1.6fr)", false],
      ["Tempat", "minmax(0,1.6fr)", false],
      ["Badan pelayanan", "minmax(0,1.5fr)", false],
    ]);
    expect(table.getRowActions?.(ITEM)?.view?.href).toBe(
      "/pelayanan/jadwal-pelayan/JDL_0001-2026-0002",
    );
    expect(table.getRowActions?.(ITEM)?.label).toBe(
      "Lihat jadwal Pelayan Ibadah Minggu I, Minggu, 4 Okt 2026",
    );
  });

  test("sel tanggal menandai hari ini dan sel tugas memuat kelompok", () => {
    const columns = tugasSayaTable.columns;
    const cell = (key: string, item: TugasSayaItem) =>
      columns.find((column) => column.key === key)?.cell(item);

    render(
      <div>
        {cell("date", { ...ITEM, date: `${todayJakarta()}T00:00:00.000Z` })}
        {cell("role", ITEM)}
      </div>,
    );

    expect(screen.getByText("Hari ini")).toBeTruthy();
    expect(screen.getByText("Pemusik · Keyboard")).toBeTruthy();
    expect(screen.getByText("Band Pemuda")).toBeTruthy();
  });
});
