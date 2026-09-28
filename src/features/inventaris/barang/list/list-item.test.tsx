import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { barangDetailHref, barangEditHref } from "../model";
import type { Asset } from "../types";

import { BarangListItemRow, barangTable } from "./list-item";

afterEach(cleanup);

const ASSET: Asset = {
  publicId: "a1",
  code: "AST_0003_0001-0001",
  name: "Kursi Lipat Chitose",
  description: "Kursi lipat.",
  serialNumber: null,
  condition: "BAIK",
  acquisitionSource: "PURCHASE",
  donorName: null,
  acquisitionDate: null,
  acquisitionCost: "350000.00",
  warrantyUntil: null,
  isDepreciable: false,
  salvageValue: null,
  usefulLifeMonths: null,
  depreciationStartDate: null,
  openingAccumulatedDepreciation: null,
  openingAccumulatedAsOf: null,
  type: { id: 3, code: "TYP_ITM-0003", name: "Mebel" },
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  room: { id: 2, code: "RM-0002", name: "Aula Serbaguna" },
  mainImage: null,
  status: "AKTIF",
  disposal: null,
};

const onRenderRow = (asset: Asset, isCanUpdate = false) =>
  render(
    <ul>
      <BarangListItemRow asset={asset} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris barang", () => {
  test("judul menuju halaman barang; meta tipe + ruang; status kondisi", () => {
    onRenderRow({ ...ASSET, condition: "RUSAK_BERAT" });

    expect(
      screen
        .getByRole("link", { name: "Lihat barang Kursi Lipat Chitose" })
        .getAttribute("href"),
    ).toBe(barangDetailHref(ASSET.code));
    expect(screen.getByText("Mebel · Aula Serbaguna")).toBeTruthy();
    expect(screen.getByText("Rusak berat")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();
  });

  test("pensil hanya dengan UPDATE dan barang Aktif", () => {
    onRenderRow(ASSET, true);
    expect(
      screen
        .getByRole("link", { name: "Ubah Kursi Lipat Chitose" })
        .getAttribute("href"),
    ).toBe(barangEditHref(ASSET.code));

    cleanup();
    onRenderRow({ ...ASSET, status: "MENUNGGU_PELEPASAN" }, true);
    expect(screen.getByText("Menunggu pelepasan")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();

    cleanup();
    onRenderRow({ ...ASSET, status: "DILEPAS" }, true);
    expect(screen.getByText("Dilepas")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();
  });
});

test("tabel: badan pelayanan pelengkap; kolom aksi hanya dengan UPDATE", () => {
  const columns = barangTable(false).columns;

  expect(columns.map((column) => column.key)).toEqual([
    "asset",
    "type",
    "room",
    "bapel",
    "status",
  ]);
  expect(columns.find((column) => column.key === "bapel")?.isSecondary).toBe(
    true,
  );
  expect(barangTable(true).columns.at(-1)?.key).toBe("edit");
  expect(barangTable(false).getRowHref?.(ASSET)).toBe(
    barangDetailHref(ASSET.code),
  );
});
