import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { Announcement } from "../types";

import { PengumumanListItemRow, pengumumanTable } from "./list-item";

afterEach(cleanup);

const ROW: Announcement = {
  publicId: "b1",
  code: "PGM-2026-0001",
  category: "WARTA",
  title: "Warta Jemaat Minggu Ini",
  content: "Isi",
  publishDate: "2026-09-28T00:00:00.000Z",
  expiryDate: null,
  isPublished: true,
  isPinned: true,
  bapel: null,
  listImage: [],
  status: "TERBIT",
};

const onRenderRow = (isCanUpdate: boolean, announcement = ROW) =>
  render(
    <ul>
      <PengumumanListItemRow
        announcement={announcement}
        isCanUpdate={isCanUpdate}
      />
    </ul>,
  );

describe("baris HP", () => {
  test("disematkan: ikon + teks pembaca layar, meta kategori · tanggal, status, pensil", () => {
    onRenderRow(true);

    expect(screen.getByText("Disematkan:")).toBeTruthy();
    expect(screen.getByText("Warta · 28 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Terbit")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Ubah Warta Jemaat Minggu Ini" })
        .getAttribute("href"),
    ).toBe("/kegiatan/pengumuman/PGM-2026-0001/ubah");
  });

  test("biasa, berakhir, tanpa UPDATE", () => {
    onRenderRow(false, {
      ...ROW,
      isPinned: false,
      category: "BERITA_DUKA",
      expiryDate: "2026-10-04T00:00:00.000Z",
      status: "TERJADWAL",
    });

    expect(screen.queryByText("Disematkan:")).toBeNull();
    expect(
      screen.getByText("Berita duka · 28 Sep 2026 s.d. 4 Okt 2026"),
    ).toBeTruthy();
    expect(screen.getByText("Terjadwal")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("tabel", () => {
  test("kolom, proporsi fr, pelengkap, tautan hanya dengan UPDATE", () => {
    const table = pengumumanTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Judul", "minmax(0,3fr)", false],
      ["Kategori", "minmax(0,1.2fr)", false],
      ["Terbit", "minmax(0,1.1fr)", false],
      ["Berakhir", "minmax(0,1.1fr)", true],
      ["Untuk", "minmax(0,1.3fr)", true],
      ["Website", "minmax(0,0.8fr)", true],
      ["Status", "minmax(0,1fr)", false],
    ]);
    expect(table.getRowHref?.(ROW)).toBe(
      "/kegiatan/pengumuman/PGM-2026-0001/ubah",
    );
    expect(pengumumanTable(false).getRowHref).toBeUndefined();
  });

  test("berakhir kosong, untuk, dan website", () => {
    const cellOf = (header: string, row: Announcement) =>
      pengumumanTable(true)
        .columns.find((column) => column.header === header)
        ?.cell(row);

    render(
      <div>
        {cellOf("Berakhir", ROW)}
        {cellOf("Untuk", ROW)}
        {cellOf("Website", ROW)}
      </div>,
    );
    expect(screen.getByText("Tanpa tanggal berakhir")).toBeTruthy();
    expect(screen.getByText("Seluruh jemaat")).toBeTruthy();
    expect(screen.getByText("Ya")).toBeTruthy();

    cleanup();
    const komisi = {
      ...ROW,
      bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
    };
    render(
      <div>
        {cellOf("Untuk", komisi)}
        {cellOf("Website", komisi)}
      </div>,
    );
    expect(screen.getByText("Komisi Pemuda")).toBeTruthy();
    expect(screen.getByText("Tidak")).toBeTruthy();
  });
});
