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

import { hariLiburMock } from "../../../../../scripts/mock/handlers/hari-libur";
import { onStubViewport } from "../../../../../tests/viewport";

const search = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/settings/holiday",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: true,
    isCanCreate: true,
    isCanUpdate: true,
    isCanDelete: true,
  }),
}));

const { HolidayListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");

    return hariLiburMock({
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

afterEach(cleanup);

const onRenderPage = async (query: string) => {
  search.current = query;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <HolidayListScreen />
    </QueryClientProvider>,
  );

  await screen.findByText("13 hari libur");

  return [...document.querySelectorAll<HTMLElement>("[data-row-id]")].map(
    (row) => row.dataset.rowId,
  );
};

describe("daftar dengan filter Tahun", () => {
  test("halaman 1 penuh 10 baris, halaman 2 melanjutkan urutan server", async () => {
    const first = await onRenderPage("tahun=2026");
    cleanup();
    const second = await onRenderPage("tahun=2026&page=2");

    expect(first).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "13"]);
    expect(second).toEqual(["10", "11", "12"]);
  });

  // Lebar tabel, karena itu yang distub berkas ini: tanggalnya kolom pendek
  // `formatHolidayDateShort`, tipenya kolom sendiri. Baris HP dengan metanya
  // yang disambung `·` punya penjaganya sendiri di `list-item.test.tsx`.
  test("kolom tanggal dari server, badge memakai tahun asal", async () => {
    await onRenderPage("tahun=2026");

    expect(screen.getByText("Minggu, 27 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Berulang sejak 1985")).toBeTruthy();
    expect(screen.getAllByText("Gereja").length).toBeGreaterThan(0);
  });
});
