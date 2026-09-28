import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { PelayanListItem } from "../types";

import { PelayanListItemRow, daftarPelayanTable, jenisOf } from "./list-item";

afterEach(cleanup);

const BETHARI: PelayanListItem = {
  code: "PLYN_0001-0002",
  typePelayan: "INDIVIDUAL",
  namePelayan: "Bethari Ayu Kusuma",
  genderPelayan: null,
  bapel: "Majelis Jemaat",
  role: ["Pemusik", "Singer"],
  members: [],
  musikSkill: ["Keyboard"],
  status: true,
};

const BAND: PelayanListItem = {
  code: "GPLYN_0002-0001",
  typePelayan: "GROUP",
  namePelayan: "Band Pemuda",
  genderPelayan: null,
  bapel: "Komisi Pemuda",
  role: ["Pemusik"],
  members: ["Christian Wijaya", "Eleazar Panggabean", "Lidya Hutagalung"],
  musikSkill: ["Keyboard", "Gitar"],
  status: false,
};

const onRenderRow = (pelayan: PelayanListItem, isCanUpdate = true) =>
  render(
    <ul>
      <PelayanListItemRow pelayan={pelayan} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("perorangan aktif: meta badan pelayanan · tugas, tanpa badge", () => {
    onRenderRow(BETHARI);

    expect(screen.getByText("Majelis Jemaat · Pemusik, Singer")).toBeTruthy();
    expect(screen.queryByText("Kelompok")).toBeNull();
    expect(screen.queryByText("Nonaktif")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Ubah Bethari Ayu Kusuma" })
        .getAttribute("href"),
    ).toBe("/pelayanan/daftar-pelayan/PLYN_0001-0002/ubah");
  });

  test("kelompok nonaktif: badge Kelompok dan Nonaktif", () => {
    onRenderRow(BAND);

    expect(screen.getByText("Kelompok")).toBeTruthy();
    expect(screen.getByText("Nonaktif")).toBeTruthy();
    expect(
      document.querySelector('[data-row-id="GPLYN_0002-0001"]'),
    ).not.toBeNull();
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(BETHARI, false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom dan lebarnya; Jenis dan Kode pelengkap; ubah hanya dengan UPDATE", () => {
    const table = daftarPelayanTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Nama", "minmax(0,2fr)", false],
      ["Badan pelayanan", "minmax(0,1.5fr)", false],
      ["Tugas", "minmax(0,2fr)", false],
      ["Jenis", "minmax(0,1.3fr)", true],
      ["Kode", "minmax(0,1.2fr)", true],
      ["Status", "minmax(0,1fr)", false],
    ]);
    expect(table.getRowHref?.(BAND)).toBe(
      "/pelayanan/daftar-pelayan/GPLYN_0002-0001/ubah",
    );
    expect(daftarPelayanTable(false).getRowHref).toBeUndefined();
  });

  test("jenis: Perorangan, atau Kelompok dengan jumlah anggota", () => {
    expect(jenisOf(BETHARI)).toBe("Perorangan");
    expect(jenisOf(BAND)).toBe("Kelompok · 3 anggota");
  });
});
