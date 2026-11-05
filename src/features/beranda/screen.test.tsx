import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { DOMAIN_SLUGS, MENU } from "@/config/menu";
import { SessionProvider, type Session } from "@/features/auth";
import type { MenuNode } from "@/types/menu";

import { HomeScreen } from "./screen";

afterEach(cleanup);

const node = (slug: string, action: MenuNode["action"]): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action,
  children: [],
});

const sessionWith = (
  menu: MenuNode[],
  dashboardView: "UMUM" | "KEUANGAN" = "UMUM",
): Session => ({
  code: "U1",
  username: "u1",
  status: "ACTIVE",
  roleUser: { name: "Peran", isAdmin: false, dashboardView },
  jemaat: { name: "Maria" },
  menu,
});

const renderHome = (
  menu: MenuNode[],
  dashboardView: "UMUM" | "KEUANGAN" = "UMUM",
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider session={sessionWith(menu, dashboardView)}>
        <HomeScreen />
      </SessionProvider>
    </QueryClientProvider>,
  );

describe("saldo rekening di Beranda", () => {
  test("tanpa FINANCIAL_STATEMENT VIEW tidak dirender", () => {
    renderHome([
      {
        ...node(MENU.FINANCE, []),
        children: [node(MENU.KAS_MASUK, ["VIEW"])],
      },
    ]);

    expect(screen.queryByText("Saldo Rekening")).toBeNull();
  });

  test("dengan FINANCIAL_STATEMENT VIEW dirender", () => {
    renderHome(
      [
        {
          ...node(MENU.FINANCE, []),
          children: [
            node(MENU.FINANCIAL_STATEMENT, ["VIEW"]),
            node(MENU.KAS_KELUAR, ["VIEW"]),
          ],
        },
      ],
      "KEUANGAN",
    );

    expect(screen.getByText("Saldo Rekening")).toBeTruthy();
  });
});

describe("Aksi cepat di Beranda", () => {
  test("menu yang tidak dipegang tidak tampil", () => {
    renderHome([node(MENU.KEGIATAN, ["VIEW"])]);

    expect(screen.getByText(MENU.KEGIATAN)).toBeTruthy();
    expect(screen.queryByText(MENU.SETTINGS)).toBeNull();
  });

  test("menu yang dipegang di luar daftar Aksi cepat tetap tampil", () => {
    renderHome([node(MENU.SETTINGS, ["VIEW"])]);

    expect(screen.getByText(MENU.SETTINGS)).toBeTruthy();
  });

  test("selama belum melebihi batas, tidak ada tautan Tampilkan semua", () => {
    renderHome([node(MENU.KEGIATAN, ["VIEW"]), node(MENU.FINANCE, ["VIEW"])]);

    expect(screen.queryByRole("link", { name: "Tampilkan semua" })).toBeNull();
  });

  test("melebihi batas: delapan tile dan tautan Tampilkan semua", () => {
    renderHome(DOMAIN_SLUGS.map((slug) => node(slug, ["VIEW"])));

    const heading = screen.getByRole("heading", { name: "Aksi cepat" });
    const section = heading.closest("section") as HTMLElement;

    expect(within(section).getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText(MENU.HR)).toBeTruthy();
    expect(screen.queryByText(MENU.PERIBADAHAN)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Tampilkan semua" })
        .getAttribute("href"),
    ).toBe("/modul");
  });
});
