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

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { stokOpnameMock } from "../../../../../scripts/mock/handlers/stok-opname";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/inventaris/stok-opname",
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { OpnameListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    requested.push(`${path}${url.search}`);

    return (
      (await stokOpnameMock({
        request: new Request(url),
        url,
        path,
        method: "GET",
        can: () => true,
        isAdmin: true,
        sessionCode: "test",
      })) ??
      Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 })
    );
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  requested.length = 0;
  search.current = new URLSearchParams();
});

const onRenderList = (granted: MenuAction[]) => {
  actions.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <OpnameListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Stok Opname"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("tanpa CREATE: tombol tambah tidak dirender", async () => {
    onRenderList(["VIEW"]);

    expect(await screen.findByText("5 stok opname")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Tambah stok opname" }),
    ).toBeNull();
  });

  test("filter URL → query be-sada", async () => {
    // Satu-satunya DRAFT di seed bertanggal hari ini, jadi bulannya ikut hari
    // ini — bukan bulan yang dipatok.
    const month = todayJakarta().slice(0, 7);
    const lastDay = new Date(
      Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
    )
      .toISOString()
      .slice(0, 10);

    search.current = new URLSearchParams(
      `bulan=${month}&status=DRAFT&ruang=2&search=OPN`,
    );
    onRenderList(["VIEW", "CREATE"]);

    expect(await screen.findByText("1 stok opname")).toBeTruthy();
    const listCall = requested.find((call) => call.startsWith("/stok-opname?"));
    const query = new URLSearchParams(listCall?.split("?")[1]);

    expect(Object.fromEntries(query)).toMatchObject({
      filter: "OPN",
      status: "DRAFT",
      roomId: "2",
      startDate: `${month}-01`,
      endDate: lastDay,
    });
    expect(
      screen.getByRole("link", { name: "Tambah stok opname" }),
    ).toBeTruthy();
  });

  test("kosong karena filter", async () => {
    search.current = new URLSearchParams("search=zzz");
    onRenderList(["VIEW"]);

    expect(
      await screen.findByText(
        "Tidak ada stok opname yang cocok dengan filter ini.",
      ),
    ).toBeTruthy();
  });
});
