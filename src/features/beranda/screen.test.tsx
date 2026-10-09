import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
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

const sessionWith = (menu: MenuNode[]): Session => ({
  code: "U1",
  username: "u1",
  status: "ACTIVE",
  roleUser: { name: "Peran", isAdmin: false },
  jemaat: { name: "Maria" },
  menu,
});

const renderHome = (menu: MenuNode[]) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider session={sessionWith(menu)}>
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
    renderHome([
      {
        ...node(MENU.FINANCE, []),
        children: [
          node(MENU.FINANCIAL_STATEMENT, ["VIEW"]),
          node(MENU.KAS_KELUAR, ["VIEW"]),
        ],
      },
    ]);

    expect(screen.getByText("Saldo Rekening")).toBeTruthy();
  });
});
