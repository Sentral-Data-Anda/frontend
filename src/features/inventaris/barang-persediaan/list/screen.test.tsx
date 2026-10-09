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
  usePathname: () => "/inventory/stock-item",
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

const { StockListScreen } = await import("./screen");

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
      { status: 404, error: "Barang Persediaan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <StockListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar barang persediaan", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Barang Persediaan"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tambah hanya dengan CREATE; kosong mengajak mencatat", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada barang persediaan")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Tambah barang persediaan" }),
    ).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(
      await screen.findByRole("link", { name: "Tambah barang persediaan" }),
    ).toBeTruthy();
  });

  test("filter Menipis dan ruang dari URL → menipis=ya&roomId; kosong karena filter", async () => {
    onRender(["VIEW"], "stok=ya&ruang=2");

    expect(
      await screen.findByText(
        "Tidak ada barang persediaan yang cocok dengan filter ini.",
      ),
    ).toBeTruthy();
    expect(urls).toContain(
      "/api/v1/barang-persediaan?page=1&limit=10&menipis=ya&roomId=2",
    );
  });
});
