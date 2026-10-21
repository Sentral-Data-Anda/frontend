import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { Keluarga } from "../types";

import { KeluargaListItemRow, keluargaTable } from "./list-item";

afterEach(cleanup);

const KELUARGA: Keluarga = {
  id: 12,
  publicId: "10000000-0000-4000-8000-000000000012",
  code: "KK-0012",
  name: "Keluarga Sitompul",
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Merdeka 10",
  zoneChurchId: 2,
  worshipsHere: true,
  zoneChurch: { id: 2, code: "ZON-2", name: "Wilayah II" },
  _count: { members: 4 },
};

const onRenderRow = (isCanUpdate: boolean, keluarga = KELUARGA) =>
  render(
    <RowActionsProvider
      value={keluargaTable(isCanUpdate).getRowActions?.(keluarga)}
    >
      <ul>
        <KeluargaListItemRow keluarga={keluarga} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris keluarga di HP", () => {
  test("meta: kode, jumlah anggota, wilayah", () => {
    onRenderRow(false);

    expect(screen.getByText("KK-0012 · 4 anggota · Wilayah II")).toBeTruthy();
  });

  test("tanpa wilayah: meta tidak menyisakan pemisah", () => {
    onRenderRow(false, { ...KELUARGA, zoneChurchId: null, zoneChurch: null });

    expect(screen.getByText("KK-0012 · 4 anggota")).toBeTruthy();
  });

  test("dengan UPDATE: tautan ubah menunjuk rute kode keluarga", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", {
      name: "Ubah Keluarga Sitompul",
    });
    expect(action.getAttribute("href")).toBe(
      "/kejemaatan/keluarga/edit/10000000-0000-4000-8000-000000000012",
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("baris membawa id supaya bisa disorot saat kembali", () => {
    onRenderRow(true);

    expect(document.querySelector('[data-row-id="KK-0012"]')).not.toBeNull();
  });
});

describe("keluargaTable", () => {
  test("kolom sesuai brief; hanya Beribadah di sini yang sekunder", () => {
    const { columns } = keluargaTable(true);

    expect(columns.map((column) => column.header)).toEqual([
      "Nama",
      "Kode",
      "Wilayah",
      "Anggota",
      "Beribadah di sini",
    ]);
    expect(
      columns.filter((column) => column.isSecondary).map((c) => c.key),
    ).toEqual(["worshipsHere"]);
  });

  test("tanpa UPDATE: baris tabel bukan tautan", () => {
    expect(
      keluargaTable(false).getRowActions?.(KELUARGA)?.edit?.href,
    ).toBeUndefined();
    expect(keluargaTable(true).getRowActions?.(KELUARGA)?.edit?.href).toBe(
      "/kejemaatan/keluarga/edit/10000000-0000-4000-8000-000000000012",
    );
  });
});
