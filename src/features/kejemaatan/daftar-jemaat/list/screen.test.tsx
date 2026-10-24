import { Toast } from "@base-ui/react/toast";
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

// The jemaat list is the worklist for filling households in: a jemaat outside
// one is counted by no wilayah and carries no family name, so the screen has to
// be able to show exactly who is left.
describe("filter keluarga di daftar jemaat", () => {
  test("tanpa filter: tidak menyebut household sama sekali", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10");
  });

  test("keluarga=none dari URL → household=none", async () => {
    onRender(["VIEW"], "keluarga=none");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10&household=none");
  });

  test("keluarga=any dari URL → household=any", async () => {
    onRender(["VIEW"], "keluarga=any");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe("/api/v1/jemaat?page=1&limit=10&household=any");
  });

  // Placing people is done per wilayah in practice, so the two filters have to
  // survive each other.
  test("bersama filter wilayah, keduanya terkirim", async () => {
    onRender(["VIEW"], "keluarga=none&wilayah=3");

    expect(await screen.findByText("Tidak ada jemaat")).toBeTruthy();
    expect(urls[0]).toBe(
      "/api/v1/jemaat?page=1&limit=10&zone=3&household=none",
    );
  });

  test("filter aktif menawarkan jalan keluar, bukan jalan buntu", async () => {
    onRender(["VIEW"], "keluarga=none");

    expect(
      await screen.findByText(
        "Tidak ada jemaat yang cocok dengan pencarian atau filter ini.",
      ),
    ).toBeTruthy();
  });
});
