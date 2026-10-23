import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

import { returPembelianMock } from "../../../../../scripts/mock/handlers/retur-pembelian";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];
const replaced: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/procurement/purchase-return",
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

const { ReturnListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    requested.push(`${path}${url.search}`);

    if (path === "/ddl/supplier") {
      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 1, code: "SUP-001", name: "Toko Buku Agape" }],
      });
    }

    return (
      (await returPembelianMock({
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
  // use-list-params menyimpan filter ke sessionStorage; tanpa ini filter
  // test list bocor ke tautan kembali di test detail.
  window.sessionStorage.clear();
  requested.length = 0;
  replaced.length = 0;
  search.current = new URLSearchParams();
  window.history.replaceState(null, "", "/");
});

const onRenderList = (granted: MenuAction[]) => {
  actions.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReturnListScreen />
    </QueryClientProvider>,
  );
};

const listQuery = () =>
  requested.find((path) => path.startsWith("/retur-pembelian?")) ?? "";

describe("daftar retur pembelian", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Purchase Return"),
    ).toBeTruthy();
  });

  test("gerbang: tambah dan pensil hanya dengan izinnya", async () => {
    onRenderList(["VIEW"]);

    await screen.findAllByText(/RTR-/);
    expect(
      screen.queryByRole("link", { name: "Tambah retur pembelian" }),
    ).toBeNull();
    expect(screen.queryAllByRole("link", { name: /^Ubah retur/ })).toEqual([]);
    cleanup();

    onRenderList(["VIEW", "CREATE", "UPDATE"]);
    await screen.findAllByText(/RTR-/);
    expect(
      screen.getByRole("link", { name: "Tambah retur pembelian" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /^Ubah retur/ }).length,
    ).toBeGreaterThan(0);
  });

  // Hanya draf yang boleh diubah, jadi pensilnya ikut aturan itu, bukan izinnya saja.
  test("pensil hanya di baris draf", async () => {
    onRenderList(["VIEW", "UPDATE"]);

    await screen.findAllByText(/RTR-/);
    const rows = screen.getAllByRole("link", { name: /^Lihat retur/ }).length;
    const pencils = screen.getAllByRole("link", { name: /^Ubah retur/ }).length;

    expect(rows).toBeGreaterThan(pencils);
  });

  test("filter URL → query be-sada", async () => {
    search.current = new URLSearchParams("status=CANCELLED&supplier=1");
    onRenderList(["VIEW"]);

    await waitFor(() => expect(listQuery()).not.toBe(""));
    const query = new URLSearchParams(listQuery().split("?")[1]);

    expect(query.get("status")).toBe("CANCELLED");
    expect(query.get("supplierId")).toBe("1");
  });

  // Daftar retur di be-sada hanya menyaring supplierId dan status, jadi kotak
  // cari akan terlihat bekerja tanpa mengubah apa pun.
  test("tanpa kotak cari dan tanpa parameter filter teks", async () => {
    onRenderList(["VIEW"]);

    await screen.findAllByText(/RTR-/);

    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(
      new URLSearchParams(listQuery().split("?")[1]).get("filter"),
    ).toBeNull();
  });

  test("memilih tab menulis status ke URL", async () => {
    onRenderList(["VIEW"]);

    await screen.findAllByText(/RTR-/);
    fireEvent.click(screen.getByRole("tab", { name: "Selesai" }));

    expect(replaced.at(-1)).toBe(
      "/procurement/purchase-return?status=COMPLETED",
    );
  });

  test("filter yang tidak cocok: kosong karena filter", async () => {
    search.current = new URLSearchParams("supplier=999");
    onRenderList(["VIEW"]);

    expect(await screen.findByText("Tidak ada retur")).toBeTruthy();
    expect(
      screen.getByText("Tidak ada retur yang cocok dengan filter ini."),
    ).toBeTruthy();
  });
});
