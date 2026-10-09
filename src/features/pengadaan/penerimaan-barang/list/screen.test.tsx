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

import { penerimaanBarangMock } from "../../../../../scripts/mock/handlers/penerimaan-barang";
import { GOODS_RECEIPT } from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/procurement/goods-receipt",
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { ReceiptListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    requested.push(`${path}${url.search}`);

    return (
      (await penerimaanBarangMock({
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
      <ReceiptListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar penerimaan", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Penerimaan Barang"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("VIEW saja: baris tanpa tombol catat", async () => {
    onRenderList(["VIEW"]);

    expect(await screen.findByText("3 penerimaan")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Catat penerimaan barang" }),
    ).toBeNull();
    expect(screen.getAllByText("Toko Buku Agape").length).toBeGreaterThan(0);
  });

  test("CREATE: tombol catat; cari + bulan → filter, startDate, endDate", async () => {
    const receipt = GOODS_RECEIPT[0];
    const month = receipt.receivedDate.slice(0, 7);

    search.current = new URLSearchParams(
      `bulan=${month}&search=${receipt.code}`,
    );
    onRenderList(["VIEW", "CREATE"]);

    expect(await screen.findByText("1 penerimaan")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Catat penerimaan barang" }),
    ).toBeTruthy();
    const listCall = requested.find((call) =>
      call.startsWith("/penerimaan-barang?"),
    );

    expect(
      Object.fromEntries(new URLSearchParams(listCall?.split("?")[1])),
    ).toMatchObject({
      filter: receipt.code,
      startDate: `${month}-01`,
    });
  });

  test("kosong karena cari: teks kosong-karena-filter", async () => {
    search.current = new URLSearchParams("search=zzz");
    onRenderList(["VIEW"]);

    expect(
      await screen.findByText(
        "Tidak ada penerimaan barang yang cocok dengan pencarian atau filter ini.",
      ),
    ).toBeTruthy();
  });
});
