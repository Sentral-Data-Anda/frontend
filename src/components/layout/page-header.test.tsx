import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { PageHeaderAdd } from "./page-header";

afterEach(cleanup);

test("PageHeaderAdd: teks bawaan Tambah, bisa diganti; nama aksesibel dari label", () => {
  const { rerender } = render(
    <PageHeaderAdd href="/a/baru" label="Tambah tipe barang" />,
  );

  expect(
    screen.getByRole("link", { name: "Tambah tipe barang" }).textContent,
  ).toBe("Tambah");

  rerender(
    <PageHeaderAdd
      href="/a/baru"
      label="Catat mutasi stok"
      text="Catat mutasi"
    />,
  );

  expect(
    screen.getByRole("link", { name: "Catat mutasi stok" }).textContent,
  ).toBe("Catat mutasi");
});
