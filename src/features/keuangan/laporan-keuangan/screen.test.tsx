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

import { onStubViewport } from "../../../../tests/viewport";

import type {
  ArusKas,
  BukuBesar,
  Neraca,
  PerubahanAsetNeto,
  SurplusDefisit,
} from "./types";

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

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => {
  viewport.onRestore();
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
  netAssets: {
    tanpaPembatasan: "72750000",
    denganPembatasan: "10000000",
    total: "82750000",
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
  netAssets: { tanpaPembatasan: "0", denganPembatasan: "0", total: "0" },
  isOpeningEntered: false,
};

const LABA_RUGI: SurplusDefisit = {
  from: `${TODAY.slice(0, 7)}-01T00:00:00.000Z`,
  to: `${TODAY}T00:00:00.000Z`,
  income: [node(15, "4", "Pendapatan", "INCOME", "6420000")],
  expense: [node(21, "5", "Beban", "EXPENSE", "1850000")],
  totals: { income: "6420000", expense: "1850000", surplus: "4570000" },
  byNetAssetClass: {
    income: {
      tanpaPembatasan: "5420000",
      denganPembatasan: "1000000",
      total: "6420000",
    },
    expense: {
      tanpaPembatasan: "1850000",
      denganPembatasan: "0",
      total: "1850000",
    },
    surplus: {
      tanpaPembatasan: "3570000",
      denganPembatasan: "1000000",
      total: "4570000",
    },
  },
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

const ASET_NETO: PerubahanAsetNeto = {
  from: `${TODAY.slice(0, 7)}-01T00:00:00.000Z`,
  to: `${TODAY}T00:00:00.000Z`,
  opening: {
    tanpaPembatasan: "60000000",
    denganPembatasan: "9000000",
    total: "69000000",
  },
  income: {
    tanpaPembatasan: "5420000",
    denganPembatasan: "1000000",
    total: "6420000",
  },
  expense: {
    tanpaPembatasan: "1850000",
    denganPembatasan: "0",
    total: "1850000",
  },
  change: {
    tanpaPembatasan: "3570000",
    denganPembatasan: "1000000",
    total: "4570000",
  },
  equityMovement: { tanpaPembatasan: "0", denganPembatasan: "0", total: "0" },
  closing: {
    tanpaPembatasan: "63570000",
    denganPembatasan: "10000000",
    total: "73570000",
  },
};

const ARUS_KAS: ArusKas = {
  from: `${TODAY.slice(0, 7)}-01T00:00:00.000Z`,
  to: `${TODAY}T00:00:00.000Z`,
  openingCash: "4000000",
  sections: {
    operasi: "4570000",
    investasi: "-600000",
    pendanaan: "0",
  },
  lines: [
    {
      code: "1-500",
      name: "Aset Tetap",
      section: "INVESTASI",
      amount: "-600000",
    },
    {
      code: "4-100",
      name: "Persembahan Kolekte",
      section: "OPERASI",
      amount: "6420000",
    },
    {
      code: "5-100",
      name: "Beban Listrik",
      section: "OPERASI",
      amount: "-1850000",
    },
  ],
  change: "3970000",
  closingCash: "7970000",
  cashAccounts: [{ code: "1-100", name: "Kas" }],
  isDerived: false,
};

const state = {
  neraca: NERACA as Neraca,
  labaRugi: LABA_RUGI as SurplusDefisit,
  ledger: LEDGER as BukuBesar,
  asetNeto: ASET_NETO as PerubahanAsetNeto,
  arusKas: ARUS_KAS as ArusKas | null,
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requested.length = 0;
  query.current = "";
  state.neraca = NERACA;
  state.labaRugi = LABA_RUGI;
  state.ledger = LEDGER;
  state.asetNeto = ASET_NETO;
  state.arusKas = ARUS_KAS;
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
    if (url.includes("/perubahan-aset-neto")) {
      return Promise.resolve(ok(state.asetNeto));
    }
    if (url.includes("/arus-kas")) {
      // null = belum ada akun bertanda kas. Satu-satunya laporan di modul ini
      // yang menolak, dan penolakannya punya layar sendiri.
      return Promise.resolve(
        state.arusKas
          ? ok(state.arusKas)
          : Response.json(
              {
                status: 400,
                error:
                  "Belum Ada Akun Yang Ditandai Kas. Tetapkan Kategori Arus Kas Pada Akun Kas Dan Bank Terlebih Dahulu",
              },
              { status: 400 },
            ),
      );
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

  // "arus-kas" dulu dipakai sebagai contoh tab yang TIDAK dikenal. Sekarang
  // dia tab sungguhan, jadi contohnya harus yang tidak akan pernah jadi tab.
  test("tab tidak dikenal jatuh ke neraca", async () => {
    query.current = "tab=entah-apa";
    onRender();

    await waitFor(() =>
      expect(requested.some((url) => url.includes("/neraca"))).toBe(true),
    );
  });

  /**
   * Keempat laporan ISAK 35 punya tabnya masing-masing.
   *
   * Tab yang tidak ada sama dengan laporan yang tidak ada: Laporan Perubahan
   * Aset Neto dan Arus Kas tidak punya rute sendiri, jadi tab inilah
   * satu-satunya jalan ke sana.
   */
  test.each([
    ["aset-neto", "/perubahan-aset-neto"],
    ["arus-kas", "/arus-kas"],
  ])("tab %s meminta laporannya", async (tab, path) => {
    query.current = `tab=${tab}`;
    onRender();

    await waitFor(() =>
      expect(requested.some((url) => url.includes(path))).toBe(true),
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

describe("perubahan aset neto", () => {
  /**
   * Awal + perubahan = akhir, dan ketiganya per kelas.
   *
   * Inilah laporan yang membuat pembatasan terlihat. Tanpa kolomnya, dana
   * pembangunan tidak bisa dibedakan dari persembahan umum di laporan mana
   * pun, dan itu persis yang diminta ISAK 35.
   */
  test("menampilkan kedua kelas dan jumlahnya", async () => {
    query.current = "tab=aset-neto";
    onRender();

    expect(await screen.findByText("Aset neto awal")).toBeTruthy();
    expect(screen.getByText("Aset neto akhir")).toBeTruthy();
    expect(screen.getByText("Tanpa pembatasan")).toBeTruthy();
    expect(screen.getByText("Dengan pembatasan")).toBeTruthy();
    // 63.570.000 tanpa pembatasan, 10.000.000 dengan, 73.570.000 jumlahnya.
    expect(screen.getByText("Rp 73.570.000")).toBeTruthy();
    expect(screen.getByText("Rp 10.000.000")).toBeTruthy();
  });

  // Baris nol untuk hal yang hampir tidak pernah terjadi hanya menambah
  // panjang tabel yang harus dibaca tiap bulan.
  test("menyembunyikan perubahan ekuitas lain saat nol", async () => {
    query.current = "tab=aset-neto";
    onRender();

    await screen.findByText("Aset neto awal");
    expect(screen.queryByText("Perubahan ekuitas lain")).toBeNull();
  });

  test("menampilkannya saat ada isinya", async () => {
    state.asetNeto = {
      ...ASET_NETO,
      equityMovement: {
        tanpaPembatasan: "500000",
        denganPembatasan: "0",
        total: "500000",
      },
    };
    query.current = "tab=aset-neto";
    onRender();

    expect(await screen.findByText("Perubahan ekuitas lain")).toBeTruthy();
  });

  /**
   * Gereja tanpa dana terikat tetap melihat kolomnya, dan diberi tahu kenapa.
   *
   * Kolom nol tanpa penjelasan terbaca sebagai layar rusak; ISAK 35 memintanya
   * ada, dan nol adalah jawaban yang benar.
   */
  test("menjelaskan kolom nol untuk gereja tanpa dana terikat", async () => {
    state.asetNeto = {
      ...ASET_NETO,
      closing: {
        tanpaPembatasan: "63570000",
        denganPembatasan: "0",
        total: "63570000",
      },
    };
    query.current = "tab=aset-neto";
    onRender();

    expect(
      await screen.findByText(/belum punya dana dengan pembatasan/i),
    ).toBeTruthy();
  });
});

describe("arus kas", () => {
  test("memilah per bagian dan menutup dengan saldo akhir", async () => {
    query.current = "tab=arus-kas";
    onRender();

    expect(await screen.findByText("Aktivitas operasi")).toBeTruthy();
    expect(screen.getByText("Aktivitas investasi")).toBeTruthy();
    expect(screen.getByText("Aktivitas pendanaan")).toBeTruthy();
    expect(screen.getByText("Kas dan setara kas akhir")).toBeTruthy();
    // 4.000.000 awal + 3.970.000.
    expect(screen.getByText("Rp 7.970.000")).toBeTruthy();
  });

  /**
   * Akun lawannya disebut, bukan hanya tiga total.
   *
   * Tiga angka tanpa rinciannya tidak bisa ditelusuri siapa pun, dan laporan
   * arus kas adalah yang paling sering ditanyakan "ini dari mana".
   */
  test("menyebut akun di balik tiap bagian", async () => {
    query.current = "tab=arus-kas";
    onRender();

    expect(await screen.findByText("4-100 — Persembahan Kolekte")).toBeTruthy();
    expect(screen.getByText("1-500 — Aset Tetap")).toBeTruthy();
  });

  // Saldo akhir di sini yang berbeda dari Neraca harus bisa ditelusuri.
  test("menyebut akun mana yang dihitung sebagai kas", async () => {
    query.current = "tab=arus-kas";
    onRender();

    expect(await screen.findByText(/Kas dan setara kas: Kas\./)).toBeTruthy();
  });

  /**
   * MENOLAK, dengan perbaikannya, bukan "Coba lagi".
   *
   * Tanpa akun bertanda kas tidak ada yang bisa dijelaskan. Layar galat umum
   * hanya menawarkan mencoba lagi pada hal yang tidak akan berubah sampai
   * seseorang membuka Akun dan menandainya.
   */
  test("tanpa akun kas: menyebut perbaikannya, bukan menawarkan coba lagi", async () => {
    state.arusKas = null;
    query.current = "tab=arus-kas";
    onRender({ LAPORAN_KEUANGAN: ["VIEW"], AKUN: ["VIEW"] });

    expect(
      await screen.findByText("Belum ada akun yang ditandai kas."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buka Akun" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Coba lagi" })).toBeNull();
  });

  test("tanpa izin Akun, sebabnya tetap terbaca tanpa tautan", async () => {
    state.arusKas = null;
    query.current = "tab=arus-kas";
    onRender({ LAPORAN_KEUANGAN: ["VIEW"] });

    expect(
      await screen.findByText("Belum ada akun yang ditandai kas."),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Buka Akun" })).toBeNull();
  });

  /**
   * Laporan yang tidak bisa menyebutkan mana angkanya yang ditebak mengajak
   * pembacanya memercayai semuanya sama rata.
   */
  test("mengaku saat sebagian angkanya ditempatkan otomatis", async () => {
    state.arusKas = { ...ARUS_KAS, isDerived: true };
    query.current = "tab=arus-kas";
    onRender();

    expect(
      await screen.findByText(/ditempatkan otomatis dari tipe akunnya/i),
    ).toBeTruthy();
  });

  test("tidak mengaku saat semuanya dipilih", async () => {
    query.current = "tab=arus-kas";
    onRender();

    await screen.findByText("Aktivitas operasi");
    expect(
      screen.queryByText(/ditempatkan otomatis dari tipe akunnya/i),
    ).toBeNull();
  });
});

/**
 * Tabel aset neto menggulir mendatar di layar sempit, dan kolom "Dengan
 * pembatasan" — seluruh alasan laporan ini ada — berada di luar layar.
 *
 * Menggulir boleh; menggulir TANPA TANDA tidak. Ditemukan saat meninjau
 * layarnya, bukan saat membaca kodenya.
 *
 * Diukur dengan `scrollWidth` lawan `clientWidth`, bukan ditebak dari lebar
 * layar — breakpoint di layar fitur dilarang di repo ini, dan mengukur juga
 * lebih benar. Harganya: jsdom tidak melakukan layout, jadi `scrollWidth`
 * selalu 0 dan harus dipalsukan di sini atau jalur kodenya tidak teruji sama
 * sekali.
 */
describe("aset neto di layar sempit", () => {
  const onStubLayout = (scrollWidth: number, clientWidth: number) => {
    const descriptors = [
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth"),
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth"),
    ];

    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return scrollWidth;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return clientWidth;
      },
    });

    return () => {
      for (const [index, key] of ["scrollWidth", "clientWidth"].entries()) {
        const descriptor = descriptors[index];

        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, key, descriptor);
        } else {
          delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
            key
          ];
        }
      }
    };
  };

  test("mengatakan bahwa tabelnya bisa digeser saat memang tidak muat", async () => {
    const onRestore = onStubLayout(520, 358);

    try {
      query.current = "tab=aset-neto";
      onRender();

      expect(await screen.findByText(/Geser tabel ke samping/)).toBeTruthy();
    } finally {
      onRestore();
    }
  });

  // Petunjuk geser pada tabel yang muat utuh hanya mengajari pembacanya
  // mengabaikan petunjuk.
  test("diam saat tabelnya muat", async () => {
    const onRestore = onStubLayout(358, 358);

    try {
      query.current = "tab=aset-neto";
      onRender();

      await screen.findByText("Aset neto awal");
      expect(screen.queryByText(/Geser tabel ke samping/)).toBeNull();
    } finally {
      onRestore();
    }
  });
});
