import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/kejemaatan/report-jemaat",
  useSearchParams: () => new URLSearchParams("bulan=3"),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({ isCanView: actions.current.includes("VIEW") }),
}));

const { ReportJemaatScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const requested: string[] = [];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requested.length = 0;
});

const onRender = (granted: MenuAction[]) => {
  actions.current = granted;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));
    return Promise.resolve(
      Response.json({ status: 200, message: "OK", data: [] }),
    );
  }) as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReportJemaatScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang VIEW", () => {
  test("tanpa VIEW: pesan tanpa akses dan tidak ada request", async () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Laporan Jemaat"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: "Ringkasan jemaat" }),
    ).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requested).toEqual([]);
  });

  test("dengan VIEW: semua laporan dimuat, ulang tahun memakai bulan di URL", async () => {
    onRender(["VIEW"]);

    await waitFor(() => expect(requested).toHaveLength(9));

    expect(requested).toContain("/api/v1/report/jemaat/birth/3");
    expect(
      screen.queryByText("Anda tidak memiliki akses ke Laporan Jemaat"),
    ).toBeNull();
  });
});
