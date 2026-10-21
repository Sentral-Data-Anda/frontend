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
import type { Currency } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/currency",
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

const { CurrencyListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const ROWS: Currency[] = [
  {
    id: 1,
    publicId: "c-1",
    code: "IDR",
    name: "Rupiah",
    symbol: "Rp",
    isBase: true,
    latestRate: null,
  },
  {
    id: 2,
    publicId: "c-2",
    code: "USD",
    name: "Dolar Amerika",
    symbol: "US$",
    isBase: false,
    latestRate: { rate: "15800", rateDate: "2026-09-25T00:00:00.000Z" },
  },
  {
    id: 4,
    publicId: "c-4",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    isBase: false,
    latestRate: null,
  },
];

const onRender = (granted: MenuAction[]) => {
  actions.current = granted;
  globalThis.fetch = (async () =>
    Response.json({
      status: 200,
      totalData: ROWS.length,
      totalPage: 1,
      data: ROWS,
    })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Toast.Provider>
        <CurrencyListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("daftar mata uang", () => {
  test("baris: dasar, kurs terakhir, belum ada kurs", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Mata uang dasar")).toBeTruthy();
    expect(screen.getByText("Rp 15.800 · 25 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Belum ada kurs")).toBeTruthy();
    expect(screen.getByText("3 mata uang")).toBeTruthy();
  });

  test("tambah hanya dengan CREATE", async () => {
    onRender(["VIEW"]);
    await screen.findByText("Mata uang dasar");
    expect(screen.queryByRole("link", { name: "Tambah mata uang" })).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(screen.getByRole("link", { name: "Tambah mata uang" })).toBeTruthy();
  });

  test("tanpa VIEW: keadaan akses", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Currency"),
    ).toBeTruthy();
  });

  test("Hapus hanya dengan DELETE, dan tidak untuk mata uang dasar", async () => {
    onRender(["VIEW"]);
    await screen.findByText("Mata uang dasar");
    expect(
      screen.queryAllByRole("button", { name: /^Hapus mata uang/ }),
    ).toHaveLength(0);

    cleanup();
    onRender(["VIEW", "DELETE"]);
    await screen.findByText("Mata uang dasar");

    const names = screen
      .getAllByRole("button", { name: /^Hapus mata uang/ })
      .map((button) => button.getAttribute("aria-label"));

    expect(names).toEqual(
      ROWS.filter((row) => !row.isBase).map(
        (row) => `Hapus mata uang ${row.code} ${row.name}`,
      ),
    );
  });

  test("Hapus membuka dialog konfirmasi bernama baris itu", async () => {
    onRender(["VIEW", "DELETE"]);
    await screen.findByText("Mata uang dasar");

    const row = ROWS[1];

    fireEvent.click(
      screen.getByRole("button", {
        name: `Hapus mata uang ${row.code} ${row.name}`,
      }),
    );

    expect(await screen.findByText("Hapus mata uang ini?")).toBeTruthy();
    expect(
      screen.getByText(
        `${row.code} ${row.name} akan dihapus. Tindakan ini tidak bisa dibatalkan.`,
      ),
    ).toBeTruthy();
  });
});
