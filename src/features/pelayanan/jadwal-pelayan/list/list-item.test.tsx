import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { JadwalPelayan } from "../types";

import { JadwalPelayanListItemRow, jadwalPelayanTable } from "./list-item";

afterEach(cleanup);

const JADWAL: JadwalPelayan = {
  publicId: "pid-jdl-0001-2026-0002",
  code: "JDL_0001-2026-0002",
  name: "Pelayan Ibadah Minggu I",
  date: "2026-10-04T00:00:00.000Z",
  startTime: "07:30",
  endTime: "10:00",
  bapel: { name: "Majelis Jemaat" },
  detail: [
    { order: 1, role: "Liturgis", pelayan: "Andreas Sitanggang" },
    { order: 2, role: "Pemusik", pelayan: "" },
    { order: 3, role: "Singer", pelayan: "" },
  ],
  ibadah: [],
};

const FULL: JadwalPelayan = {
  ...JADWAL,
  detail: [JADWAL.detail[0]],
  ibadah: [
    {
      code: "IBD_1",
      date: JADWAL.date,
      startTime: "07:30",
      typeIbadah: { name: "Ibadah Minggu I" },
    },
    {
      code: "IBD_2",
      date: JADWAL.date,
      startTime: "08:00",
      typeIbadah: { name: "Ibadah Anak" },
    },
  ],
};

const onRenderRow = (jadwal: JadwalPelayan, isCanUpdate: boolean) =>
  render(
    <RowActionsProvider
      value={jadwalPelayanTable(isCanUpdate).getRowActions?.(jadwal)}
    >
      <ul>
        <JadwalPelayanListItemRow jadwal={jadwal} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris HP", () => {
  test("judul ke halaman baca, meta, slot belum diisi, pensil ke ubah", () => {
    onRenderRow(JADWAL, true);

    expect(
      screen
        .getByRole("link", { name: /^Lihat Pelayan Ibadah Minggu I/ })
        .getAttribute("href"),
    ).toBe("/pelayanan/jadwal-pelayan/JDL_0001-2026-0002");
    expect(
      screen.getByText("4 Okt 2026 · 07:30–10:00 · Majelis Jemaat"),
    ).toBeTruthy();
    expect(screen.getByText("2 slot belum diisi")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /^Ubah Pelayan Ibadah Minggu I/ })
        .getAttribute("href"),
    ).toBe("/pelayanan/jadwal-pelayan/edit/pid-jdl-0001-2026-0002");
  });

  test("lengkap; tanpa UPDATE tanpa pensil", () => {
    onRenderRow(FULL, false);

    expect(screen.getByText("Lengkap")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();
  });
});

describe("tabel", () => {
  test("kolom, proporsi fr, pelengkap; kolom pensil hanya dengan UPDATE", () => {
    const table = jadwalPelayanTable(false);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Tanggal", "minmax(0,1.2fr)", false],
      ["Nama", "minmax(0,2fr)", false],
      ["Badan pelayanan", "minmax(0,1.5fr)", false],
      ["Jam", "minmax(0,1fr)", false],
      ["Petugas", "minmax(0,1.2fr)", false],
      ["Ibadah", "minmax(0,1.5fr)", true],
      ["Kode", "minmax(0,1.2fr)", true],
    ]);
    expect(table.getRowActions?.(JADWAL)?.view?.href).toBe(
      "/pelayanan/jadwal-pelayan/JDL_0001-2026-0002",
    );
    expect(
      jadwalPelayanTable(true).getRowActions?.(JADWAL)?.edit?.href,
    ).toContain("/edit/");
    expect(
      jadwalPelayanTable(false).getRowActions?.(JADWAL)?.edit,
    ).toBeUndefined();
  });

  test("petugas singkat dan ibadah lebih dari satu → +1", () => {
    const columns = jadwalPelayanTable(false).columns;
    const cell = (key: string, jadwal: JadwalPelayan) =>
      columns.find((column) => column.key === key)?.cell(jadwal);

    render(
      <div>
        {cell("date", JADWAL)}
        {cell("petugas", JADWAL)}
        {cell("ibadah", FULL)}
      </div>,
    );

    expect(screen.getByText("Min, 4 Okt 2026")).toBeTruthy();
    expect(screen.getByText("2 belum diisi")).toBeTruthy();
    expect(screen.getByText("Ibadah Minggu I · 07:30 +1")).toBeTruthy();
  });
});
