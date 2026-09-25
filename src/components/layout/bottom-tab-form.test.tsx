import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { SessionProvider } from "@/features/auth";
import type { Session } from "@/features/auth";

const pathname = { current: "/kejemaatan/daftar-jemaat" };

mock.module("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

const { BottomTab } = await import("./bottom-tab");

afterEach(cleanup);

const SESSION = { menu: [] } as unknown as Session;

const onRenderTab = (path: string) => {
  pathname.current = path;

  return render(
    <SessionProvider session={SESSION}>
      <BottomTab />
    </SessionProvider>,
  );
};

describe("bottom tab di layar isian", () => {
  test("layar daftar tetap punya navigasi", () => {
    onRenderTab("/kejemaatan/daftar-jemaat");

    expect(
      screen.getByRole("navigation", { name: "Navigasi utama" }),
    ).toBeTruthy();
  });

  test("rute tambah tidak merender navigasi sama sekali", () => {
    const { container } = onRenderTab("/kejemaatan/daftar-jemaat/baru");

    expect(container.innerHTML).toBe("");
  });

  test("rute ubah tidak merender navigasi sama sekali", () => {
    const { container } = onRenderTab(
      "/kejemaatan/daftar-jemaat/JMT-0042/ubah",
    );

    expect(container.innerHTML).toBe("");
  });
});
