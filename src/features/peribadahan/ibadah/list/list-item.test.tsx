import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";

import type { Ibadah } from "../types";

import { IbadahListItemRow, ibadahTable } from "./list-item";

afterEach(cleanup);

const PAST = `${addDays(todayJakarta(), -7)}T00:00:00.000Z`;
const FUTURE = `${addDays(todayJakarta(), 7)}T00:00:00.000Z`;

const IBADAH: Ibadah = {
  code: "IBD_0001-2026-0010",
  date: "2026-09-20T00:00:00.000Z",
  startTime: "08:00",
  endTime: "09:30",
  theme: "Hidup dalam kasih karunia",
  bibleVerse: null,
  preacher: "Pdt. Yohanes Simatupang",
  maleCount: 132,
  femaleCount: 190,
  childCount: 49,
  note: null,
  typeIbadah: { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  bapel: null,
  jadwalPelayan: null,
};

const ZERO = { maleCount: 0, femaleCount: 0, childCount: 0 };

const onRenderRow = (isCanUpdate: boolean, ibadah = IBADAH) =>
  render(
    <ul>
      <IbadahListItemRow ibadah={ibadah} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("judul tipe, meta tanggal · jam mulai · tema, hadir, pensil ke kode", () => {
    onRenderRow(true);

    expect(screen.getByText("Ibadah Minggu I")).toBeTruthy();
    expect(
      screen.getByText(
        "Minggu, 20 Sep 2026 · 08.00 · Hidup dalam kasih karunia",
      ),
    ).toBeTruthy();
    expect(screen.getByText("371 hadir")).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Ubah Ibadah Minggu I, Minggu, 20 Sep 2026",
        })
        .getAttribute("href"),
    ).toBe("/peribadahan/ibadah/IBD_0001-2026-0010/ubah");
    expect(
      document.querySelector('[data-row-id="IBD_0001-2026-0010"]'),
    ).not.toBeNull();
  });

  test("tanpa UPDATE tidak ada pensil; tanpa tema meta berhenti di jam", () => {
    onRenderRow(false, { ...IBADAH, theme: null });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Minggu, 20 Sep 2026 · 08.00")).toBeTruthy();
  });

  test("0 lampau = Belum dicatat; 0 nanti tanpa label", () => {
    onRenderRow(true, { ...IBADAH, ...ZERO, date: PAST });
    expect(screen.getByText("Belum dicatat")).toBeTruthy();

    cleanup();
    onRenderRow(true, { ...IBADAH, ...ZERO, date: FUTURE });
    expect(screen.queryByText("Belum dicatat")).toBeNull();
    expect(screen.queryByText(/hadir/)).toBeNull();
  });
});

describe("tabel", () => {
  test("kolom, proporsi fr, pelengkap, dan tautan hanya dengan UPDATE", () => {
    const table = ibadahTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Tanggal", "minmax(0,1.8fr)", false],
      ["Jam", "minmax(0,1fr)", false],
      ["Tipe ibadah", "minmax(0,1.6fr)", false],
      ["Tema", "minmax(0,2fr)", false],
      ["Pengkhotbah", "minmax(0,1.5fr)", true],
      ["Ruang", "minmax(0,1.2fr)", true],
      ["Hadir", "minmax(0,1fr)", false],
    ]);
    expect(table.getRowHref?.(IBADAH)).toBe(
      "/peribadahan/ibadah/IBD_0001-2026-0010/ubah",
    );
    expect(ibadahTable(false).getRowHref).toBeUndefined();
  });

  test("hadir rata kanan; kosong nanti = — dengan teks pembaca layar", () => {
    const hadir = ibadahTable(true).columns.at(-1);

    expect(hadir?.align).toBe("end");

    render(<div>{hadir?.cell(IBADAH)}</div>);
    expect(screen.getByText("371 hadir")).toBeTruthy();

    cleanup();
    render(<div>{hadir?.cell({ ...IBADAH, ...ZERO, date: FUTURE })}</div>);
    expect(screen.getByText("Belum ada hitungan")).toBeTruthy();
  });

  test("jam dengan selesai dan tema kosong", () => {
    const [, jam, , tema] = ibadahTable(true).columns;

    render(
      <div>
        {jam.cell(IBADAH)}
        {tema.cell({ ...IBADAH, theme: null })}
      </div>,
    );

    expect(screen.getByText("08.00–09.30")).toBeTruthy();
    expect(screen.getByText("Tanpa tema")).toBeTruthy();
  });
});
