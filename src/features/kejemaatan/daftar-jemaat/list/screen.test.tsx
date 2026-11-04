import { Toast } from "@base-ui/react/toast";
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

import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/kejemaatan/jemaat",
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

const { JemaatListScreen } = await import("./screen");

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

    return Response.json({ status: 200, data: [], totalData: 0 });
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JemaatListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("filter tipe jemaat di daftar jemaat", () => {
  test("tanpa filter: tidak menyebut type sama sekali", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10");
  });

  test("tipe=ANGGOTA dari URL → type=ANGGOTA", async () => {
    onRender(["VIEW"], "tipe=ANGGOTA");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10&type=ANGGOTA");
  });

  test("tipe=SIMPATISAN dari URL → type=SIMPATISAN", async () => {
    onRender(["VIEW"], "tipe=SIMPATISAN");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10&type=SIMPATISAN");
  });

  // Wilayah dan tipe dipakai bersama untuk menyaring daftar yang sama.
  test("bersama filter wilayah, keduanya terkirim", async () => {
    onRender(["VIEW"], "tipe=ANGGOTA&wilayah=3");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10&zone=3&type=ANGGOTA");
  });

  test("filter aktif menawarkan jalan keluar, bukan jalan buntu", async () => {
    onRender(["VIEW"], "tipe=ANGGOTA");

    expect(
      await screen.findByText(
        "Tidak ada jemaat yang cocok dengan pencarian atau filter ini.",
      ),
    ).toBeTruthy();
  });

  test("panel filter menawarkan Anggota dan Simpatisan, bukan Keluarga", async () => {
    onRender(["VIEW"]);

    await screen.findByText("Tidak ada jemaat");
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(await screen.findByRole("radio", { name: "Anggota" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Simpatisan" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: /keluarga/i })).toBeNull();
  });
});
