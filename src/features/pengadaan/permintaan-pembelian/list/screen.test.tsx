import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

import { permintaanPembelianMock } from "../../../../../scripts/mock/handlers/permintaan-pembelian";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];
const replaced: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/procurement/purchase-request",
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

const { RequestListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    requested.push(`${path}${url.search}`);

    if (path === "/ddl/bapel") {
      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 2, code: "BP-2", name: "Komisi Pemuda" }],
      });
    }

    return (
      (await permintaanPembelianMock({
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
      <RequestListScreen />
    </QueryClientProvider>,
  );
};

const listQuery = () =>
  requested.find((path) => path.startsWith("/permintaan-pembelian?")) ?? "";

describe("daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Permintaan Pembelian"),
    ).toBeTruthy();
  });

  test("gerbang: tambah dan pensil hanya dengan izinnya", async () => {
    onRenderList(["VIEW"]);

    await screen.findAllByText(/PRQ-/);
    expect(
      screen.queryByRole("link", { name: "Tambah permintaan pembelian" }),
    ).toBeNull();
    expect(screen.queryAllByRole("link", { name: /^Ubah permintaan/ })).toEqual(
      [],
    );
    cleanup();

    onRenderList(["VIEW", "CREATE", "UPDATE"]);
    await screen.findAllByText(/PRQ-/);
    expect(
      screen.getByRole("link", { name: "Tambah permintaan pembelian" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /^Ubah permintaan/ }).length,
    ).toBeGreaterThan(0);
  });

  test("tab dan filter URL → query be-sada", async () => {
    search.current = new URLSearchParams(
      "status=REJECTED&bulan=2026-09&badan=2&pengaju=saya&search=kaos",
    );
    onRenderList(["VIEW"]);

    await screen.findByText("Tidak ada permintaan");
    const query = new URLSearchParams(listQuery().split("?")[1]);

    expect(query.get("status")).toBe("REJECTED");
    expect(query.get("startDate")).toBe("2026-09-01");
    expect(query.get("endDate")).toBe("2026-09-30");
    expect(query.get("bapelId")).toBe("2");
    expect(query.get("requestedBy")).toBe("me");
    expect(query.get("filter")).toBe("kaos");
    expect(
      screen.getByText("Tidak ada permintaan yang cocok dengan filter ini."),
    ).toBeTruthy();
  });

  test("memilih tab menulis status ke URL", async () => {
    onRenderList(["VIEW"]);

    await screen.findAllByText(/PRQ-/);
    fireEvent.click(screen.getByRole("tab", { name: "Ditolak" }));

    expect(replaced.at(-1)).toBe(
      "/procurement/purchase-request?status=REJECTED",
    );
  });
});
