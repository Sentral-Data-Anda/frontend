import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { DataList, DataListRow } from "./data-list";

/** Auto-cleanup Testing Library tidak terpasang di `bun test`. Lihat README. */
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

  /**
   * Pembedaan yang paling mudah hilang saat berkas ini disentuh lagi. `items`
   * yang masih ada BERSAMA `isRefreshing` berarti pindah halaman atau mengetik
   * di kotak cari — daftar lamanya harus bertahan. Begitu ia berganti skeleton,
   * layarnya berkedip di setiap huruf yang diketik.
   */
  test("mempertahankan daftar lama saat menyegarkan, bukan menggantinya skeleton", () => {
    onRenderList({ isRefreshing: true });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("menampilkan skeleton hanya saat belum ada data", () => {
    onRenderList({ items: undefined, isLoading: true });

    expect(screen.queryByRole("list", { name: "Daftar uji" })).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  /**
   * be-sada menjawab 404 untuk daftar kosong dan `fetchList` sudah
   * menerjemahkannya jadi array kosong. Yang diuji di sini adalah ujung
   * rantainya: array kosong TIDAK BOLEH menempuh cabang galat (verifikasi
   * §13.3).
   */
  test("daftar kosong adalah keadaan kosong, bukan galat", () => {
    onRenderList({ items: [], emptyTitle: "Tidak ada jemaat" });

    expect(screen.getByText("Tidak ada jemaat")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
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

  test("galat menang atas data yang masih tersisa di cache", () => {
    onRenderList({ error: new Error("Jaringan terputus.") });

    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("paginasi disembunyikan saat hanya ada satu halaman", () => {
    onRenderList({
      pagination: { page: 1, totalPage: 1, onPickPage: () => {} },
    });

    expect(screen.queryByRole("navigation", { name: "Paginasi" })).toBeNull();
  });

  test("tombol sebelumnya mati di halaman pertama, berikutnya di terakhir", () => {
    onRenderList({
      pagination: { page: 1, totalPage: 3, onPickPage: () => {} },
    });

    expect(
      screen
        .getByRole("button", { name: "Sebelumnya" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Berikutnya" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
});
