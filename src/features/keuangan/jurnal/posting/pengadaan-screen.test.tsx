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
// untuk haknya memposting dan ASSET_MASTER untuk boleh-tidaknya menautkan aset yang
// ditolak. Mock yang mengabaikan menu mana yang ditanya membuat perbedaan itu
// tak teruji.
const faktur: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/finance/journal-entry/posting-pengadaan",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (menu: string) => {
    const granted =
      menu === "SUPPLIER_INVOICE" ? faktur.current : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { PostingPengadaanScreen } = await import("./pengadaan-screen");

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
  faktur.current = [];
});

const CLEAN: PostingResult = { posted: 2, skipped: 1, refused: [] };

const REFUSED: PostingResult = {
  posted: 1,
  skipped: 0,
  refused: [
    {
      code: "PYS-2026-0001",
      reason:
        "Faktur INV-2026-0003 Belum Diposting. Posting Fakturnya Terlebih Dahulu",
      reasonCode: "INVOICE_NOT_POSTED",
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
        <PostingPengadaanScreen />
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
    expect(screen.getByText("Tidak bisa memposting pengadaan")).toBeTruthy();
  });
});

describe("pratinjau lalu posting", () => {
  test("pratinjau menembak dryRun, posting tidak", async () => {
    const calls = onRender(["VIEW", "CREATE"]);

    await onPreview();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/jurnal/posting-pengadaan?dryRun=1");

    fireEvent.click(screen.getByRole("button", { name: "Posting" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]!.url).toBe("/api/v1/jurnal/posting-pengadaan");
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
   * Kalimat rentang kosong menyebut ASET, bukan persembahan. Tombolnya dipakai
   * bersama kedua layar, dan kalimat yang dipaku di helper-nya membuat layar
   * ini berbunyi "tidak ada persembahan". Terlihat saat meninjau layarnya.
   */
  test("rentang kosong menyebut pengadaan, bukan persembahan", async () => {
    onRender(["VIEW", "CREATE"], { posted: 0, skipped: 0, refused: [] });

    await onPreview();

    // Dua kali: action bar punya varian mobile dan desktop.
    expect(
      screen.getAllByText(/Tidak ada faktur atau pembayaran/i).length,
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

    expect(screen.getByText(/Belum Diposting/)).toBeTruthy();
  });

  /**
   * Kolom Perbaikan menautkan ke Barang. Tanpa pemetaan `ASSET_NO_COST` kolom
   * itu kosong untuk SETIAP aset yang ditolak, dan kolom itu ada justru untuk
   * mengatakan ke mana memperbaikinya.
   */
  test("menautkan ke Faktur Supplier sebagai cara memperbaikinya", async () => {
    faktur.current = ["VIEW"];
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    expect(
      screen.getAllByRole("link", { name: "Buka Faktur Supplier" }).length,
    ).toBeGreaterThan(0);
  });

  // Kodenya menaut ke asetnya hanya kalau pembacanya boleh membukanya.
  test("menaut ke faktur saat peran memegang Faktur Supplier", async () => {
    faktur.current = ["VIEW"];
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    const link = screen.getByRole("link", { name: "PYS-2026-0001" });
    expect(link.getAttribute("href")).toContain(
      "/procurement/supplier-invoice/",
    );
  });

  test("tanpa Faktur Supplier kodenya tetap terbaca, tanpa tautan", async () => {
    onRender(["VIEW", "CREATE"], REFUSED);

    await onPreview();

    expect(screen.queryByRole("link", { name: "PYS-2026-0001" })).toBeNull();
    expect(screen.getAllByText("PYS-2026-0001").length).toBeGreaterThan(0);
  });
});

describe("catatan layar", () => {
  // Kalimat ini satu-satunya tempat bendahara diberi tahu kenapa aset yang
  // dibeli tidak muncul di sini. Tanpa itu daftar yang pendek terbaca sebagai
  // kerusakan.
  test("menyebut bahwa fakturnya dibukukan lebih dulu", () => {
    onRender(["VIEW", "CREATE"]);

    expect(screen.getByText(/fakturnya lebih dulu/i)).toBeTruthy();
  });
});
