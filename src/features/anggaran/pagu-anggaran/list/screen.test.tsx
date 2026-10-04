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

import type { BudgetSetting, CeilingUsage } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { BudgetAllocation } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const params: { current: URLSearchParams } = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/anggaran/pagu-anggaran",
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

const { AllocationListScreen } = await import("./screen");

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

const YEAR = Number("2026");

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

const usage = (next: Partial<CeilingUsage> = {}): CeilingUsage => ({
  year: YEAR,
  ceiling: "45000000",
  committed: "12000000",
  remaining: "33000000",
  isWithinCeiling: true,
  disbursed: "9000000",
  reported: "4500000",
  untagged: "0",
  ...next,
});

const ROWS: BudgetAllocation[] = [
  {
    publicId: "pga-1",
    year: YEAR,
    budgetYear: budgetYear(YEAR),
    amount: "45000000",
    bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
    usage: usage(),
  },
  {
    publicId: "pga-2",
    year: YEAR,
    budgetYear: budgetYear(YEAR),
    amount: "0",
    bapel: { publicId: "bpl-3", code: "BPL-3", name: "Komisi Wanita" },
    usage: usage({ ceiling: null, remaining: null, disbursed: "1000000" }),
  },
];

type Routes = Record<string, () => Response>;

const ok = (data: unknown, message = "Berhasil") =>
  Response.json({ status: 200, message, data });

const onMockApi = (routes: Routes = {}) => {
  const calls: { url: string; method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    const route = Object.keys(routes).find(
      (key) => key === `${method} ${url.split("?")[0]}`,
    );

    if (route) return routes[route]!();

    if (url.startsWith("/api/v1/pagu-anggaran")) {
      return Response.json({
        status: 200,
        totalData: ROWS.length,
        totalPage: 1,
        data: ROWS,
      });
    }

    if (url.startsWith("/api/v1/setelan-anggaran")) return ok(SETTING);

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[], routes: Routes = {}) => {
  actions.current = granted;
  const calls = onMockApi(routes);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <AllocationListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

describe("daftar pagu anggaran", () => {
  test("baris menampilkan pagu, dan pagu yang belum ditetapkan bukan Rp 0", async () => {
    onRender(["VIEW"]);

    expect(
      await screen.findByRole("link", {
        name: /^Lihat pagu anggaran Komisi Pemuda/,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Rp 45.000.000")).toBeTruthy();
    expect(screen.getByText("Belum ditetapkan")).toBeTruthy();
  });

  test("batang menggambar dilaporkan terhadap pagu, bukan dicairkan", async () => {
    onRender(["VIEW"]);
    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });

    const bars = screen.getAllByRole("progressbar");

    expect(bars[0]?.getAttribute("aria-valuenow")).toBe("10");
    expect(
      screen
        .getAllByText("Dilaporkan")[0]
        ?.closest("[title]")
        ?.getAttribute("title"),
    ).toBe(
      "Komisi Pemuda: Dilaporkan terhadap pagu, dari laporan pemakaian budget yang sudah disetujui",
    );
  });

  test("sisa tak bertanda tetap dirender saat nol, dengan ketonjolan sama", async () => {
    onRender(["VIEW"]);
    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });

    const untagged = screen.getByText("Pengeluaran tanpa komisi");
    const row = untagged.closest("[data-untagged]");
    const partRow = row?.previousElementSibling;

    expect(row).toBeTruthy();
    expect(row?.className).toBe(partRow?.className);
    expect(screen.getByText("Rp 0")).toBeTruthy();
  });

  test("tab tahun memakai label server dan menulis ?tahun=", async () => {
    onRender(["VIEW"]);

    const tab = await screen.findByRole("tab", { name: String(YEAR + 1) });
    fireEvent.click(tab);

    expect(replaced).toEqual([`/anggaran/pagu-anggaran?tahun=${YEAR + 1}`]);
  });

  test("tahun dari URL bertahan dan dikirim sebagai year", async () => {
    params.current = new URLSearchParams({ tahun: String(YEAR - 1) });
    const calls = onRender(["VIEW"]);

    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });
    const listCall = calls.find((call) =>
      call.url.startsWith("/api/v1/pagu-anggaran?"),
    );

    expect(new URL(listCall!.url, "http://x").searchParams.get("year")).toBe(
      String(YEAR - 1),
    );
    expect(
      (await screen.findByRole("tab", { name: String(YEAR - 1) })).getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    expect(
      screen.getByText(`${YEAR - 1}/${YEAR} label server · 2 komisi`),
    ).toBeTruthy();
  });

  test("tanpa izin: tambah, pensil, dan aksi tahun pelayanan tidak dirender", async () => {
    onRender(["VIEW"]);
    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });

    expect(screen.queryByRole("link", { name: "Tambah pagu" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tahun pelayanan" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Ubah pagu anggaran Komisi Pemuda" }),
    ).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE", "UPDATE"]);
    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });

    expect(screen.getByRole("link", { name: "Tambah pagu" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tahun pelayanan" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ubah pagu anggaran Komisi Pemuda" }),
    ).toBeTruthy();
  });

  test("tahun tanpa pagu: keadaan kosong, bukan 'tidak cocok dengan filter'", async () => {
    onRender(["VIEW", "CREATE"], {
      "GET /api/v1/pagu-anggaran": () =>
        Response.json(
          { status: 404, error: "Pagu Anggaran Tidak Ditemukan" },
          { status: 404 },
        ),
    });

    expect(await screen.findByText("Belum ada pagu anggaran")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Tambah pagu" })).toHaveLength(
      2,
    );
    expect(screen.queryByText(/cocok dengan filter/)).toBeNull();
  });

  test("kosong karena filter komisi: tawaran hapus filter", async () => {
    params.current = new URLSearchParams({ komisi: "3" });
    onRender(["VIEW", "CREATE"], {
      "GET /api/v1/pagu-anggaran": () =>
        Response.json(
          { status: 404, error: "Pagu Anggaran Tidak Ditemukan" },
          { status: 404 },
        ),
    });

    expect(await screen.findByText("Tidak ada pagu anggaran")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus filter" })).toBeTruthy();
  });

  test("tanpa VIEW: keadaan akses", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pagu Anggaran"),
    ).toBeTruthy();
  });
});

describe("setelan tahun pelayanan", () => {
  test("belum dipilih: spanduk dan aksi memilih", async () => {
    onRender(["VIEW", "UPDATE"], {
      "GET /api/v1/setelan-anggaran": () =>
        ok({ ...SETTING, startMonth: null }),
    });

    expect(
      await screen.findByText("Bulan mulai tahun pelayanan belum dipilih"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Pilih bulan mulai" }),
    ).toBeTruthy();
  });

  test("sudah dipilih: tanpa spanduk", async () => {
    onRender(["VIEW", "UPDATE"]);
    await screen.findByRole("link", {
      name: /^Lihat pagu anggaran Komisi Pemuda/,
    });

    expect(
      screen.queryByText("Bulan mulai tahun pelayanan belum dipilih"),
    ).toBeNull();
  });

  test("ada pagu tapi nol program disetujui: setelan tersimpan", async () => {
    const calls = onRender(["VIEW", "UPDATE"], {
      "PUT /api/v1/setelan-anggaran": () =>
        ok({ ...SETTING, startMonth: 4 }, "Berhasil Mengubah Setelan Anggaran"),
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Tahun pelayanan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(calls.some((call) => call.method === "PUT")).toBe(true),
    );
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({
      startMonth: SETTING.startMonth,
    });
    expect(screen.queryByText("Bulan mulai belum berubah.")).toBeNull();
  });

  test("BUDGET_YEAR_LOCKED: spanduk dengan alasannya, field tetap aktif", async () => {
    onRender(["VIEW", "UPDATE"], {
      "PUT /api/v1/setelan-anggaran": () =>
        Response.json(
          {
            status: 400,
            code: "BUDGET_YEAR_LOCKED",
            error: "Bulan Mulai Tahun Pelayanan Tidak Dapat Diubah",
            issues: [
              { path: "startMonth", message: "Bulan mulai tidak dapat diubah" },
            ],
          },
          { status: 400 },
        ),
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Tahun pelayanan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Bulan Mulai Tahun Pelayanan Tidak Dapat Diubah"),
    ).toBeTruthy();
    expect(
      screen.getByText(/program yang disetujui untuk tahun pelayanan ini/i),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("combobox", { name: "Bulan mulai" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  test("code tak dikenal: kalimatnya apa adanya, tanpa penjelasan tambahan", async () => {
    onRender(["VIEW", "UPDATE"], {
      "PUT /api/v1/setelan-anggaran": () =>
        Response.json(
          { status: 400, code: "SOMETHING_ELSE", error: "Galat lain" },
          { status: 400 },
        ),
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Tahun pelayanan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Galat lain")).toBeTruthy();
    expect(
      screen.queryByText(/program yang disetujui untuk tahun pelayanan ini/i),
    ).toBeNull();
  });
});
