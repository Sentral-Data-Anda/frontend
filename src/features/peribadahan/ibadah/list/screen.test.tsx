import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import type { MenuAction } from "@/types/menu";

import { ibadahMock } from "../../../../../scripts/mock/handlers/ibadah";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/peribadahan/ibadah",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { IbadahListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    requested.push(url.pathname);

    return ibadahMock({
      request: new Request(url),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
      method: "GET",
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    });
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  requested.length = 0;
});

const onRenderList = (granted: MenuAction[]) => {
  actions.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <IbadahListScreen />
    </QueryClientProvider>,
  );
};

/**
 * Gerbang muat yang sekaligus memaku himpunan subjeknya: `findByText` atas
 * subtitle "N <noun>" cocok dua kali di lebar tabel — subtitle dan footer
 * "Menampilkan 1-10 dari N <noun>" — dan nol baris pun tetap melewatkannya,
 * jadi asersi "tanpa tautan ubah" di bawahnya bisa hijau atas daftar kosong.
 */
const onRowsReady = () =>
  waitFor(() =>
    expect(document.querySelectorAll("[data-row-id]").length).toBeGreaterThan(
      0,
    ),
  );

describe("gerbang izin daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memanggil be-sada", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Ibadah"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("VIEW saja: tanpa Tambah dan tanpa tautan ubah", async () => {
    onRenderList(["VIEW"]);

    await onRowsReady();
    expect(screen.queryByRole("link", { name: "Tambah ibadah" })).toBeNull();
    expect(screen.queryAllByRole("link", { name: /^Ubah / })).toHaveLength(0);
  });

  test("CREATE dan UPDATE: Tambah ke form baru dan baris ke form ubah", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE"]);

    await onRowsReady();
    expect(
      screen.getByRole("link", { name: "Tambah ibadah" }).getAttribute("href"),
    ).toBe("/peribadahan/ibadah/baru");
    expect(
      screen.getAllByRole("link", { name: /^Ubah / }).length,
    ).toBeGreaterThan(0);
  });
});
