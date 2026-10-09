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

import type { CeilingUsage } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { BudgetAllocationDetail, YearProgram } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/budgeting/budget/pga-1",
  useSearchParams: () => new URLSearchParams(),
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

const { AllocationDetailScreen } = await import("./screen");

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

const YEAR = 2026;

const usage: CeilingUsage = {
  year: YEAR,
  ceiling: "45000000",
  committed: "12000000",
  remaining: "33000000",
  isWithinCeiling: true,
  disbursed: "9000000",
  reported: "4500000",
  untagged: "2500000",
};

const ALLOCATION: BudgetAllocationDetail = {
  publicId: "pga-1",
  bapelId: 2,
  year: YEAR,
  budgetYear: {
    year: YEAR,
    startMonth: 7,
    from: `${YEAR}-07-01`,
    to: `${YEAR + 1}-06-30`,
    label: `${YEAR}/${YEAR + 1} label server`,
  },
  amount: "45000000",
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  usage,
};

const PROGRAMS: YearProgram[] = [
  {
    publicId: "prg-1",
    code: `PRG-${YEAR}-0001`,
    name: "Retret pemuda",
    status: "APPROVED",
    proposedAmount: "8000000",
    budgetAmount: "7500000",
  },
  {
    publicId: "prg-2",
    code: `PRG-${YEAR}-0002`,
    name: "Paduan suara",
    status: "DRAFT",
    proposedAmount: "4000000",
    budgetAmount: null,
  },
];

const onMockApi = (programs: YearProgram[] = PROGRAMS) => {
  const requested: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);

    if (url.startsWith("/api/v1/pagu-anggaran/")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: ALLOCATION,
      });
    }

    if (url.startsWith("/api/v1/program")) {
      return programs.length === 0
        ? Response.json(
            { status: 404, error: "Program Tidak Ditemukan" },
            { status: 404 },
          )
        : Response.json({
            status: 200,
            totalData: programs.length,
            totalPage: 1,
            data: programs,
          });
    }

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return requested;
};

const onRender = (granted: Record<string, MenuAction[]>) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AllocationDetailScreen publicId="pga-1" />
    </QueryClientProvider>,
  );
};

describe("halaman pagu anggaran", () => {
  test("lima angka, label tahun server, dan rentang tanggalnya penuh", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW"] });

    expect(
      await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`),
    ).toBeTruthy();
    expect(screen.getAllByText("Rp 45.000.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 12.000.000").length).toBeGreaterThan(0);
    expect(screen.getByText("Rp 9.000.000")).toBeTruthy();
    expect(screen.getAllByText("Rp 4.500.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 33.000.000").length).toBeGreaterThan(0);
    expect(screen.getByText("1 Juli 2026 – 30 Juni 2027")).toBeTruthy();
  });

  test("kalimat tiga angka ada di halaman baca", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW"] });
    await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`);

    const note = screen.getByText(/^Program disetujui = /);

    expect(note.textContent).toContain("Dicairkan = uang yang sudah keluar");
    expect(note.textContent).toContain("Dilaporkan = yang badan pelayanan itu");
    expect(note.textContent).toContain("Ketiganya boleh berbeda");
  });

  test("batang memakai dilaporkan terhadap pagu", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW"] });
    await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "10",
    );
  });

  test("program tahun itu dirender apa adanya dan menaut dengan publicId", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW"], PROGRAM: ["VIEW"] });

    const link = await screen.findByRole("link", { name: /Retret pemuda/ });

    expect(link.getAttribute("href")).toBe("/budgeting/program/prg-1");
    expect(screen.getByText("Rp 7.500.000")).toBeTruthy();
    expect(screen.getByText("Rp 4.000.000")).toBeTruthy();
    expect(screen.getAllByText("Disetujui").length).toBe(1);
  });

  test("tanpa PROGRAM VIEW: daftar program tidak diminta", async () => {
    const requested = onMockApi();
    onRender({ BUDGET: ["VIEW"] });
    await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`);

    expect(screen.queryByText("Program tahun ini")).toBeNull();
    expect(requested.some((url) => url.startsWith("/api/v1/program"))).toBe(
      false,
    );
  });

  test("tahun tanpa program: keadaan kosong tanpa klaim cakupan", async () => {
    onMockApi([]);
    onRender({ BUDGET: ["VIEW"], PROGRAM: ["VIEW"] });

    expect(await screen.findByText("Belum ada program")).toBeTruthy();
  });

  test("ubah hanya dengan UPDATE", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW"] });
    await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`);

    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();

    cleanup();
    onMockApi();
    onRender({ BUDGET: ["VIEW", "UPDATE"] });

    expect(
      (await screen.findByRole("link", { name: "Ubah" })).getAttribute("href"),
    ).toBe("/budgeting/budget/pga-1/ubah");
  });

  test("tanpa Hapus di halaman baca", async () => {
    onMockApi();
    onRender({ BUDGET: ["VIEW", "UPDATE", "DELETE"] });
    await screen.findByText(`Pagu anggaran ${YEAR}/${YEAR + 1} label server`);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("tanpa VIEW: keadaan akses", () => {
    onMockApi();
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pagu Anggaran"),
    ).toBeTruthy();
  });
});
