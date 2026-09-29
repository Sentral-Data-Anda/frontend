import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
import type { Currency, Rate } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/mata-uang/USD",
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

const { CurrencyDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
});

const USD: Currency = {
  id: 2,
  publicId: "c-2",
  code: "USD",
  name: "Dolar Amerika",
  symbol: "US$",
  isBase: false,
  latestRate: null,
};

const IDR: Currency = {
  ...USD,
  id: 1,
  code: "IDR",
  name: "Rupiah",
  symbol: "Rp",
  isBase: true,
};

const RATE: Rate = {
  id: 4,
  publicId: "r-4",
  currencyCode: "USD",
  rateDate: "2026-09-27T00:00:00.000Z",
  rate: "15800",
  source: "MANUAL",
  currency: { publicId: "c-2", code: "USD", name: "Dolar Amerika" },
};

const onMockApi = (currency: Currency, isDeleteRejected = false) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push(`${method} ${url}`);

    if (method === "DELETE" && isDeleteRejected) {
      const error =
        "Mata Uang Ini Masih Dipakai Oleh Permintaan, Pesanan, Faktur Atau Kurs";
      return Response.json({ status: 400, error }, { status: 400 });
    }
    if (method === "DELETE") {
      return Response.json({ status: 200, message: "Berhasil Menghapus" });
    }
    if (url.startsWith("/api/v1/mata-uang/kurs?")) {
      return Response.json({
        status: 200,
        totalData: 1,
        totalPage: 1,
        data: [RATE],
      });
    }

    return Response.json({ status: 200, data: currency });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[], code: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <CurrencyDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("halaman mata uang", () => {
  test("tanpa VIEW: keadaan akses, tanpa memuat", () => {
    const calls = onMockApi(USD);
    onRender([], "USD");

    expect(
      screen.getByText("Anda tidak memiliki akses ke Mata Uang"),
    ).toBeTruthy();
    expect(calls).toEqual([]);
  });

  test("IDR: tanpa daftar kurs, tanpa Hapus dan Tambah kurs walau berizin penuh", async () => {
    const calls = onMockApi(IDR);
    onRender(["VIEW", "CREATE", "UPDATE", "DELETE"], "IDR");

    expect(await screen.findByText("1 Rupiah = 1 Rupiah")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tambah kurs" })).toBeNull();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
    expect(calls.some((call) => call.includes("/kurs"))).toBe(false);
  });

  test("hanya VIEW: kurs tampil tanpa aksi apa pun", async () => {
    onMockApi(USD);
    onRender(["VIEW"], "USD");

    expect(await screen.findByText("Belum ada kurs")).toBeTruthy();
    expect(await screen.findByText("Rp 15.800")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tambah kurs" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Hapus/ })).toBeNull();
  });

  test("hapus mata uang yang dipakai: pesan server tampil, tetap di halaman", async () => {
    onMockApi(USD, true);
    onRender(["VIEW", "DELETE"], "USD");

    fireEvent.click(await screen.findByRole("button", { name: "Hapus" }));
    expect(
      screen.getByText(
        "Apakah Anda ingin menghapus mata uang USD (Dolar Amerika)?",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Mata uang belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("hapus kurs memakai teks konfirmasi khusus", async () => {
    const calls = onMockApi(USD);
    onRender(["VIEW", "DELETE"], "USD");

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Hapus kurs 27 September 2026",
      }),
    );
    expect(
      screen.getByText(
        "Apakah Anda ingin menghapus kurs USD tanggal 27 September 2026? Pesanan yang sudah memakainya tidak berubah.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(calls).toContain("DELETE /api/v1/mata-uang/kurs/4"),
    );
  });
});
