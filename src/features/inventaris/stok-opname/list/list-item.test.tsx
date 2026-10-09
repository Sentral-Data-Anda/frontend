import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { Opname } from "../types";

import { OpnameListItemRow, opnameTable } from "./list-item";

afterEach(cleanup);

const opname = (patch: Partial<Opname> = {}): Opname => ({
  publicId: "p5",
  code: "OPN-2026-0005",
  opnameDate: "2026-09-29T00:00:00.000Z",
  status: "DRAFT",
  roomId: 2,
  room: { publicId: "r2", code: "RM-0002", name: "Aula Serbaguna" },
  note: null,
  completedAt: null,
  postedAt: null,
  itemCount: 3,
  differenceCount: 1,
  ...patch,
});

const onRender = (row: Opname, isCanUpdate: boolean) =>
  render(
    <ul>
      <OpnameListItemRow opname={row} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("judul ruang, meta tanggal · barang · selisih, tautan ke halaman", () => {
    onRender(opname(), false);

    const link = screen.getByRole("link", { name: /Lihat stok opname Aula/ });

    expect(link.getAttribute("href")).toBe(
      "/inventory/stok-opname/OPN-2026-0005",
    );
    expect(
      screen.getByText("29 September 2026 · 3 barang · 1 selisih"),
    ).toBeTruthy();
    expect(screen.getByText("Draf")).toBeTruthy();
  });

  test("seluruh gereja bila tanpa ruang", () => {
    onRender(opname({ room: null, roomId: null }), false);

    expect(screen.getByText("Seluruh gereja")).toBeTruthy();
  });

  test("pensil hanya untuk Draf + UPDATE", () => {
    onRender(opname(), true);
    expect(
      screen
        .getByRole("link", { name: "Ubah stok opname OPN-2026-0005" })
        .getAttribute("href"),
    ).toBe("/inventory/stok-opname/OPN-2026-0005/ubah");
    cleanup();

    onRender(opname({ status: "COMPLETED" }), true);
    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
    cleanup();

    onRender(opname(), false);
    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });
});

test("tabel: kolom pensil hanya dengan UPDATE; baris ke halaman", () => {
  expect(opnameTable(false).columns.map((column) => column.key)).toEqual([
    "date",
    "code",
    "room",
    "items",
    "difference",
    "status",
  ]);
  expect(opnameTable(true).columns.at(-1)?.key).toBe("edit");
  expect(
    opnameTable(false)
      .columns.filter((column) => column.isSecondary)
      .map((column) => column.key),
  ).toEqual(["code"]);
  expect(opnameTable(false).getRowHref?.(opname())).toBe(
    "/inventory/stok-opname/OPN-2026-0005",
  );
});
