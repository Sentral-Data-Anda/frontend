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

import type { BukuBesar, Neraca, SurplusDefisit } from "./types";

const grants: { current: Record<string, MenuAction[]> } = { current: {} };
const query: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/laporan-keuangan",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => ({
    isCanView: (grants.current[slug] ?? []).includes("VIEW"),
    isCanCreate: (grants.current[slug] ?? []).includes("CREATE"),
    isCanUpdate: (grants.current[slug] ?? []).includes("UPDATE"),
    isCanDelete: (grants.current[slug] ?? []).includes("DELETE"),
  }),
}));

const { LaporanKeuanganScreen } = await import("./screen");

const originalMedia = window.matchMedia;

beforeAll(() => {
  window.matchMedia = ((media: string) => ({
    matches: true,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterAll(() => {
  window.matchMedia = originalMedia;
});

const originalFetch = globalThis.fetch;

const requested: string[] = [];

const TODAY = todayJakarta();

const node = (
  id: number,
  code: string,
  name: string,
  type: Neraca["assets"][number]["type"],
  total: string,
  children: Neraca["assets"] = [],
) => ({ id, code, name, type, total, children });

const NERACA: Neraca = {
  date: `${TODAY}T00:00:00.000Z`,
  assets: [
    node(1, "1", "Aset", "ASSET", "82750000", [
      node(2, "1-100", "Kas", "ASSET", "4500000"),
      node(3, "1-110", "Kas Kecil", "ASSET", "0"),
    ]),
  ],
  liabilities: [node(10, "2", "Kewajiban", "LIABILITY", "0")],
  equity: [node(13, "3", "Ekuitas", "EQUITY", "82750000")],
  totals: {
    assets: "82750000",
    liabilities: "0",
    equity: "82750000",
    surplus: "0",
  },
  balanced: true,
  isOpeningEntered: true,
};

const ZEROED: Neraca = {
  ...NERACA,
  assets: [
    node(1, "1", "Aset", "ASSET", "0", [node(2, "1-100", "Kas", "ASSET", "0")]),
  ],
  equity: [node(13, "3", "Ekuitas", "EQUITY", "0")],
  totals: { assets: "0", liabilities: "0", equity: "0", surplus: "0" },
  isOpeningEntered: false,
};

const LABA_RUGI: SurplusDefisit = {
  from: `${TODAY.slice(0, 7)}-01T00:00:00.000Z`,
  to: `${TODAY}T00:00:00.000Z`,
  income: [node(15, "4", "Pendapatan", "INCOME", "6420000")],
  expense: [node(21, "5", "Beban", "EXPENSE", "1850000")],
  totals: { income: "6420000", expense: "1850000", surplus: "4570000" },
};

const LEDGER: BukuBesar = {
  account: { code: "1-100", name: "Kas", type: "ASSET" },
  from: `${TODAY.slice(0, 7)}-01T00:00:00.000Z`,
  to: `${TODAY}T00:00:00.000Z`,
  openingBalance: "4500000",
  rows: [
    {
      entryCode: "JRN-2026-0002",
      entryPublicId: "jrn-0002",
      entryDate: `${TODAY}T00:00:00.000Z`,
      description: "Persembahan kolekte",
      debit: "6420000",
      credit: "0",
      balance: "10920000",
    },
  ],
  closingBalance: "99999000",
  totalData: 25,
  totalPage: 3,
};

const state = {
  neraca: NERACA as Neraca,
  labaRugi: LABA_RUGI as SurplusDefisit,
  ledger: LEDGER as BukuBesar,
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requested.length = 0;
  query.current = "";
  state.neraca = NERACA;
  state.labaRugi = LABA_RUGI;
  state.ledger = LEDGER;
});

const ok = (data: unknown) =>
  Response.json({ status: 200, message: "Berhasil", data });

const onRender = (
  granted: Record<string, MenuAction[]> = { LAPORAN_KEUANGAN: ["VIEW"] },
) => {
  grants.current = granted;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);

    if (url.includes("/ddl/account")) {
      return Promise.resolve(
        Response.json({
          status: 200,
          message: "OK",
          totalData: 1,
          totalPage: 1,
          data: [{ id: 2, code: "1-100", name: "Kas", type: "ASSET" }],
        }),
      );
    }
    if (url.includes("/neraca")) return Promise.resolve(ok(state.neraca));
    if (url.includes("/surplus-defisit")) {
      return Promise.resolve(ok(state.labaRugi));
    }
    if (url.includes("/buku-besar")) return Promise.resolve(ok(state.ledger));

    return Promise.resolve(
      Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 }),
    );
  }) as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LaporanKeuanganScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang VIEW", () => {
  test("tanpa VIEW: pesan tanpa akses, tanpa permintaan", async () => {
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Laporan Keuangan"),
    ).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requested).toEqual([]);
  });
});

describe("neraca", () => {
  test("spanduk tutup buku selalu tampil", async () => {
    onRender();

    expect(screen.getByText("Belum ada tutup buku tahunan.")).toBeTruthy();
  });

  test("spanduk saldo awal hanya saat belum ada entri manual", async () => {
    const view = onRender();

    await waitFor(() =>
      expect(screen.getAllByText("Rp 82.750.000").length).toBeGreaterThan(0),
    );
    expect(
      screen.queryByText("Saldo awal gereja belum dimasukkan."),
    ).toBeNull();

    view.unmount();
    cleanup();
    state.neraca = ZEROED;
    onRender();

    await waitFor(() =>
      expect(
        screen.getByText("Saldo awal gereja belum dimasukkan."),
      ).toBeTruthy(),
    );
  });

  test("hasil nol dirender sebagai nol, bukan galat dan bukan kosong", async () => {
    state.neraca = ZEROED;
    onRender();

    await waitFor(() =>
      expect(screen.getAllByText("Rp 0").length).toBeGreaterThan(0),
    );
    expect(screen.queryByText("Gagal memuat.")).toBeNull();
    expect(screen.queryByText("Belum ada akun")).toBeNull();
  });

  test("akun bersaldo nol tetap ditampilkan", async () => {
    onRender();

    await waitFor(() => expect(screen.getByText("Kas Kecil")).toBeTruthy());
  });

  test("balanced: false memunculkan galat merah", async () => {
    state.neraca = { ...NERACA, balanced: false };
    onRender();

    await waitFor(() =>
      expect(screen.getByText("Neraca tidak seimbang.")).toBeTruthy(),
    );
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  test("surplus berdiri di luar daftar ekuitas", async () => {
    onRender();

    const equity = await screen.findByRole("list", { name: "Ekuitas" });

    expect(equity.textContent).not.toContain("Surplus/Defisit");
    expect(
      screen.getAllByRole("heading", { name: "Surplus/Defisit" }).length,
    ).toBeGreaterThan(0);
  });
});

describe("tab", () => {
  test("tab dibaca dari URL", async () => {
    query.current = "tab=laba-rugi";
    onRender();

    await screen.findByRole("list", { name: "Pendapatan" });
    expect(screen.getByRole("list", { name: "Beban" })).toBeTruthy();
    expect(requested.some((url) => url.includes("surplus-defisit"))).toBe(true);
    expect(requested.some((url) => url.includes("/neraca"))).toBe(false);
  });

  test("tab tidak dikenal jatuh ke neraca", async () => {
    query.current = "tab=arus-kas";
    onRender();

    await waitFor(() =>
      expect(requested.some((url) => url.includes("/neraca"))).toBe(true),
    );
  });
});

describe("buku besar", () => {
  test("tanpa akun: keadaan kosong, bukan galat, tanpa permintaan laporan", async () => {
    query.current = "tab=buku-besar";
    onRender();

    expect(
      screen.getByText("Pilih akun untuk melihat buku besarnya"),
    ).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requested.some((url) => url.includes("buku-besar"))).toBe(false);
  });

  test("saldo awal dan akhir dibaca dari laporan, bukan dijumlah dari halaman", async () => {
    query.current = "tab=buku-besar&akun=1-100&page=2";
    onRender();

    await waitFor(() => expect(screen.getByText("Rp 4.500.000")).toBeTruthy());
    expect(screen.getByText("Rp 99.999.000")).toBeTruthy();
  });

  test("baris merutekan lewat publicId, bukan kode entri", async () => {
    query.current = "tab=buku-besar&akun=1-100";
    onRender({ LAPORAN_KEUANGAN: ["VIEW"], JURNAL: ["VIEW"] });

    const link = await screen.findByRole("link", {
      name: "Entri jurnal JRN-2026-0002",
    });

    expect(link.getAttribute("href")).toBe("/keuangan/jurnal/jrn-0002");
  });

  test("tanpa JURNAL VIEW barisnya tidak menaut", async () => {
    query.current = "tab=buku-besar&akun=1-100";
    onRender();

    await waitFor(() =>
      expect(screen.getByText("Persembahan kolekte")).toBeTruthy(),
    );
    expect(
      screen.queryByRole("link", { name: "Entri jurnal JRN-2026-0002" }),
    ).toBeNull();
  });

  test("kolomnya persis enam dan tidak menyebut orang", async () => {
    query.current = "tab=buku-besar&akun=1-100";
    onRender();

    await waitFor(() =>
      expect(screen.getByText("Saldo berjalan")).toBeTruthy(),
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent);

    expect(headers).toEqual([
      "Tanggal",
      "Kode entri",
      "Keterangan",
      "Debit",
      "Kredit",
      "Saldo berjalan",
    ]);
  });
});

describe("di luar lingkup", () => {
  test.each(["", "tab=laba-rugi", "tab=buku-besar&akun=1-100"])(
    "tidak ada tombol ekspor di %p",
    async (search) => {
      query.current = search;
      onRender();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(
        screen.queryByRole("button", { name: /ekspor|excel|pdf|unduh/i }),
      ).toBeNull();
      expect(screen.queryByText(/komisi|badan pelayanan/i)).toBeNull();
    },
  );
});
