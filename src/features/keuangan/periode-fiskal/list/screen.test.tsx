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

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { FiscalPeriod } from "../types";

const access: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const params = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/periode-fiskal",
  useSearchParams: () => params.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: access.current.includes("VIEW"),
    isCanCreate: access.current.includes("CREATE"),
    isCanUpdate: access.current.includes("UPDATE"),
    isCanDelete: access.current.includes("DELETE"),
  }),
}));

const { PeriodListScreen } = await import("./screen");

const YEAR = Number(todayJakarta().slice(0, 4));

const MONTH_LABEL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const monthEnd = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

const periodOf = (month: number, year = YEAR): FiscalPeriod => ({
  id: `fp-${year}-${month}`,
  year,
  month,
  label: `${MONTH_LABEL[month - 1]} ${year}`,
  status: month < 3 ? "CLOSED" : "OPEN",
  startDate: `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`,
  endDate: `${monthEnd(year, month)}T00:00:00.000Z`,
  closedBy: month < 3 ? { name: "Bendahara" } : null,
  closedAt: month < 3 ? `${monthEnd(year, month)}T09:00:00.000Z` : null,
  reopenedBy: null,
  reopenedAt: null,
  reopenReason: null,
  draftCount: month === 4 ? 2 : 0,
});

const DESCENDING = [
  ...[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((month) => periodOf(month)),
  periodOf(12, YEAR - 1),
];

const requested: string[] = [];
const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

const onMockApi = (rows: FiscalPeriod[], failure?: Response) => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    requested.push(`${method} ${url} ${init?.body ?? ""}`.trim());

    if (method !== "GET") {
      return failure ?? Response.json({ status: 201, message: "OK", data: [] });
    }

    const year = new URL(url, "http://test").searchParams.get("year");
    const data = year ? rows.filter((row) => String(row.year) === year) : rows;

    if (data.length === 0) {
      return Response.json(
        { status: 404, error: "Periode Fiskal Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({
      status: 200,
      message: "OK",
      totalData: data.length,
      totalPage: 1,
      data,
    });
  }) as typeof fetch;
};

beforeAll(() => {
  viewport = onStubViewport(false);
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  requested.length = 0;
  replaced.length = 0;
  params.current = new URLSearchParams();
});

const onRender = (
  rows: FiscalPeriod[],
  granted: MenuAction[] = ["VIEW", "CREATE"],
  failure?: Response,
) => {
  access.current = granted;
  onMockApi(rows, failure);

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PeriodListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang VIEW", () => {
  test("tanpa VIEW: keadaan tanpa akses dan tanpa permintaan", () => {
    onRender(DESCENDING, []);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Periode Fiskal"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Buka tahun" })).toBeNull();
    expect(requested).toEqual([]);
  });
});

describe("daftar per tahun", () => {
  test("tahun berjalan diminta ke server dan bulan urut Januari dulu", async () => {
    onRender(DESCENDING);

    await screen.findByText(`Januari ${YEAR}`);

    expect(
      requested.some((call) =>
        call.includes(`/api/v1/periode-fiskal?page=1&limit=12&year=${YEAR}`),
      ),
    ).toBe(true);

    const months = screen
      .getAllByRole("link", { name: /^Lihat periode/ })
      .map((link) => link.textContent);

    expect(months[0]).toBe(`Januari ${YEAR}`);
    expect(months.at(-1)).toBe(`Desember ${YEAR}`);
  });

  test("tab tahun menulis filter ke URL", async () => {
    onRender(DESCENDING);
    await screen.findByText(`Januari ${YEAR}`);

    fireEvent.click(screen.getByRole("tab", { name: String(YEAR - 1) }));

    expect(replaced.at(-1)).toBe(`/keuangan/periode-fiskal?tahun=${YEAR - 1}`);
  });

  test("bulan berdraf memakai penanda draf", async () => {
    onRender(DESCENDING);
    await screen.findByText(`Januari ${YEAR}`);

    expect(screen.getByText("2 draf")).toBeTruthy();
  });
});

describe("belum ada periode", () => {
  test("keadaan kosong mengajak membuka satu tahun", async () => {
    onRender([]);

    expect(await screen.findByText("Belum ada periode fiskal")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Buka tahun" }).length,
    ).toBeGreaterThan(0);
  });

  test("tanpa CREATE tombol buka tahun tidak dirender", async () => {
    onRender([], ["VIEW"]);

    await screen.findByText("Belum ada periode fiskal");
    expect(screen.queryByRole("button", { name: "Buka tahun" })).toBeNull();
  });
});

describe("buka tahun", () => {
  const onOpenDialog = async () => {
    await screen.findByText(`Januari ${YEAR}`);
    fireEvent.click(screen.getAllByRole("button", { name: "Buka tahun" })[0]);

    return screen.findByText("Buka tahun buku");
  };

  test("mengirim { year } tahun berjalan", async () => {
    onRender(DESCENDING);
    await onOpenDialog();

    expect(
      screen.getByText(
        `Membuka tahun ${YEAR} membuat 12 periode bulanan sekaligus.`,
      ),
    ).toBeTruthy();

    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Buka tahun" })
        .at(-1) as HTMLElement,
    );

    await waitFor(() =>
      expect(
        requested.some(
          (call) => call === `POST /api/v1/periode-fiskal {"year":${YEAR}}`,
        ),
      ).toBe(true),
    );
  });

  test("409 dari server muncul di field Tahun", async () => {
    onRender(
      DESCENDING,
      ["VIEW", "CREATE"],
      Response.json(
        {
          status: 409,
          error: "Tahun Sudah Dibuka",
          issues: [{ path: "year", message: "Tahun Sudah Dibuka" }],
        },
        { status: 409 },
      ),
    );
    await onOpenDialog();

    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Buka tahun" })
        .at(-1) as HTMLElement,
    );

    expect(await screen.findByText("Tahun Sudah Dibuka")).toBeTruthy();
  });
});
