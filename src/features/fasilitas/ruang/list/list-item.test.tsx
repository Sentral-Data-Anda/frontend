import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

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
      <RowActionsProvider value={ruangTable(false).getRowActions?.(ROOM)}>
        <ul>
          <RuangListItemRow room={ROOM} />
        </ul>
      </RowActionsProvider>,
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
      <RowActionsProvider
        value={ruangTable(true).getRowActions?.({ ...ROOM, isActive: false })}
      >
        <ul>
          <RuangListItemRow room={{ ...ROOM, isActive: false }} />
        </ul>
      </RowActionsProvider>,
    );

    expect(screen.getByText("Nonaktif")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Ubah Ruang Pemuda" })
        .getAttribute("href"),
    ).toBe(ruangEditHref("r3"));
  });
});

test("tabel: kolom aksi hanya dengan UPDATE; baris menuju halaman ruang", () => {
  expect(ruangTable(false).columns.map((column) => column.key)).toEqual([
    "room",
    "capacity",
    "status",
  ]);
  expect(ruangTable(true).getRowActions?.(ROOM)?.edit?.href).toContain(
    "/edit/",
  );
  expect(ruangTable(false).getRowActions?.(ROOM)?.edit).toBeUndefined();
  expect(ruangTable(false).getRowActions?.(ROOM)?.view?.href).toBe(
    ruangDetailHref("RM-0003"),
  );
});
