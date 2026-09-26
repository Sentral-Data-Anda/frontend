import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { DataList, DataListRow } from "./data-list";

afterEach(cleanup);

type Row = { code: string; name: string };

const rows: Row[] = [
  { code: "JMT-0001", name: "Andreas" },
  { code: "JMT-0002", name: "Bethari" },
];

const onRenderList = (props: Partial<Parameters<typeof DataList<Row>>[0]>) =>
  render(
    <DataList<Row>
      items={rows}
      getKey={(row) => row.code}
      label="Daftar uji"
      {...props}
    >
      {(row) => <DataListRow title={row.name} meta={row.code} />}
    </DataList>,
  );

describe("DataList", () => {
  test("merender satu baris per item", () => {
    onRenderList({});

    expect(screen.getByRole("list", { name: "Daftar uji" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("mempertahankan daftar lama saat menyegarkan, bukan menggantinya skeleton", () => {
    onRenderList({ isRefreshing: true });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("menampilkan skeleton hanya saat belum ada data", () => {
    onRenderList({ items: undefined, isLoading: true });

    expect(screen.queryByRole("list", { name: "Daftar uji" })).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  test("daftar kosong adalah keadaan kosong, bukan galat", () => {
    onRenderList({ items: [], emptyTitle: "Tidak ada jemaat" });

    expect(screen.getByText("Tidak ada jemaat")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus filter" })).toBeNull();
  });

  test("kosong karena filter menawarkan Hapus filter", () => {
    const onClearFilter = mock();
    onRenderList({ items: [], onClearFilter });

    fireEvent.click(screen.getByRole("button", { name: "Hapus filter" }));

    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  test("galat sungguhan menampilkan pesannya beserta tombol coba lagi", () => {
    onRenderList({
      error: new Error("Permintaan gagal (500)."),
      onRetry: () => {},
    });

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Permintaan gagal (500).")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });

  test("coba lagi yang sedang berjalan: tombol nonaktif dan bertuliskan memuat", () => {
    onRenderList({
      error: new Error("Permintaan gagal (500)."),
      onRetry: () => {},
      isRefreshing: true,
    });

    const button = screen.getByRole("button", { name: "Memuat…" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  test("baris: judul dan meta string punya title (teks lengkap saat terpotong)", () => {
    onRenderList({});

    expect(screen.getByText("Andreas").getAttribute("title")).toBe("Andreas");
    expect(screen.getByText("JMT-0001").getAttribute("title")).toBe("JMT-0001");
  });

  test("galat menang atas data yang masih tersisa di cache", () => {
    onRenderList({ error: new Error("Jaringan terputus.") });

    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("paginasi disembunyikan saat hanya ada satu halaman", () => {
    onRenderList({
      pagination: {
        mode: "pages",
        page: 1,
        totalPage: 1,
        onPickPage: () => {},
      },
    });

    expect(screen.queryByRole("navigation", { name: "Paginasi" })).toBeNull();
  });

  test("tombol sebelumnya mati di halaman pertama, berikutnya di terakhir", () => {
    onRenderList({
      pagination: {
        mode: "pages",
        page: 1,
        totalPage: 3,
        onPickPage: () => {},
      },
    });

    expect(
      screen
        .getByRole("button", { name: "Halaman sebelumnya" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Halaman berikutnya" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  test("nomor halaman dibacakan utuh, bukan '1 / 3'", () => {
    onRenderList({
      pagination: {
        mode: "pages",
        page: 1,
        totalPage: 3,
        onPickPage: () => {},
      },
    });

    expect(screen.getByText("Halaman 1 dari 3")).toBeTruthy();
  });

  test("setiap baris membawa badan tempat garis pemisah digambar", () => {
    const { container } = onRenderList({});

    expect(
      container.querySelectorAll("li > [data-slot=row-body]"),
    ).toHaveLength(2);
  });
});
