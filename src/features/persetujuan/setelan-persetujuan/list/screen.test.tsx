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

import { setelanPersetujuanMock } from "../../../../../scripts/mock/handlers/setelan-persetujuan";
import { onStubViewport } from "../../../../../tests/viewport";

const search = { current: "" };
const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/persetujuan/setelan-persetujuan",
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

const { SetelanListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const response = await setelanPersetujuanMock({
      request: new Request(url),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
      method: "GET",
      can: (_slug, action) => actions.current.includes(action),
      isAdmin: false,
      sessionCode: "test",
    });

    return response ?? Response.json({}, { status: 404 });
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(cleanup);

const onRenderList = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = query;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SetelanListScreen />
    </QueryClientProvider>,
  );
};

const rowNames = () =>
  [...document.querySelectorAll<HTMLElement>("[data-row-id]")].map(
    (row) => row.querySelector("span")?.textContent,
  );

describe("filter", () => {
  test("jenis dokumen → documentType, urut id", async () => {
    onRenderList(["VIEW"], "jenis=CASH_EXPENSE");

    expect(await screen.findByText(/^\d+ alur$/)).toBeTruthy();
    expect(rowNames().slice(0, 4)).toEqual([
      "Kas keluar kecil",
      "Kas keluar besar",
      "Kas keluar Komisi Pemuda",
      "Kas keluar lama",
    ]);
  });

  test("status Nonaktif → isActive=false", async () => {
    onRenderList(["VIEW"], "status=false");

    await screen.findByText("Kas keluar lama");

    expect(rowNames()).toContain("Kas keluar lama");
    expect(rowNames()).not.toContain("Kas keluar kecil");
  });

  test("filter tanpa hasil: kosong karena filter + Hapus filter", async () => {
    onRenderList(["VIEW"], "jenis=LOAN_ROOM");

    expect(
      await screen.findByText(
        "Tidak ada alur untuk jenis dokumen atau status ini.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus filter" })).toBeTruthy();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan tanpa akses, bukan daftar", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Setelan Alur Persetujuan"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Filter/ })).toBeNull();
  });

  test("VIEW saja: tanpa Tambah, baris tetap bisa dibuka (lihat)", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText("Kas keluar kecil");

    expect(screen.queryByRole("link", { name: "Tambah alur" })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Lihat alur Kas keluar kecil" })
        .getAttribute("href"),
    ).toBe(
      "/persetujuan/setelan-persetujuan/00000000-0000-4000-8000-000000000001/ubah",
    );
  });

  test("CREATE + UPDATE: Tambah dan aksi ubah", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE"]);

    await screen.findByText("Kas keluar kecil");

    expect(screen.getByRole("link", { name: "Tambah alur" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ubah alur Kas keluar kecil" }),
    ).toBeTruthy();
  });
});
