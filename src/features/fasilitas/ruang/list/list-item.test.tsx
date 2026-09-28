import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ruangDetailHref, ruangEditHref } from "../model";
import type { Room } from "../types";

import { RuangListItemRow, ruangTable } from "./list-item";

afterEach(cleanup);

const ROOM: Room = {
  publicId: "r3",
  code: "RM-0003",
  name: "Ruang Pemuda",
  capacity: 30,
  isActive: true,
  mainImage: null,
};

describe("baris ruang", () => {
  test("judul menuju halaman ruang; meta kapasitas + kode; status Aktif", () => {
    render(
      <ul>
        <RuangListItemRow room={ROOM} />
      </ul>,
    );

    expect(
      screen
        .getByRole("link", { name: "Lihat ruang Ruang Pemuda" })
        .getAttribute("href"),
    ).toBe(ruangDetailHref("RM-0003"));
    expect(screen.getByText("30 orang · RM-0003")).toBeTruthy();
    expect(screen.getByText("Aktif")).toBeTruthy();
    expect(screen.getByText("Ruang Pemuda tanpa gambar")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Ubah Ruang Pemuda" }),
    ).toBeNull();
  });

  test("ruang nonaktif; pensil hanya dengan UPDATE", () => {
    render(
      <ul>
        <RuangListItemRow room={{ ...ROOM, isActive: false }} isCanUpdate />
      </ul>,
    );

    expect(screen.getByText("Nonaktif")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Ubah Ruang Pemuda" })
        .getAttribute("href"),
    ).toBe(ruangEditHref("RM-0003"));
  });
});

test("tabel: kolom aksi hanya dengan UPDATE; baris menuju halaman ruang", () => {
  expect(ruangTable(false).columns.map((column) => column.key)).toEqual([
    "room",
    "capacity",
    "status",
  ]);
  expect(ruangTable(true).columns.at(-1)?.key).toBe("edit");
  expect(ruangTable(false).getRowHref?.(ROOM)).toBe(ruangDetailHref("RM-0003"));
});
