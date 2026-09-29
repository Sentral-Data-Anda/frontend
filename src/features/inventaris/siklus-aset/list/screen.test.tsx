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

import { siklusAsetMock } from "../../../../../scripts/mock/handlers/siklus-aset";
import { onStubViewport } from "../../../../../tests/viewport";
import { CYCLE_LIST_PATH } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: new URLSearchParams() };
const replaced: string[] = [];
const requested: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => CYCLE_LIST_PATH,
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

const { CycleListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    requested.push(`${path}${url.search}`);

    return siklusAsetMock({
      request: new Request(url),
      url,
      path,
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
  replaced.length = 0;
  requested.length = 0;
  window.history.replaceState(null, "", "/");
});

const onRender = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = new URLSearchParams(query);
  window.history.replaceState(null, "", `${CYCLE_LIST_PATH}?${query}`);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CycleListScreen />
    </QueryClientProvider>,
  );
};

describe("tab jenis", () => {
  test("jenis di URL memilih tab dan endpoint; bulan dan cara jadi query be-sada", async () => {
    onRender(
      ["VIEW"],
      "jenis=pelepasan&bulan=2026-09&cara=SOLD&status=APPROVED",
    );

    await screen.findByText(/\d+ pelepasan/);
    expect(
      screen
        .getByRole("tab", { name: "Pelepasan" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(requested[0]).toContain("/siklus-aset/pelepasan?");
    expect(requested[0]).toContain("status=APPROVED");
    expect(requested[0]).toContain("method=SOLD");
    expect(requested[0]).toContain("startDate=2026-09-01");
  });

  test("ganti tab mengosongkan status dan cara, halaman kembali ke 1", async () => {
    onRender(
      ["VIEW"],
      "jenis=pelepasan&status=PENDING&cara=LOST&page=2&search=printer",
    );

    fireEvent.click(await screen.findByRole("tab", { name: "Perawatan" }));

    const next = new URL(replaced[0], "http://mock.test").searchParams;
    expect(next.get("jenis")).toBe("perawatan");
    expect(next.get("status")).toBeNull();
    expect(next.get("cara")).toBeNull();
    expect(next.get("page")).toBeNull();
    expect(next.get("search")).toBe("printer");
  });

  test("tanpa VIEW: tanpa akses dan tanpa memanggil be-sada", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Siklus Aset"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });
});

describe("tombol tambah per tab", () => {
  test.each([
    ["", ["VIEW", "CREATE"], "Catat perawatan", "/perawatan/baru"],
    ["jenis=pindah", ["VIEW", "CREATE"], "Pindahkan barang", "/pindah/baru"],
    [
      "jenis=pelepasan",
      ["VIEW", "DELETE"],
      "Ajukan pelepasan",
      "/pelepasan/baru",
    ],
  ] as const)("%s → %s", async (query, granted, label, path) => {
    onRender([...granted], query);

    const link = await screen.findByRole("link", { name: label });
    expect(link.getAttribute("href")).toBe(`${CYCLE_LIST_PATH}${path}`);
  });

  test("pelepasan butuh DELETE, bukan CREATE", async () => {
    onRender(["VIEW", "CREATE"], "jenis=pelepasan");

    await screen.findByText(/\d+ pelepasan/);
    expect(screen.queryByRole("link", { name: "Ajukan pelepasan" })).toBeNull();
  });

  test("perawatan tanpa UPDATE: tanpa tautan ubah", async () => {
    onRender(["VIEW"]);

    await screen.findByText(/\d+ perawatan/);
    expect(
      screen.queryAllByRole("link", { name: /^Ubah perawatan/ }),
    ).toHaveLength(0);
  });
});
