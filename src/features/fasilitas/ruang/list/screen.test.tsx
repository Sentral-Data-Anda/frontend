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
  usePathname: () => "/fasilitas/ruang",
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

const { RuangListScreen } = await import("./screen");

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
      { status: 404, error: "Ruang Tidak Ditemukan" },
      { status: 404 },
    );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RuangListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar ruang", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(screen.getByText("Anda tidak memiliki akses ke Ruang")).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tambah hanya dengan CREATE; kosong mengajak menambah", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada ruang")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tambah ruang" })).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(
      await screen.findByRole("link", { name: "Tambah ruang" }),
    ).toBeTruthy();
  });

  test("filter Nonaktif dari URL → isActive=0; kosong karena filter", async () => {
    onRender(["VIEW"], "status=nonaktif");

    expect(
      await screen.findByText("Tidak ada ruang yang cocok dengan filter ini."),
    ).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/room?page=1&limit=10&isActive=0");
  });
});
