import type { UseQueryResult } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { Share } from "../types";

import { ShareCard } from "./share-card";

afterEach(cleanup);

const queryOf = (data: Share[]) =>
  ({
    data,
    isPending: false,
    isFetching: false,
    error: null,
    refetch: () => {},
  }) as unknown as UseQueryResult<Share[]>;

test("satu progressbar per baris, persen dari total kartu", () => {
  render(
    <ShareCard
      title="Suku"
      unit="jemaat"
      emptyTitle="Belum ada data"
      query={queryOf([
        { key: "a", label: "Batak Toba", count: 3 },
        { key: "b", label: "Jawa", count: 1 },
      ])}
    />,
  );

  expect(screen.getByText("4 jemaat")).toBeTruthy();
  expect(
    screen
      .getByRole("progressbar", { name: "Batak Toba" })
      .getAttribute("aria-valuenow"),
  ).toBe("75");
  expect(screen.getByText("1 (25%)")).toBeTruthy();
});

test("total nol menampilkan keadaan kosong, tanpa progressbar", () => {
  render(
    <ShareCard
      title="Usia anggota"
      unit="anggota"
      emptyTitle="Belum ada anggota dengan tanggal lahir"
      query={queryOf([{ key: "<12", label: "Di bawah 12 tahun", count: 0 }])}
    />,
  );

  expect(
    screen.getByText("Belum ada anggota dengan tanggal lahir"),
  ).toBeTruthy();
  expect(screen.queryByRole("progressbar")).toBeNull();
});
