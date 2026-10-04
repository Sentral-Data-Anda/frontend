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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { BudgetReport } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/anggaran/laporan-budget",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = actions.current[slug] ?? [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { ReportListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  search.current = "";
});

const ALL = ["VIEW", "CREATE", "UPDATE", "DELETE"] as MenuAction[];

const report = (next: Partial<BudgetReport> = {}): BudgetReport => ({
  publicId: "lpb-0001",
  code: "LPB-2026-0001",
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  year: 2026,
  month: 9,
  label: "September 2026",
  status: "DRAFT",
  totalAmount: "10750000",
  approval: null,
  waiver: null,
  lineCount: 4,
  receiptCount: 3,
  ...next,
});

const onRender = (
  rows: BudgetReport[],
  granted: Record<string, MenuAction[]> = { LAPORAN_BUDGET: ALL },
) => {
  const calls: string[] = [];

  actions.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);

    if (url.startsWith("/api/v1/ddl")) {
      return Response.json({ status: 200, data: [] });
    }

    return rows.length > 0
      ? Response.json({
          status: 200,
          message: "ok",
          totalData: rows.length,
          totalPage: 1,
          data: rows,
        })
      : Response.json(
          { status: 404, error: "Laporan Pemakaian Budget Tidak Ditemukan" },
          { status: 404 },
        );
  }) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReportListScreen />
    </QueryClientProvider>,
  );

  return calls;
};

describe("daftar laporan", () => {
  test("baris menampilkan kode dan menaut dengan publicId", async () => {
    onRender([report()]);

    const link = await screen.findByRole("link", {
      name: "Lihat laporan September 2026 Komisi Pemuda",
    });

    expect(link.getAttribute("href")).toBe("/anggaran/laporan-budget/lpb-0001");
    expect(screen.getAllByText(/LPB-2026-0001/).length).toBeGreaterThan(0);
  });

  test("lencana diturunkan dari approval, bukan dari status dokumen", async () => {
    onRender([
      report({
        approval: {
          publicId: "apr-1",
          code: "APR-2026-0001",
          status: "PENDING",
          currentOrder: 1,
          isSubmittedByViewer: true,
          steps: [
            {
              publicId: "aps-1",
              order: 1,
              approverRoleName: "Ketua Pengurus",
              status: "PENDING",
              note: null,
              actedAt: null,
              actor: null,
            },
            {
              publicId: "aps-2",
              order: 2,
              approverRoleName: "Sekretaris/Bendahara Pengurus",
              status: "PENDING",
              note: null,
              actedAt: null,
              actor: null,
            },
          ],
        },
      }),
    ]);

    expect(
      await screen.findByText("Menunggu persetujuan (1 dari 2)"),
    ).toBeTruthy();
    expect(screen.queryByText("Draf")).toBeNull();
  });

  test("daftar menampilkan hitungan baris dan kwitansi, bukan isinya", async () => {
    onRender([report()]);

    await screen.findByText("September 2026");

    expect(document.querySelectorAll("img")).toHaveLength(0);
    expect(screen.queryByText("Rincian pemakaian")).toBeNull();
  });

  test("daftar kosong mengundang menambah laporan", async () => {
    onRender([]);

    expect(
      await screen.findByText("Belum ada laporan pemakaian budget"),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Tambah laporan" }).length,
    ).toBeGreaterThan(0);
  });

  test("tanpa VIEW layar tidak meminta datanya", async () => {
    const calls = onRender([report()], {});

    expect(
      await screen.findByText("Anda tidak memiliki akses ke Laporan Budget"),
    ).toBeTruthy();
    expect(calls.filter((url) => url.includes("laporan-budget"))).toHaveLength(
      0,
    );
  });

  test("bawaan daftar memakai tahun kalender berjalan, bulan semua", async () => {
    const calls = onRender([report()]);

    await waitFor(() =>
      expect(calls.some((url) => url.includes("/laporan-budget?"))).toBe(true),
    );

    const url = calls.find((item) => item.includes("/laporan-budget?")) ?? "";

    expect(url).toContain(`year=${new Date().getFullYear()}`);
    expect(url).not.toContain("month=");
  });

  test("tab Belum lapor hidup di rute yang sama", async () => {
    search.current = "tab=belum-lapor";
    onRender([report()]);

    expect(
      await screen.findByRole("tab", { name: "Belum lapor" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Bulan")).toBeTruthy();
  });
});
