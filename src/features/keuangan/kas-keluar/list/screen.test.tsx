import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { expenseApproval, expenseDetail } from "../fixtures";
import type { CashExpense } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/kas-keluar",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const actions = granted.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { ExpenseListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
  search.current = "";
});

const rowOf = (next: Partial<CashExpense> = {}): CashExpense => {
  const detail = expenseDetail();

  return { ...detail, lineCount: detail.lines.length, ...next };
};

const onRender = (rows: CashExpense[], access: MenuAction[] = ["VIEW"]) => {
  const urls: string[] = [];

  granted.current = { [MENU.KAS_KELUAR]: access };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);

    if (url.includes("/ddl/")) {
      return Response.json(
        { status: 404, error: "Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({
      status: 200,
      message: "ok",
      totalData: rows.length,
      totalPage: 1,
      data: rows,
    });
  }) as typeof fetch;

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExpenseListScreen />
    </QueryClientProvider>,
  );

  return urls;
};

describe("daftar kas keluar", () => {
  test("baris menampilkan penerima, total, dan keadaan turunan", async () => {
    onRender([rowOf({ approval: expenseApproval() })]);

    expect(await screen.findByText("CV Tirta Nusantara")).toBeTruthy();
    expect(screen.getByText("Rp 3.200.000")).toBeTruthy();
    expect(screen.getByText("Menunggu persetujuan")).toBeTruthy();
  });

  test("ditolak: penanda di baris meta, status tetap Draf, tanpa lencana kedua", async () => {
    onRender([
      rowOf({
        approval: expenseApproval({
          status: "REJECTED",
          note: "Kas komisi belum cukup bulan ini.",
        }),
      }),
    ]);

    const mark = await screen.findByText(
      /Ditolak · Kas komisi belum cukup bulan ini\./,
    );

    const rows = within(screen.getByLabelText("Daftar kas keluar"));

    expect(mark.className).toContain("text-warning-foreground");
    expect(rows.getByText("Draf")).toBeTruthy();
    expect(rows.queryByText("Ditolak")).toBeNull();
  });

  test("tanpa kata Debit atau Kredit", async () => {
    onRender([rowOf()]);

    await screen.findByText("CV Tirta Nusantara");
    expect(document.body.textContent).not.toContain("Debit");
    expect(document.body.textContent).not.toContain("Kredit");
  });

  test("pencarian referensi dikirim sebagai filter ke server", async () => {
    search.current = "search=PSN-2026-0012";
    const urls = onRender([rowOf()]);

    await waitFor(() =>
      expect(urls.some((url) => url.includes("/kas-keluar?"))).toBe(true),
    );
    const listUrl = urls.find((url) => url.includes("/kas-keluar?"))!;

    expect(new URL(listUrl, "http://x").searchParams.get("filter")).toBe(
      "PSN-2026-0012",
    );
  });

  test("bawaan menyaring bulan berjalan", async () => {
    const urls = onRender([rowOf()]);

    await waitFor(() =>
      expect(urls.some((url) => url.includes("startDate="))).toBe(true),
    );
  });

  test("tambah hanya dengan CREATE", async () => {
    onRender([rowOf()]);

    await screen.findByText("CV Tirta Nusantara");
    expect(screen.queryByLabelText("Tambah kas keluar")).toBeNull();

    cleanup();
    onRender([rowOf()], ["VIEW", "CREATE"]);

    expect(await screen.findByLabelText("Tambah kas keluar")).toBeTruthy();
  });

  test("kosong di bulan berjalan menyebut bawaannya, bukan 'belum ada'", async () => {
    onRender([]);

    expect(await screen.findByText("Tidak ada kas keluar")).toBeTruthy();
    expect(screen.queryByText("Belum ada kas keluar")).toBeNull();
    expect(screen.getByText(/Bawaannya hanya bulan berjalan/)).toBeTruthy();
  });

  test("kosong di semua bulan mengundang mencatat pengeluaran", async () => {
    search.current = "bulan=semua";
    onRender([]);

    expect(await screen.findByText("Belum ada kas keluar")).toBeTruthy();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan daftar", () => {
    let isFetched = false;
    granted.current = {};
    globalThis.fetch = (async () => {
      isFetched = true;

      return Response.json({ status: 200, data: [] });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ExpenseListScreen />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kas Keluar"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});

describe("indikator bawaan bulan berjalan", () => {
  test("bawaan berbadge, bulan=semua tidak", async () => {
    onRender([rowOf()]);
    await screen.findByText("CV Tirta Nusantara");

    expect(
      screen.getByRole("button", { name: "Filter, 1 aktif" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hapus filter Bulan: Bulan ini" }),
    ).toBeTruthy();

    cleanup();
    search.current = "bulan=semua";
    onRender([rowOf()]);
    await screen.findByText("CV Tirta Nusantara");

    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Filter aktif" })).toBeNull();
  });
});
