import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { MenuNode } from "@/features/auth/types";

import { SidebarNav } from "./sidebar";

afterEach(cleanup);

const leaf = (slug: string, name: string): MenuNode => ({
  publicId: slug,
  slug,
  name,
  order: 1,
  action: ["VIEW"],
  children: [],
});

const MENU: MenuNode[] = [
  {
    ...leaf("KEJEMAATAN", "Kejemaatan"),
    action: [],
    children: [
      leaf("DAFTAR_JEMAAT", "Daftar Jemaat"),
      leaf("KELUARGA", "Keluarga"),
    ],
  },
  {
    ...leaf("KEUANGAN", "Keuangan"),
    action: [],
    children: [leaf("KAS_MASUK", "Kas Masuk")],
  },
];

const domainOf = (name: string) =>
  screen.getByText(name).closest("details") as HTMLDetailsElement;

describe("SidebarNav", () => {
  test("hanya domain yang memuat layar aktif yang terbuka", () => {
    render(
      <SidebarNav menu={MENU} pathname="/kejemaatan/daftar-jemaat/JMT-0001" />,
    );

    expect(domainOf("Kejemaatan").open).toBe(true);
    expect(domainOf("Keuangan").open).toBe(false);
  });

  test("layar aktif ditandai aria-current, saudaranya tidak", () => {
    render(<SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" />);

    expect(
      screen
        .getByRole("link", { name: "Keluarga" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: "Daftar Jemaat" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  test("di beranda tidak ada domain yang terbuka", () => {
    render(<SidebarNav menu={MENU} pathname="/" />);

    expect(domainOf("Kejemaatan").open).toBe(false);
    expect(domainOf("Keuangan").open).toBe(false);
  });

  test("Beranda aktif hanya di /", () => {
    render(<SidebarNav menu={MENU} pathname="/" />);
    expect(
      screen
        .getByRole("link", { name: "Beranda" })
        .getAttribute("aria-current"),
    ).toBe("page");
    cleanup();

    render(<SidebarNav menu={MENU} pathname="/modul" />);
    expect(
      screen
        .getByRole("link", { name: "Beranda" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  test("halaman domain membuka domainnya; semua domain satu grup accordion", () => {
    render(<SidebarNav menu={MENU} pathname="/keuangan" />);

    expect(domainOf("Keuangan").open).toBe(true);
    expect(domainOf("Kejemaatan").open).toBe(false);
    expect(domainOf("Kejemaatan").getAttribute("name")).toBe("sidebar-domain");
  });
});
