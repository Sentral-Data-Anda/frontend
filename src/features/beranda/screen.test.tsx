import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import { SessionProvider } from "@/features/auth/session-provider";
import type { Session } from "@/features/auth/types";
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

describe("angka kas di Beranda", () => {
  test("tanpa LAPORAN_KEUANGAN VIEW tidak dirender", () => {
    renderHome([
      {
        ...node(MENU.KEUANGAN, []),
        children: [node(MENU.KAS_MASUK, ["VIEW"])],
      },
    ]);

    expect(screen.queryByText("Saldo kas & bank")).toBeNull();
  });

  test("dengan LAPORAN_KEUANGAN VIEW dirender", () => {
    renderHome([
      {
        ...node(MENU.KEUANGAN, []),
        children: [
          node(MENU.LAPORAN_KEUANGAN, ["VIEW"]),
          node(MENU.KAS_KELUAR, ["VIEW"]),
        ],
      },
    ]);

    expect(screen.getByText("Saldo kas & bank")).toBeTruthy();
  });
});
