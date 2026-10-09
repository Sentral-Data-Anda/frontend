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

import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/fixed-asset/asset-master",
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

const { BarangListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const urls: string[] = [];
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  urls.length = 0;
  search.current = "";
});

const onRender = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = query;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input));

    return Response.json(
      { status: 404, error: "Barang Tidak Ditemukan" },
      { status: 404 },
    );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BarangListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar barang", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Barang"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tambah hanya dengan CREATE; kosong mengajak mencatat", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada barang")).toBeTruthy();
    expect(
      screen.getByText(
        "Catat aset gereja seperti proyektor, alat musik, atau kendaraan.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tambah barang" })).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(
      await screen.findByRole("link", { name: "Tambah barang" }),
    ).toBeTruthy();
  });

  test("filter URL → query be-sada; kosong karena filter", async () => {
    onRender(
      ["VIEW"],
      "status=dilepas&kondisi=HILANG&sumber=GRANT&tipe=3&ruang=2&bapel=1",
    );

    expect(
      await screen.findByText("Tidak ada barang yang cocok dengan filter ini."),
    ).toBeTruthy();
    expect(urls[0]).toBe(
      "/api/v1/asset?page=1&limit=10&status=dilepas&condition=HILANG&acquisitionSource=GRANT&typeId=3&roomId=2&bapelId=1",
    );
  });
});
