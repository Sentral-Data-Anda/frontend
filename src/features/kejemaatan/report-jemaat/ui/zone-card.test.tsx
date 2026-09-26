import type { UseQueryResult } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { ZoneReport } from "../model";

const access = { isCanView: false };

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => access,
}));

const { ZoneCard } = await import("./zone-card");

afterEach(cleanup);

const queryOf = (data: ZoneReport) =>
  ({
    data,
    isPending: false,
    isFetching: false,
    error: null,
    refetch: () => {},
  }) as unknown as UseQueryResult<ZoneReport>;

const REPORT: ZoneReport = {
  rows: [
    {
      zoneChurchId: 1,
      code: "ZC-0001",
      name: "Wilayah I",
      isActive: true,
      anggota: 120,
      simpatisan: 14,
      keluarga: 41,
    },
    {
      zoneChurchId: null,
      code: null,
      name: null,
      isActive: null,
      anggota: 3,
      simpatisan: 9,
      keluarga: 2,
    },
  ],
  total: { anggota: 123, simpatisan: 23, keluarga: 43 },
  isEmpty: false,
};

const hrefs = () =>
  screen.queryAllByRole("link").map((link) => link.getAttribute("href"));

describe("tautan ke Daftar Jemaat", () => {
  test("dengan izin: wilayah bertautan, tanpa wilayah dan total tidak", () => {
    access.isCanView = true;
    render(<ZoneCard query={queryOf(REPORT)} />);

    expect(new Set(hrefs())).toEqual(
      new Set(["/kejemaatan/daftar-jemaat?wilayah=1"]),
    );
    expect(
      screen.getAllByRole("link", { name: "Lihat jemaat Wilayah I" }),
    ).not.toHaveLength(0);
  });

  test("tanpa izin: nama berupa teks biasa", () => {
    access.isCanView = false;
    render(<ZoneCard query={queryOf(REPORT)} />);

    expect(hrefs()).toEqual([]);
    expect(screen.getAllByText("Wilayah I")).not.toHaveLength(0);
  });
});

test("baris total menjumlah per kolom", () => {
  render(<ZoneCard query={queryOf(REPORT)} />);

  const cells = screen
    .getAllByRole("row")
    .at(-1)
    ?.querySelectorAll('[role="cell"]');

  expect([...(cells ?? [])].map((cell) => cell.textContent)).toEqual([
    "Total",
    "123",
    "23",
    "43",
  ]);
});

test("semua nol: keadaan kosong", () => {
  render(<ZoneCard query={queryOf({ ...REPORT, isEmpty: true })} />);

  expect(screen.getByText("Belum ada jemaat berwilayah")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});
