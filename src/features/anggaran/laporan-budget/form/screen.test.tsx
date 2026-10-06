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

import { addMonths, startOfMonth, todayJakarta } from "@/lib/date";
import type { BudgetSetting } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { monthValueOf } from "../model";
import type { BudgetReportDetail, Prefill } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };
const query: { current: string } = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/anggaran/laporan-budget/baru",
  useSearchParams: () => new URLSearchParams(query.current),
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

const { ReportFormScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  query.current = "";
  replaced.length = 0;
});

const ALL = ["VIEW", "CREATE", "UPDATE", "DELETE"] as MenuAction[];

const TODAY = todayJakarta();

const MONTH = addMonths(startOfMonth(TODAY), -1).slice(0, 7);

const EARLIER = addMonths(startOfMonth(TODAY), -2).slice(0, 7);

const budgetYear = (year: number) => ({
  year,
  startMonth: 1,
  from: `${year}-01-01`,
  to: `${year}-12-31`,
  label: String(year),
});

const YEAR = Number(MONTH.slice(0, 4));

const SETTING: BudgetSetting = {
  startMonth: 1,
  budgetYear: budgetYear(YEAR),
  budgetYears: [budgetYear(YEAR - 1), budgetYear(YEAR), budgetYear(YEAR + 1)],
};

const PREFILL: Prefill = {
  total: "5250000",
  lines: [
    {
      cashExpense: { publicId: "bkk-0011", code: "BKK-2026-0011" },
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      spentDate: `${MONTH}-08`,
      description: "Sewa tempat retret",
      amount: "3500000",
    },
    {
      cashExpense: { publicId: "bkk-0011", code: "BKK-2026-0011" },
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      spentDate: `${MONTH}-08`,
      description: "Konsumsi retret",
      amount: "1750000",
    },
  ],
};

const DETAIL: BudgetReportDetail = {
  publicId: "lpb-0001",
  code: "LPB-2026-0001",
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  year: Number(MONTH.slice(0, 4)),
  month: Number(MONTH.slice(5, 7)),
  label: "bulan dari server",
  status: "DRAFT",
  totalAmount: "920000",
  approval: null,
  waiver: null,
  bapelId: 2,
  note: null,
  disbursementTotal: "920000",
  approvedBy: null,
  approvedAt: null,
  lines: [
    {
      publicId: "lpl-1",
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      programId: 1,
      program: {
        publicId: "prg-0001",
        code: "PRG-2026-0001",
        name: "Retret Pemuda",
      },
      spentDate: `${MONTH}-19`,
      description: "Alat peraga",
      amount: "920000",
      cashExpense: null,
    },
  ],
  listReceipt: [],
};

type Calls = { url: string; method: string; body?: unknown }[];

const onMockApi = (prefill: Prefill, detail: BudgetReportDetail | null) => {
  const calls: Calls = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: init?.body });

    if (url.startsWith("/api/v1/setelan-anggaran")) {
      return Response.json({ status: 200, message: "ok", data: SETTING });
    }

    if (url.startsWith("/api/v1/ddl/bapel")) {
      return Response.json({
        status: 200,
        data: [
          { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
          { id: 4, code: "BPL-4", name: "Komisi Anak" },
        ],
      });
    }

    if (url.startsWith("/api/v1/ddl/program")) {
      return Response.json({
        status: 200,
        data: [{ id: 1, code: "PRG-2026-0001", name: "Retret Pemuda" }],
      });
    }

    if (url.startsWith("/api/v1/ddl/account")) {
      return Response.json({
        status: 200,
        data: [
          {
            id: 23,
            code: "5-110",
            name: "Beban Administrasi",
            type: "EXPENSE",
          },
        ],
      });
    }

    if (url.startsWith("/api/v1/laporan-budget/prefill")) {
      return Response.json({ status: 200, message: "ok", data: prefill });
    }

    if (method === "POST" && url === "/api/v1/laporan-budget") {
      return Response.json(
        { status: 201, message: "Berhasil", data: DETAIL },
        { status: 201 },
      );
    }

    if (url.startsWith("/api/v1/laporan-budget/")) {
      return detail
        ? Response.json({ status: 200, message: "ok", data: detail })
        : Response.json(
            { status: 404, error: "Tidak Ditemukan" },
            { status: 404 },
          );
    }

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (
  publicId?: string,
  prefill: Prefill = PREFILL,
  detail: BudgetReportDetail | null = DETAIL,
  granted: Record<string, MenuAction[]> = { LAPORAN_BUDGET: ALL },
) => {
  actions.current = granted;
  const calls = onMockApi(prefill, detail);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ReportFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

// Pilihan baru dikunci saat tombol mouse dilepas, bukan saat klik: satu
// `click` saja hanya bekerja pada opsi yang kebetulan sedang disorot.
const onPick = async (name: RegExp | string, option: RegExp) => {
  fireEvent.click(await screen.findByRole("combobox", { name }));
  fireEvent.click(await screen.findByRole("option", { name: option }));

  await waitFor(() =>
    expect(screen.getByRole("combobox", { name }).textContent).toMatch(option),
  );
};

const amountValues = () =>
  [...document.querySelectorAll("input")]
    .filter((node) => node.id.includes("amount"))
    .map((node) => node.value);

const sourceMarks = () =>
  [...document.querySelectorAll("span")]
    .map((node) => node.textContent ?? "")
    .filter((text) => text.startsWith("dari BKK"));

describe("form mengisi dirinya dari Kas Keluar", () => {
  test("memilih komisi mengisi baris dengan penanda kode Kas Keluarnya", async () => {
    onRender();
    await onPick("Badan pelayanan", /Komisi Pemuda/);

    await waitFor(() => expect(sourceMarks()).toHaveLength(2), {
      timeout: 4000,
    });
    expect(amountValues()).toEqual(["3.500.000", "1.750.000"]);
  });

  test("baris prefill bisa dihapus seperti baris lain", async () => {
    onRender();
    await onPick("Badan pelayanan", /Komisi Pemuda/);
    await waitFor(() => expect(sourceMarks()).toHaveLength(2), {
      timeout: 4000,
    });

    fireEvent.click(screen.getByRole("button", { name: "Hapus baris 1" }));

    await waitFor(() => expect(sourceMarks()).toHaveLength(1));
  });

  test("baris prefill bisa disunting", async () => {
    onRender();
    await onPick("Badan pelayanan", /Komisi Pemuda/);
    await waitFor(() => expect(sourceMarks()).toHaveLength(2), {
      timeout: 4000,
    });

    const amount = [...document.querySelectorAll("input")].find((node) =>
      node.id.includes("amount"),
    )!;

    fireEvent.change(amount, { target: { value: "4000000" } });

    await waitFor(() => expect(amountValues()[0]).toBe("4.000.000"));
  });

  test("prefill kosong memberi satu baris kosong dan nada info, bukan galat", async () => {
    onRender(undefined, { lines: [], total: "0" });
    await onPick("Badan pelayanan", /Komisi Pemuda/);

    expect(
      await screen.findByText(
        "Tidak ada Kas Keluar yang dibayar untuk badan pelayanan ini di bulan tersebut. Tulis pemakaiannya manual.",
      ),
    ).toBeTruthy();
    expect(sourceMarks()).toHaveLength(0);
    expect(amountValues()).toHaveLength(1);
    expect(document.querySelectorAll("[role='alert']")).toHaveLength(0);
  });

  test("form ubah tidak pernah mengisi awal", async () => {
    const calls = onRender("lpb-0001");

    await waitFor(() => expect(amountValues()).toEqual(["920.000"]));
    expect(sourceMarks()).toHaveLength(0);
    expect(
      calls.some((call) => call.url.includes("/laporan-budget/prefill")),
    ).toBe(true);
  });
});

describe("strip selisih di form", () => {
  test("dirender sejak awal, juga ketika kedua angkanya nol", async () => {
    onRender(undefined, { lines: [], total: "0" });

    expect(
      await screen.findByText(
        "Kas Keluar bulan ini Rp 0 · Laporan ini Rp 0 · selisih Rp 0",
      ),
    ).toBeTruthy();
  });

  test("angka Kas Keluar datang dari prefill, bukan dihitung ulang", async () => {
    onRender();
    await onPick("Badan pelayanan", /Komisi Pemuda/);

    expect(
      await screen.findByText(
        "Kas Keluar bulan ini Rp 5.250.000 · Laporan ini Rp 5.250.000 · selisih Rp 0",
      ),
    ).toBeTruthy();
  });
});

describe("komisi dan bulan terisi awal dari baris Belum lapor", () => {
  test("query komisi dan bulan mengisi form tambah", async () => {
    query.current = `komisi=2&bulan=${EARLIER}`;
    onRender();

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Badan pelayanan" }).textContent,
      ).toContain("Komisi Pemuda"),
    );
    expect(
      screen.getByRole("combobox", { name: "Bulan laporan" }).textContent,
    ).not.toBe("");
  });
});

describe("bulan laporan", () => {
  test("bawaan bulan lalu, dihitung dari hari ini", async () => {
    onRender();

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Bulan laporan" }).textContent,
      ).not.toBe(""),
    );

    const detail = { ...DETAIL, year: YEAR, month: Number(MONTH.slice(5, 7)) };

    expect(monthValueOf(detail)).toBe(MONTH);
  });
});
