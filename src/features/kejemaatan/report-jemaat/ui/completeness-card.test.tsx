import type { UseQueryResult } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { IncompleteReport } from "../types";

import { CompletenessCard } from "./completeness-card";

const report: IncompleteReport = {
  total: 100,
  birthPlace: 90,
  address: 80,
  provincesCode: 70,
  regenciesCode: 60,
  districtsCode: 50,
  villagesCode: 40,
  statusMarital: 30,
  ethnicGroupId: 20,
  codeInduk: 10,
  birthDate: 23,
  lastEducation: 57,
  profession: 0,
};

const queryOf = (data: IncompleteReport) =>
  ({
    data,
    isPending: false,
    isFetching: false,
    error: null,
    refetch: () => {},
  }) as unknown as UseQueryResult<IncompleteReport>;

afterEach(cleanup);

test("satu bar per field, wajib dulu baru opsional", () => {
  render(<CompletenessCard query={queryOf(report)} />);

  const labels = screen
    .getAllByRole("progressbar")
    .map((bar) => bar.getAttribute("aria-label"));

  expect(labels).toEqual([
    "Tanpa tempat lahir",
    "Tanpa alamat lengkap",
    "Tanpa provinsi",
    "Tanpa kabupaten/kota",
    "Tanpa kecamatan",
    "Tanpa kelurahan/desa",
    "Tanpa status pernikahan",
    "Tanpa suku",
    "Tanpa kode induk",
    "Tanpa tanggal lahir",
    "Tanpa pendidikan terakhir",
    "Tanpa pekerjaan",
  ]);
});

test("hanya field wajib yang ditandai, dan tandanya terbaca", () => {
  render(<CompletenessCard query={queryOf(report)} />);

  const marked = screen
    .getAllByRole("listitem")
    .filter((item) => within(item).queryByText("(wajib)"))
    .map(
      (item) =>
        within(item).getByRole("progressbar").getAttribute("aria-label") ?? "",
    );

  expect(marked).toEqual([
    "Tanpa tempat lahir",
    "Tanpa alamat lengkap",
    "Tanpa provinsi",
    "Tanpa kabupaten/kota",
    "Tanpa kecamatan",
    "Tanpa kelurahan/desa",
    "Tanpa status pernikahan",
    "Tanpa suku",
    "Tanpa kode induk",
  ]);
});

test("persen dan jumlah dihitung dari total jemaat yang sama", () => {
  render(<CompletenessCard query={queryOf(report)} />);

  expect(screen.getByText("100 jemaat")).toBeTruthy();
  expect(
    screen
      .getByRole("progressbar", { name: "Tanpa status pernikahan" })
      .getAttribute("aria-valuenow"),
  ).toBe("30");
  expect(screen.getByText("23 (23%)")).toBeTruthy();
});

test("field tanpa kekurangan ditulis Lengkap, bukan 0 (0%)", () => {
  render(<CompletenessCard query={queryOf(report)} />);

  const row = screen
    .getByRole("progressbar", { name: "Tanpa pekerjaan" })
    .closest("li");

  expect(row && within(row).getByText("Lengkap")).toBeTruthy();
});

test("belum ada jemaat: keadaan kosong, tanpa bar", () => {
  render(<CompletenessCard query={queryOf({ ...report, total: 0 })} />);

  expect(screen.getByText("Belum ada data jemaat")).toBeTruthy();
  expect(screen.queryByRole("progressbar")).toBeNull();
});
