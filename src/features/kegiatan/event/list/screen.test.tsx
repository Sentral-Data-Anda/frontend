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

import { eventMock } from "../../../../../scripts/mock/handlers/event";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];
const search = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/kegiatan/event",
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

const { EventListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    requested.push(`${url.pathname}${url.search}`);

    if (url.pathname.startsWith("/api/v1/ddl/")) {
      return Response.json({ status: 200, message: "OK", data: [] });
    }

    return eventMock({
      request: new Request(url),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
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
      <EventListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar event", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memanggil be-sada", () => {
    onRenderList([]);

    expect(screen.getByText("Anda tidak memiliki akses ke Event")).toBeTruthy();
    expect(requested).toEqual([]);
  });

  test("filter Bulan dan Status → rentang, isPublish, terbaru dulu", async () => {
    search.current = "bulan=2026-10&status=draf";
    onRenderList(["VIEW"]);

    await screen.findByText(/\d+ event/);
    search.current = "";
    const listCall = requested.find((url) => url.startsWith("/api/v1/event?"));
    const query = new URLSearchParams(listCall?.split("?")[1]);

    expect(query.get("startDate")).toBe("2026-10-01");
    expect(query.get("endDate")).toBe("2026-10-31");
    expect(query.get("isPublish")).toBe("0");
    expect(query.get("order")).toBe("desc");
    expect(query.has("status")).toBe(false);
  });

  test("VIEW saja: tanpa Tambah dan tanpa tautan ubah", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText(/\d+ event/);
    expect(screen.queryByRole("link", { name: "Tambah event" })).toBeNull();
    expect(screen.queryAllByRole("link", { name: /^Ubah / })).toHaveLength(0);
  });

  test("CREATE dan UPDATE: Tambah ke form baru dan baris ke form ubah", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE"]);

    await screen.findByText(/\d+ event/);
    expect(
      screen.getByRole("link", { name: "Tambah event" }).getAttribute("href"),
    ).toBe("/kegiatan/event/baru");
    expect(
      screen.getAllByRole("link", { name: /^Ubah / }).length,
    ).toBeGreaterThan(0);
  });
});
