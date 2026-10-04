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

import type { ComplianceState } from "@/types/anggaran";

import { onStubViewport } from "../../../../../tests/viewport";
import type { ComplianceRow } from "../types";

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/anggaran/laporan-budget",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: true,
    isCanCreate: true,
    isCanUpdate: true,
    isCanDelete: true,
  }),
}));

const { PendingContent } = await import("./pending-content");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const MONTH = "2026-09";

const row = (
  bapelId: number,
  name: string,
  state: ComplianceState,
  next: Partial<ComplianceRow> = {},
): ComplianceRow => ({
  bapelId,
  bapel: { publicId: `bpl-${bapelId}`, code: `BPL-${bapelId}`, name },
  state,
  label: "September 2026",
  report: null,
  disbursementCount: 1,
  disbursementTotal: "920000",
  waiver: null,
  ...next,
});

const onRender = (rows: ComplianceRow[], isCanCreate = true) => {
  globalThis.fetch = (async (_input: RequestInfo | URL) =>
    Response.json({ status: 200, message: "ok", data: rows })) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PendingContent
        month={MONTH}
        isCanCreate={isCanCreate}
        onPickMonth={() => {}}
      />
    </QueryClientProvider>,
  );
};

describe("kepatuhan laporan per komisi", () => {
  test("nol pencairan berbunyi Tidak wajib lapor, bukan Belum lapor", async () => {
    onRender([
      row(5, "Komisi Musik", "NOT_DUE", {
        disbursementCount: 0,
        disbursementTotal: "0",
      }),
    ]);

    expect(await screen.findByText("Tidak wajib lapor")).toBeTruthy();
    expect(screen.queryByText("Belum lapor")).toBeNull();
    expect(screen.getByText("0 pencairan · Rp 0")).toBeTruthy();
  });

  test("ada pencairan tanpa laporan berbunyi Belum lapor dan menawarkan tambah", async () => {
    onRender([row(4, "Komisi Anak", "MISSING")]);

    expect(await screen.findByText("Belum lapor")).toBeTruthy();

    const link = screen.getByRole("link", { name: "Tambah laporan" });

    expect(link.getAttribute("href")).toBe(
      `/anggaran/laporan-budget/baru?komisi=4&bulan=${MONTH}`,
    );
  });

  test("laporan draf berbunyi Draf dan menaut ke laporannya", async () => {
    onRender([
      row(2, "Komisi Pemuda", "DRAFT", {
        report: { publicId: "lpb-0001", code: "LPB-2026-0001" },
      }),
    ]);

    expect(await screen.findByText("Draf")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "LPB-2026-0001" }).getAttribute("href"),
    ).toBe("/anggaran/laporan-budget/lpb-0001");
    expect(screen.queryByRole("link", { name: "Tambah laporan" })).toBeNull();
  });

  test("laporan disetujui berbunyi Disetujui", async () => {
    onRender([
      row(2, "Komisi Pemuda", "APPROVED", {
        report: { publicId: "lpb-0001", code: "LPB-2026-0001" },
      }),
    ]);

    expect(await screen.findByText("Disetujui")).toBeTruthy();
  });

  test("pembebasan berbunyi Dibebaskan dengan alasannya utuh", async () => {
    const reason = "C".repeat(250);

    onRender([
      row(4, "Komisi Anak", "WAIVED", {
        waiver: {
          reason,
          createdBy: { name: "Daniel Panjaitan" },
          createdAt: "2026-10-02T02:00:00.000Z",
        },
      }),
    ]);

    expect(await screen.findByText("Dibebaskan")).toBeTruthy();
    expect(screen.getByText(new RegExp(reason))).toBeTruthy();
  });

  test("tanpa izin tambah, baris Belum lapor tidak menawarkan tombolnya", async () => {
    onRender([row(4, "Komisi Anak", "MISSING")], false);

    await screen.findByText("Belum lapor");

    expect(screen.queryByRole("link", { name: "Tambah laporan" })).toBeNull();
  });

  test("kosong memakai teks biasa", async () => {
    onRender([]);

    expect(
      await screen.findByText("Belum ada komisi untuk bulan ini."),
    ).toBeTruthy();
  });
});
