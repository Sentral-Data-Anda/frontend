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

import type { BudgetSetting } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { Program } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const params: { current: URLSearchParams } = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/anggaran/program",
  useSearchParams: () => params.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { ProgramListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
  params.current = new URLSearchParams();
});

const YEAR = 2026;

const budgetYear = (year: number) => ({
  year,
  startMonth: 7,
  from: `${year}-07-01`,
  to: `${year + 1}-06-30`,
  label: `${year}/${year + 1} label server`,
});

const SETTING: BudgetSetting = {
  startMonth: 7,
  budgetYear: budgetYear(YEAR),
  budgetYears: [budgetYear(YEAR - 1), budgetYear(YEAR), budgetYear(YEAR + 1)],
};

const ROWS: Program[] = [
  {
    publicId: "prg-0001",
    code: `PRG-${YEAR}-0001`,
    name: "Retret Pemuda Regional",
    year: YEAR,
    budgetYear: budgetYear(YEAR),
    status: "DRAFT",
    isUnplanned: false,
    startDate: null,
    endDate: null,
    bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
    proposedAmount: "6000000",
    approval: null,
    itemCount: 2,
  },
  {
    publicId: "prg-0004",
    code: `PRG-${YEAR}-0004`,
    name: "Perlengkapan Ibadah Pemuda",
    year: YEAR,
    budgetYear: budgetYear(YEAR),
    status: "APPROVED",
    isUnplanned: true,
    startDate: null,
    endDate: null,
    bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
    proposedAmount: "15000000",
    approval: null,
    itemCount: 1,
  },
];

const onMockApi = (rows: Program[] = ROWS) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);

    if (url.startsWith("/api/v1/setelan-anggaran")) {
      return Response.json({ status: 200, message: "ok", data: SETTING });
    }

    if (url.startsWith("/api/v1/program")) {
      return rows.length === 0
        ? Response.json(
            { status: 404, error: "Program Tidak Ditemukan" },
            { status: 404 },
          )
        : Response.json({
            status: 200,
            totalData: rows.length,
            totalPage: 1,
            data: rows,
          });
    }

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[], rows: Program[] = ROWS) => {
  actions.current = granted;
  const calls = onMockApi(rows);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ProgramListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

describe("daftar program", () => {
  test("baris menampilkan kode dan menaut dengan publicId", async () => {
    onRender(["VIEW"]);

    const link = await screen.findByRole("link", {
      name: "Lihat usulan Retret Pemuda Regional",
    });

    expect(link.getAttribute("href")).toBe("/anggaran/program/prg-0001");
    expect(screen.getByText(`PRG-${YEAR}-0001 · Komisi Pemuda`)).toBeTruthy();
  });

  test("bawaan tahun berjalan diambil dari server, tidak dihitung di klien", async () => {
    const calls = onRender(["VIEW"]);

    await screen.findByRole("link", {
      name: "Lihat usulan Retret Pemuda Regional",
    });

    expect(calls.some((url) => url.includes(`year=${YEAR}`))).toBe(true);
  });

  test("subjudul memakai label tahun server apa adanya", async () => {
    onRender(["VIEW"]);

    expect(
      await screen.findByText(`${YEAR}/${YEAR + 1} label server · 2 usulan`),
    ).toBeTruthy();
  });

  test("tab Menunggu menulis status ke URL", async () => {
    onRender(["VIEW"]);

    fireEvent.click(await screen.findByRole("tab", { name: "Menunggu" }));

    expect(replaced[0]).toBe("/anggaran/program?status=PENDING_APPROVAL");
  });

  test("status di URL dikirim sebagai status + isPendingApproval ke API", async () => {
    params.current = new URLSearchParams("status=PENDING_APPROVAL");
    const calls = onRender(["VIEW"]);

    await waitFor(() =>
      expect(
        calls.some(
          (url) =>
            url.includes("isPendingApproval=1") && url.includes("status=DRAFT"),
        ),
      ).toBe(true),
    );
  });

  test("ACTIVE dan COMPLETED tidak muncul sebagai tab", async () => {
    onRender(["VIEW"]);

    await screen.findByRole("tab", { name: "Semua" });

    expect(screen.queryByRole("tab", { name: "Aktif" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Selesai" })).toBeNull();
  });

  test("daftar tidak merender rincian anggaran", async () => {
    onRender(["VIEW"]);

    await screen.findByRole("link", {
      name: "Lihat usulan Retret Pemuda Regional",
    });

    expect(screen.queryByText("Sewa vila dan aula")).toBeNull();
    expect(screen.queryByText("Rincian anggaran")).toBeNull();
  });

  test("tanpa CREATE tombol tambah tidak ada di DOM", async () => {
    onRender(["VIEW"]);

    await screen.findByRole("link", {
      name: "Lihat usulan Retret Pemuda Regional",
    });

    expect(screen.queryByRole("link", { name: "Tambah program" })).toBeNull();
  });

  test("keadaan kosong tidak menyatakan cakupan", async () => {
    onRender(["VIEW", "CREATE"], []);

    expect(await screen.findByText("Belum ada program")).toBeTruthy();
    expect(
      screen.getByText("Usulan program diukur terhadap pagu anggaran komisi."),
    ).toBeTruthy();
    expect(screen.queryByText(/di gereja ini/i)).toBeNull();
    expect(screen.queryByText(/komisi lain/i)).toBeNull();
  });

  test("tanpa VIEW layar menolak tanpa memanggil API", async () => {
    const calls = onRender([]);

    expect(
      await screen.findByText("Anda tidak memiliki akses ke Program"),
    ).toBeTruthy();
    expect(calls).toHaveLength(0);
  });
});
