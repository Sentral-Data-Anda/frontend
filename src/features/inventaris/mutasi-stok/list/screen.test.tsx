import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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

import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/inventory/stock-movement",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { MutasiListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const urls: string[] = [];
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  urls.length = 0;
  search.current = "";
});

const onRender = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = query;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input));

    return Response.json(
      { status: 404, error: "Mutasi Stok Tidak Ditemukan" },
      { status: 404 },
    );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MutasiListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar mutasi stok", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Mutasi Stok"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("Catat mutasi hanya dengan CREATE; kosong mengajak mencatat", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada mutasi stok")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Catat mutasi" })).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(
      await screen.findByRole("link", { name: "Catat mutasi" }),
    ).toBeTruthy();
  });

  test("bulan, jenis, sumber, cari dari URL → query be-sada; kosong karena filter", async () => {
    onRender(
      ["VIEW"],
      "bulan=2026-09&jenis=IN&sumber=DONATION&search=BRP-0001",
    );

    expect(
      await screen.findByText("Tidak ada mutasi yang cocok dengan filter ini."),
    ).toBeTruthy();
    expect(urls).toContain(
      "/api/v1/mutasi-stok?page=1&limit=10&filter=BRP-0001&type=IN&source=DONATION&startDate=2026-09-01&endDate=2026-09-30",
    );
  });
});
