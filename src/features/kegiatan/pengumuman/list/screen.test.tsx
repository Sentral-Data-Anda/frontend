import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
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

import { pengumumanMock } from "../../../../../scripts/mock/handlers/pengumuman";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/kegiatan/pengumuman",
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

const { PengumumanListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    requested.push(path);

    return (
      (await pengumumanMock({
        request: new Request(url),
        url,
        path,
        method: "GET",
        can: () => true,
        isAdmin: true,
        sessionCode: "test",
      })) ?? Response.json({ status: 404, error: "x" }, { status: 404 })
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
      <PengumumanListScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang izin daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memanggil be-sada", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pengumuman"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("VIEW saja: tanpa tombol buat dan tanpa pensil", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText("9 pengumuman");
    expect(screen.queryByRole("link", { name: "Buat pengumuman" })).toBeNull();
    expect(screen.queryAllByRole("link", { name: /^Ubah / })).toHaveLength(0);
  });

  test("CREATE + UPDATE: tombol buat ke form baru, yang disematkan di atas", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE"]);

    await screen.findByText("9 pengumuman");
    expect(
      screen
        .getByRole("link", { name: "Buat pengumuman" })
        .getAttribute("href"),
    ).toBe("/kegiatan/pengumuman/baru");

    const [first] = screen.getAllByRole("listitem");
    expect(within(first).getByText("Disematkan:")).toBeTruthy();
    expect(within(first).getByText(/Warta Jemaat Minggu Ini/)).toBeTruthy();
  });
});
