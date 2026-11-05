import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import { SessionProvider, type Session } from "@/features/auth";
import type { MenuNode } from "@/types/menu";

import { PageHeader, PageHeaderAdd } from "./page-header";

afterEach(cleanup);

const node = (slug: string, children: MenuNode[] = []): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action: children.length ? [] : ["VIEW"],
  children,
});

const sessionWith = (menu: MenuNode[]): Session => ({
  code: "U1",
  username: "u1",
  status: "ACTIVE",
  roleUser: { name: "Peran", isAdmin: false },
  jemaat: { name: "Maria" },
  menu,
});

const backHrefOf = (backHref: string, menu?: MenuNode[]) => {
  render(
    menu ? (
      <SessionProvider session={sessionWith(menu)}>
        <PageHeader title="Layar" backHref={backHref} />
      </SessionProvider>
    ) : (
      <PageHeader title="Layar" backHref={backHref} />
    ),
  );

  return screen.getByRole("link", { name: "Kembali" }).getAttribute("href");
};

test("PageHeaderAdd: teks bawaan Tambah, bisa diganti; nama aksesibel dari label", () => {
  const { rerender } = render(
    <PageHeaderAdd href="/a/create" label="Tambah tipe barang" />,
  );

  expect(
    screen.getByRole("link", { name: "Tambah tipe barang" }).textContent,
  ).toBe("Tambah");

  rerender(
    <PageHeaderAdd
      href="/a/create"
      label="Catat mutasi stok"
      text="Catat mutasi"
    />,
  );

  expect(
    screen.getByRole("link", { name: "Catat mutasi stok" }).textContent,
  ).toBe("Catat mutasi");
});

test("Kembali dari layar di domain berlayar satu menuju Beranda", () => {
  expect(
    backHrefOf("/peribadahan", [node(MENU.PERIBADAHAN, [node(MENU.IBADAH)])]),
  ).toBe("/");
});

test("Kembali dari layar di domain berlayar banyak menuju halaman domain", () => {
  expect(
    backHrefOf("/kejemaatan", [
      node(MENU.KEJEMAATAN, [node(MENU.DAFTAR_JEMAAT), node(MENU.KELUARGA)]),
    ]),
  ).toBe("/kejemaatan");
});

test("tanpa sesi, tautan Kembali tidak diubah", () => {
  expect(backHrefOf("/peribadahan")).toBe("/peribadahan");
});
