import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { JournalEntry } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/journal-entry",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { JournalListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  query.current = "";
});

const ROWS: JournalEntry[] = [
  {
    id: "jrn-1",
    publicId: "jrn-1",
    code: "JRN-2026-0001",
    entryDate: "2026-01-01T00:00:00.000Z",
    description: "Saldo awal per 1 Januari",
    status: "POSTED",
    sourceType: "MANUAL",
    source: { type: "MANUAL", id: null },
    reversalOfId: null,
    isReversal: false,
    fiscalPeriod: { year: 2026, month: 1, status: "OPEN" },
    postedBy: { name: "Bendahara" },
    postedAt: "2026-01-01T03:00:00.000Z",
    lineCount: 3,
    totalDebit: "82750000",
  },
  {
    id: "jrn-2",
    publicId: "jrn-2",
    code: "JRN-2026-0002",
    entryDate: "2026-01-08T00:00:00.000Z",
    description: "Persembahan kolekte",
    status: "DRAFT",
    sourceType: "PERSEMBAHAN",
    source: { type: "PERSEMBAHAN", id: 11 },
    reversalOfId: null,
    isReversal: false,
    fiscalPeriod: { year: 2026, month: 1, status: "OPEN" },
    postedBy: null,
    postedAt: null,
    lineCount: 2,
    totalDebit: "6420000",
  },
];

const ACCOUNTS = [
  { id: 2, code: "1-100", name: "Kas", type: "ASSET", isActive: true },
];

const onMockApi = (rows: JournalEntry[], accounts = ACCOUNTS) => {
  const urls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    urls.push(url);

    if (url.startsWith("/api/v1/ddl/account")) {
      return accounts.length === 0
        ? Response.json(
            { status: 404, error: "Akun Tidak Ditemukan" },
            { status: 404 },
          )
        : Response.json({
            status: 200,
            totalData: accounts.length,
            totalPage: 1,
            data: accounts,
          });
    }

    return rows.length === 0
      ? Response.json(
          { status: 404, error: "Jurnal Tidak Ditemukan" },
          { status: 404 },
        )
      : Response.json({
          status: 200,
          totalData: rows.length,
          totalPage: 1,
          data: rows,
        });
  }) as typeof fetch;

  return urls;
};

const onRenderList = (
  granted: MenuAction[],
  rows: JournalEntry[] = ROWS,
  accounts = ACCOUNTS,
) => {
  actions.current = granted;

  const urls = onMockApi(rows, accounts);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <JournalListScreen />
    </QueryClientProvider>,
  );

  return urls;
};

describe("JournalListScreen", () => {
  test("bawaan meminta tahun berjalan dan semua status", async () => {
    const urls = onRenderList(["VIEW"]);

    await waitFor(() =>
      expect(urls.some((url) => url.startsWith("/api/v1/jurnal?"))).toBe(true),
    );

    const listUrl = urls.find((url) => url.startsWith("/api/v1/jurnal?")) ?? "";
    const params = new URL(listUrl, "http://localhost").searchParams;

    expect(params.get("year")).toBe(todayJakarta().slice(0, 4));
    expect(params.get("status")).toBeNull();
  });

  test("baris membawa kode, jumlah baris, total, dan sumbernya", async () => {
    onRenderList(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Saldo awal per 1 Januari")).toBeTruthy(),
    );

    expect(screen.getByText(/JRN-2026-0001/)).toBeTruthy();
    expect(screen.getByText(/3 baris/)).toBeTruthy();
    expect(screen.getAllByText(/Rp\s?82.750.000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/JRN-2026-0002.*Persembahan/)).toBeTruthy();
  });

  test("buku kosong mengatakan saldo awal masuk di sini", async () => {
    onRenderList(["VIEW", "CREATE"], []);

    await waitFor(() =>
      expect(screen.getByText("Belum ada entri jurnal")).toBeTruthy(),
    );

    expect(screen.getByText(/Saldo awal gereja/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Tambah entri/ })).toBeTruthy();
  });

  test("tanpa akun, keadaan kosong menyuruh buat akun dulu", async () => {
    onRenderList(["VIEW", "CREATE"], [], []);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Buat akun dulu" })).toBeTruthy(),
    );
  });

  /**
   * Keempatnya, bukan hanya persembahan.
   *
   * Posting Aset, Pengadaan, dan Persediaan sudah punya rutenya masing-masing
   * sejak fase-fase sebelumnya dan tidak satu pun pernah ditautkan dari
   * mana-mana — jadi satu-satunya cara mencapainya adalah mengetik URL-nya.
   * Rute tanpa tautan sama dengan rute yang tidak ada.
   */
  test.each([
    ["Persembahan", "/finance/journal-entry/posting-persembahan"],
    ["Aset sumbangan", "/finance/journal-entry/posting-aset"],
    ["Pengadaan", "/finance/journal-entry/posting-pengadaan"],
    ["Persediaan", "/finance/journal-entry/posting-persediaan"],
  ])("izin create membuka jalan ke Posting %s", async (label, href) => {
    onRenderList(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: label })).toBeTruthy(),
    );

    expect(screen.getByRole("link", { name: label }).getAttribute("href")).toBe(
      href,
    );
  });

  test("tanpa izin create, keempat posting dan Tambah tidak dirender", async () => {
    onRenderList(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Saldo awal per 1 Januari")).toBeTruthy(),
    );

    expect(
      screen.queryByRole("link", { name: /Posting persembahan/ }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /Tambah entri/ })).toBeNull();
  });

  test("tanpa izin lihat, daftar menolak dengan pesan akses", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Jurnal"),
    ).toBeTruthy();
  });
});
