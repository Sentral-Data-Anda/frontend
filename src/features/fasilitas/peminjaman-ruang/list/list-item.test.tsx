import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";

import type { LoanRoom } from "../types";

import { LoanListItemRow, peminjamanTable } from "./list-item";

afterEach(cleanup);

const FUTURE = addDays(todayJakarta(), 5);

const LOAN: LoanRoom = {
  publicId: "p-1",
  code: "LR_0001_0000-2026-0002",
  date: `${FUTURE}T00:00:00.000Z`,
  startTime: "10:00",
  endTime: "13:00",
  purpose: "Pemberkatan nikah",
  room: { code: "RM-0001", name: "Gedung Gereja" },
  bapel: null,
  jemaat: { code: "JMT-0008", name: "Hanna Simorangkir" },
};

const onRenderRow = (loan: LoanRoom, isCanUpdate: boolean) =>
  render(
    <ul>
      <LoanListItemRow loan={loan} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("judul keperluan, meta tanggal · jam · ruang, status, tautan ubah ke kode", () => {
    onRenderRow(LOAN, true);

    expect(screen.getByText("Pemberkatan nikah")).toBeTruthy();
    expect(screen.getByText(/ · 10\.00–13\.00 · Gedung Gereja$/)).toBeTruthy();
    expect(screen.getByText("Akan datang")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /^Ubah Pemberkatan nikah/ })
        .getAttribute("href"),
    ).toBe("/fasilitas/peminjaman-ruang/LR_0001_0000-2026-0002/ubah");
  });

  test("lampau = Selesai dan tautan Lihat; tanpa UPDATE tanpa tautan", () => {
    const past = { ...LOAN, date: `${addDays(todayJakarta(), -2)}T00:00:00Z` };

    onRenderRow(past, true);
    expect(screen.getByText("Selesai")).toBeTruthy();
    expect(screen.getByRole("link", { name: /^Lihat / })).toBeTruthy();

    cleanup();
    onRenderRow(LOAN, false);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("tabel", () => {
  test("kolom, proporsi, pelengkap, dan Pribadi untuk tanpa badan pelayanan", () => {
    const table = peminjamanTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Waktu", "minmax(0,1.4fr)", false],
      ["Ruang", "minmax(0,1.2fr)", false],
      ["Keperluan", "minmax(0,2.2fr)", false],
      ["Badan pelayanan", "minmax(0,1.2fr)", true],
      ["Peminjam", "minmax(0,1.2fr)", true],
      ["Status", "minmax(0,0.9fr)", false],
    ]);

    const bapel = table.columns[3];

    render(
      <div>
        {bapel.cell(LOAN)}
        {bapel.cell({
          ...LOAN,
          bapel: { code: "BPL-5", name: "Komisi Musik" },
        })}
      </div>,
    );
    expect(screen.getByText("Pribadi")).toBeTruthy();
    expect(screen.getByText("Komisi Musik")).toBeTruthy();
    expect(peminjamanTable(false).getRowHref).toBeUndefined();
  });
});
