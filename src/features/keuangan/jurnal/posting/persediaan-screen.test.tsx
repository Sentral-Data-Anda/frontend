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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { PostingResult } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
// Sadar MENU, bukan satu jawaban untuk semua: layar ini menanyakan JOURNAL_ENTRY
// untuk haknya memposting dan STOCK_ITEM untuk boleh-tidaknya menautkan
// barang yang ditolak. Mock yang mengabaikan menu mana yang ditanya membuat
// perbedaan itu tak teruji.
const barang: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/finance/journal-entry/posting-persediaan",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (menu: string) => {
    const granted = menu === "STOCK_ITEM" ? barang.current : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { PostingPersediaanScreen } = await import("./persediaan-screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  actions.current = [];
  barang.current = [];
});

const CLEAN: PostingResult = { posted: 2, skipped: 1, refused: [] };

const REFUSED: PostingResult = {
  posted: 1,
  skipped: 0,
  refused: [
    {
      code: "BRP-0004",
      reason:
        "Mutasi Sabun Lantai Belum Memiliki Nilai. Lengkapi Harga Barangnya Terlebih Dahulu",
      reasonCode: "STOCK_NO_COST",
    },
  ],
};

const onMockApi = (result: PostingResult) => {
  const calls: { url: string; body: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith("/api/v1/ddl/")) {
      return Response.json({
        status: 200,
        totalData: 0,
        totalPage: 0,
        data: [],
      });
    }

    const isDryRun = url.includes("dryRun=1");

    calls.push({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    return Response.json(
      {
        status: isDryRun ? 200 : 201,
        message: isDryRun ? "Berhasil Memeriksa" : "Berhasil Memposting",
        data: result,
      },
      { status: isDryRun ? 200 : 201 },
    );
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[], result: PostingResult = CLEAN) => {
  actions.current = granted;

  const calls = onMockApi(result);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PostingPersediaanScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const onPreview = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Lihat pratinjau/ }));
  // Ditunggu label KPI-nya, bukan tombol Posting: pratinjau yang membukukan
  // nol baris sengaja meninggalkan tombol itu mati, jadi menunggunya aktif
  // akan menggantung di kasus yang justru ingin diuji.
  await waitFor(() => expect(screen.getByText(/Akan diposting/)).toBeTruthy());
};

describe("gerbang izin", () => {
  test("tanpa CREATE pada Jurnal: layarnya tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.queryByRole("button", { name: "Posting" })).toBeNull();
    expect(
      screen.getByText("Tidak bisa memposting mutasi persediaan"),
    ).toBeTruthy();
  });
});

describe("pratinjau lalu posting", () => {
  test("pratinjau menembak dryRun, posting tidak", async () => {
    const calls = onRender(["VIEW", "CREATE"]);

    await onPreview();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/jurnal/posting-persediaan?dryRun=1");

    fireEvent.click(screen.getByRole("button", { name: "Posting" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]!.url).toBe("/api/v1/jurnal/posting-persediaan");
    expect(calls[1]!.url).not.toContain("dryRun");
  });

  // Tombol yang kadang tidak melakukan apa-apa mengajari bendahara untuk
  // berhenti mempercayainya.
  test("Posting mati sebelum ada pratinjau", () => {
    onRender(["VIEW", "CREATE"]);

    expect(
      (screen.getByRole("button", { name: "Posting" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  test("Posting tetap mati saat pratinjau tidak membukukan apa pun", async () => {
    onRender(["VIEW", "CREATE"], { posted: 0, skipped: 4, refused: [] });

    await onPreview();

    expect(
      (screen.getByRole("button", { name: "Posting" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  /**
   * Kalimat rentang kosong menyebut MUTASI PERSEDIAAN. `postingStatusOf`
   * dipakai bersama empat layar, dan kalimat yang dipaku di dalamnya membuat
   * layar ini berbunyi "tidak ada persembahan".
   */
  test("rentang kosong menyebut mutasi persediaan, bukan persembahan", async () => {
    onRender(["VIEW", "CREATE"], { posted: 0, skipped: 0, refused: [] });

    await onPreview();

    // Dua kali: action bar punya varian mobile dan desktop.
    expect(
      screen.getAllByText(/Tidak ada mutasi persediaan/i).length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain(
      "Tidak ada persembahan yang bisa diposting",
    );
  });
});

describe("yang ditolak", () => {
  test("alasannya tampil apa adanya, bukan diringkas jadi angka", async () => {
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    expect(screen.getByText(/Belum Memiliki Nilai/)).toBeTruthy();
  });

  /**
   * Kolom Perbaikan menautkan ke Barang Persediaan, bukan ke Mutasi Stok: yang
   * harus diperbaiki adalah HARGA barangnya. Sebuah mutasi tidak bisa diubah,
   * dan memang tidak seharusnya — dia catatan tentang apa yang terjadi.
   */
  test("menautkan ke Barang Persediaan sebagai cara memperbaikinya", async () => {
    barang.current = ["VIEW"];
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    expect(
      screen.getAllByRole("link", { name: "Buka Barang Persediaan" }).length,
    ).toBeGreaterThan(0);
  });

  /**
   * Yang disebut penolakan adalah kode BARANGNYA, bukan kode mutasinya: sebuah
   * mutasi tidak punya kode sendiri -- dia baris di kartu stok.
   */
  test("menaut ke barangnya saat peran memegang Barang Persediaan", async () => {
    barang.current = ["VIEW"];
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    const link = screen.getByRole("link", { name: "BRP-0004" });
    expect(link.getAttribute("href")).toContain("/inventory/stock-item/");
  });

  test("tanpa Barang Persediaan kodenya tetap terbaca, tanpa tautan", async () => {
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    expect(screen.queryByRole("link", { name: "BRP-0004" })).toBeNull();
    expect(screen.getAllByText("BRP-0004").length).toBeGreaterThan(0);
  });
});

describe("catatan layar", () => {
  /**
   * Satu-satunya tempat bendahara diberi tahu kenapa penerimaan barang dan
   * beli langsung tidak muncul di sini. Tanpa itu daftar yang pendek terbaca
   * sebagai kerusakan -- dan yang lebih buruk, seseorang akan mencari cara
   * "memperbaikinya" dengan membukukan pembelian itu dua kali.
   */
  test("menyebut bahwa penerimaan barang dan beli langsung tidak lewat sini", () => {
    onRender(["VIEW", "CREATE"]);

    expect(
      screen.getByText(/penerimaan barang dan beli langsung tidak lewat sini/i),
    ).toBeTruthy();
  });
});
