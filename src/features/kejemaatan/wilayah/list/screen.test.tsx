import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/kejemaatan/wilayah",
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

const { WilayahListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let onRestoreViewport = () => {};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  onRestoreViewport();
});

const onRender = (isDesktop: boolean, granted: MenuAction[]) => {
  actions.current = granted;
  onRestoreViewport = onStubViewport(isDesktop).onRestore;

  const requests: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(String(input));

    return Response.json({
      status: 200,
      message: "",
      data: [
        {
          id: 1,
          code: "WIL-1",
          name: "Wilayah Uji Satu",
          isActive: true,
          description: null,
          memberCount: 0,
        },
      ],
      totalData: 1,
      totalPage: 1,
    });
  }) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <WilayahListScreen />
    </QueryClientProvider>,
  );

  return requests;
};

describe.each([
  ["desktop", true],
  ["mobile", false],
])("daftar wilayah, gerbang VIEW (%s)", (_name, isDesktop) => {
  test("tanpa VIEW: nol permintaan ke /zone-church dan keadaan tanpa akses", async () => {
    const requests = onRender(isDesktop, ["CREATE", "UPDATE"]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Wilayah"),
    ).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requests).toEqual([]);
  });

  test("dengan VIEW: meminta /zone-church dan menampilkan barisnya", async () => {
    const requests = onRender(isDesktop, ["VIEW"]);

    await waitFor(() =>
      expect(screen.getAllByText("Wilayah Uji Satu").length).toBeGreaterThan(0),
    );
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((url) => url.includes("/zone-church"))).toBe(true);
  });
});
