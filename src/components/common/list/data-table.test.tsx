import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { DataList, DataListRow } from "./data-list";
import { getRangeLabel, type DataTableConfig } from "./data-table";

afterEach(cleanup);

type Row = { code: string; name: string };

const rows: Row[] = [
  { code: "JMT-0001", name: "Andreas" },
  { code: "JMT-0002", name: "Bethari" },
];

const table = (isOpenable: boolean): DataTableConfig<Row> => ({
  columns: [
    { key: "name", header: "Nama", width: "1fr", cell: (row) => row.name },
    { key: "code", header: "Kode", width: "1fr", cell: (row) => row.code },
  ],
  getRowHref: isOpenable ? (row) => `/uji/${row.code}` : undefined,
  getRowLabel: (row) => `Ubah ${row.name}`,
});

const pages = {
  mode: "pages" as const,
  page: 1,
  totalPage: 1,
  onPickPage: () => {},
  totalData: 12,
  limit: 10,
};

const onRender = (props: Partial<Parameters<typeof DataList<Row>>[0]>) =>
  render(
    <DataList<Row>
      items={rows}
      getKey={(row) => row.code}
      label="Daftar uji"
      table={table(true)}
      {...props}
    >
      {(row) => <DataListRow title={row.name} />}
    </DataList>,
  );

describe("getRangeLabel", () => {
  test("rentang halaman, dipotong di data terakhir", () => {
    expect(getRangeLabel(1, 10, 12)).toBe("1–10 dari 12");
    expect(getRangeLabel(2, 10, 12)).toBe("11–12 dari 12");
    expect(getRangeLabel(1, 10, 0)).toBe("0 dari 0");
  });
});

describe("DataList + table", () => {
  test("paginasi bernomor → tabel; satu tautan per baris, bernama aksinya", () => {
    onRender({ pagination: pages });

    expect(screen.getByRole("table", { name: "Daftar uji" })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
    expect(
      screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("aria-label")),
    ).toEqual(["Ubah Andreas", "Ubah Bethari"]);
    expect(screen.getByText("1–10 dari 12")).toBeTruthy();
  });

  /**
   * Bentuk dipilih LEBAR LAYAR (≥ md), bukan mode paginasi: tablet memakai
   * tabel DENGAN "muat lebih banyak". Di HP (< md) tetap baris daftar.
   */
  test("HP (< md) → tetap baris daftar walau `table` diberikan", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    onRender({
      pagination: {
        mode: "more",
        hasMore: false,
        isLoadingMore: false,
        isLoadMoreError: false,
        isBusy: false,
        totalData: 2,
        onLoadMore: () => {},
      },
    });

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    window.matchMedia = original;
  });

  test("tablet ke atas + 'muat lebih banyak' → tabel dengan ujung muat-lagi", () => {
    onRender({
      pagination: {
        mode: "more",
        hasMore: true,
        isLoadingMore: false,
        isLoadMoreError: false,
        isBusy: false,
        totalData: 20,
        onLoadMore: () => {},
      },
    });

    expect(screen.getByRole("table", { name: "Daftar uji" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Muat lebih banyak" }),
    ).toBeTruthy();
  });

  test("baris tanpa tujuan tidak punya tautan", () => {
    onRender({ pagination: pages, table: table(false) });

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  /**
   * Kedua kerangka dirender dan CSS yang memilih — pilihan lewat JS baru
   * datang sesudah hidrasi, dan kerangka daftar sempat berkedip jadi tabel.
   */
  test("kerangka memuat membawa bentuk daftar DAN tabel, dipilih CSS", () => {
    const { container } = onRender({ items: undefined, isLoading: true });

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Nama")).toBeTruthy();
    expect(container.querySelector(".md\\:hidden ul")).toBeTruthy();
    expect(container.querySelector(".hidden.md\\:block .grid")).toBeTruthy();
  });
});
