import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { onStubViewport } from "../../../../tests/viewport";

import { DataList, DataListRow } from "./data-list";
import { DataTable, getRangeLabel, type DataTableConfig } from "./data-table";

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
    expect(screen.getByText("Menampilkan 1–10 dari 12 data")).toBeTruthy();
  });

  test("HP (< md) → tetap baris daftar walau `table` diberikan", () => {
    const viewport = onStubViewport(false);

    onRender({
      pagination: {
        mode: "more",
        isMoreAvailable: false,
        isLoadingMore: false,
        isLoadMoreError: false,
        isBusy: false,
        totalData: 2,
        onLoadMore: () => {},
      },
    });

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    viewport.onRestore();
  });

  test("tablet ke atas + 'muat lebih banyak' → tabel dengan ujung muat-lagi", () => {
    onRender({
      pagination: {
        mode: "more",
        isMoreAvailable: true,
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

  test("kerangka memuat membawa bentuk daftar DAN tabel, dipilih CSS", () => {
    const { container } = onRender({ items: undefined, isLoading: true });

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Nama")).toBeTruthy();
    expect(container.querySelector(".md\\:hidden ul")).toBeTruthy();
    expect(container.querySelector(".hidden.md\\:block .grid")).toBeTruthy();
  });
});

describe("align", () => {
  test("end meratakan kanan kepala dan sel kolom itu saja", () => {
    render(
      <DataTable<Row>
        items={rows}
        getKey={(row) => row.code}
        label="Daftar uji"
        config={{
          columns: [
            {
              key: "name",
              header: "Nama",
              width: "1fr",
              cell: (row) => row.name,
            },
            {
              key: "code",
              header: "Kode",
              width: "1fr",
              align: "end",
              cell: (row) => row.code,
            },
          ],
        }}
      />,
    );

    const [name, code] = screen.getAllByRole("columnheader");
    expect(name.className).not.toContain("text-right");
    expect(code.className).toContain("text-right");
    expect(
      screen.getByText("JMT-0001").closest("[role=cell]")?.className,
    ).toContain("text-right");
    expect(
      screen.getByText("Andreas").closest("[role=cell]")?.className,
    ).not.toContain("text-right");
  });
});
