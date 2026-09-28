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

import { fasilitasMock } from "../../../../../scripts/mock/handlers/fasilitas";
import { peminjamanRuangMock } from "../../../../../scripts/mock/handlers/peminjaman-ruang";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: URL[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/fasilitas/peminjaman-ruang",
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

const { LoanListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const context = {
      request: new Request(url),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
      method: "GET",
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    requested.push(url);

    return (
      (await peminjamanRuangMock(context)) ??
      (await fasilitasMock(context)) ??
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
});

const onRenderList = (granted: MenuAction[]) => {
  actions.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LoanListScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang izin daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memanggil be-sada", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Peminjaman Ruang"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("VIEW saja: tanpa Tambah dan tanpa tautan ubah", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText(/^\d+ peminjaman$/);
    expect(
      screen.queryByRole("link", { name: "Tambah peminjaman" }),
    ).toBeNull();
    expect(
      screen.queryAllByRole("link", { name: /^(Ubah|Lihat) / }),
    ).toHaveLength(0);
  });

  test("CREATE dan UPDATE: Tambah ke form baru; Periode bawaan = Mendatang (startDate saja)", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE"]);

    await screen.findByText(/^\d+ peminjaman$/);
    expect(
      screen
        .getByRole("link", { name: "Tambah peminjaman" })
        .getAttribute("href"),
    ).toBe("/fasilitas/peminjaman-ruang/baru");
    expect(
      screen.getAllByRole("link", { name: /^(Ubah|Lihat) / }).length,
    ).toBeGreaterThan(0);

    const list = requested.find((url) => url.pathname.endsWith("/loan-room"));

    expect(list?.searchParams.get("startDate")).toBe(todayJakarta());
    expect(list?.searchParams.has("endDate")).toBe(false);
  });
});
