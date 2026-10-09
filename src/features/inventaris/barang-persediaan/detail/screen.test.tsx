import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { movementCreateHref, movementListHref, stockEditHref } from "../model";
import type { ItemMovement, StockItem } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/inventory/stock-item/BRP-0009",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: MenuSlug) => {
    const actions = grants.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { StockDetailScreen } = await import("./screen");

const CODE = "BRP-0009";

const ref = (code: string, name: string) => ({ publicId: code, code, name });

const ITEM: StockItem = {
  id: 9,
  publicId: "s9",
  code: CODE,
  name: "Kidung Jemaat",
  description: "Buku nyanyian untuk jemaat tamu.",
  quantity: 120,
  reorderPoint: null,
  lastUnitPrice: "85000.00",
  avgUnitPrice: "82500.00",
  typeId: 6,
  bapelId: 5,
  roomId: 1,
  unitId: 1,
  type: ref("TYP_ITM-0006", "Perlengkapan Ibadah"),
  bapel: ref("BPL-5", "Komisi Musik"),
  room: ref("RM-0001", "Gedung Gereja"),
  unit: ref("UNT-0001", "Buah"),
};

const MOVEMENTS: ItemMovement[] = [
  {
    publicId: "m2",
    type: "OUT",
    source: "USAGE",
    quantity: 5,
    balanceAfter: 120,
    value: "-412500.00",
    movementDate: "2026-09-10T00:00:00.000Z",
  },
  {
    publicId: "m1",
    type: "ADJUSTMENT",
    source: "STOCK_OPNAME",
    quantity: -2,
    balanceAfter: 125,
    value: "-165000.00",
    movementDate: "2026-09-01T00:00:00.000Z",
  },
];

const originalFetch = globalThis.fetch;
const urls: string[] = [];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  urls.length = 0;
});

const onRender = (
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
  options: {
    item?: StockItem | null;
    movements?: ItemMovement[] | 500;
    total?: number;
  } = {},
) => {
  grants.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const movements = options.movements ?? MOVEMENTS;
    urls.push(url);

    if (url.includes("/mutasi-stok")) {
      if (movements === 500) {
        return Response.json(
          { status: 500, error: "Internal Server Error" },
          { status: 500 },
        );
      }

      return movements.length
        ? Response.json({
            status: 200,
            data: movements,
            totalData: options.total ?? movements.length,
            totalPage: 1,
          })
        : Response.json(
            { status: 404, error: "Mutasi Stok Tidak Ditemukan" },
            { status: 404 },
          );
    }
    if (options.item === null) {
      return Response.json(
        { status: 404, error: "Barang Persediaan Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({ status: 200, data: options.item ?? ITEM });
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <StockDetailScreen code={CODE} />
    </QueryClientProvider>,
  );
};

describe("halaman barang persediaan", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Barang Persediaan"),
    ).toBeTruthy();
  });

  test("stok, harga beli terakhir; riwayat dan Catat mutasi hanya dengan izin Mutasi Stok", async () => {
    onRender({ STOCK_ITEM: ["VIEW"] });

    const stock = await screen.findByRole("region", { name: "Stok" });
    expect(within(stock).getByText("120")).toBeTruthy();
    expect(within(stock).getByText("Tanpa batas menipis")).toBeTruthy();
    expect(screen.getByText("Rp 85.000")).toBeTruthy();
    expect(screen.queryByText("Riwayat stok")).toBeNull();
    expect(screen.queryByRole("link", { name: "Catat mutasi" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(urls.some((url) => url.includes("/mutasi-stok"))).toBe(false);

    cleanup();
    onRender({
      STOCK_ITEM: ["VIEW", "UPDATE"],
      STOCK_MOVEMENT: ["VIEW", "CREATE"],
    });

    const history = await screen.findByRole("region", { name: "Riwayat stok" });
    expect(await within(history).findByText("−5")).toBeTruthy();
    expect(within(history).getByText("Keluar · Pemakaian")).toBeTruthy();
    expect(within(history).getByText("−2")).toBeTruthy();
    expect(within(history).getByText("Koreksi · Stok opname")).toBeTruthy();
    expect(within(history).getByText("Sisa 125")).toBeTruthy();
    expect(urls).toContain("/api/v1/mutasi-stok?stockItemId=9&limit=10");
    expect(
      screen.getByRole("link", { name: "Catat mutasi" }).getAttribute("href"),
    ).toBe(movementCreateHref(CODE));
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(stockEditHref(CODE));
    expect(
      screen.queryByRole("link", { name: "Lihat semua mutasi" }),
    ).toBeNull();
  });

  /**
   * Harga rata-rata DAN nilai persediaannya, di atas harga beli terakhir.
   *
   * Harga rata-rata yang menilai stok keluar dan yang membuat saldo Persediaan
   * di Neraca; harga beli terakhir hanya keterangan. Menampilkan hanya yang
   * terakhir membuat pembaca mengalikan angka yang salah dan mendapat nilai
   * yang tidak pernah cocok dengan buku besar.
   */
  test("harga rata-rata dan nilai persediaannya ditampilkan", async () => {
    onRender({ STOCK_ITEM: ["VIEW"] });

    await screen.findByRole("region", { name: "Stok" });

    expect(screen.getByText("Harga rata-rata")).toBeTruthy();
    expect(screen.getByText("Rp 82.500")).toBeTruthy();
    // 120 x 82.500.
    expect(screen.getByText("Nilai persediaan Rp 9.900.000")).toBeTruthy();
  });

  /**
   * Barang tanpa harga sama sekali harus MENYEBUTKAN akibatnya.
   *
   * Pengambilannya ditolak saat posting, dan "—" tanpa penjelasan membuat
   * penolakan itu muncul sebulan kemudian di layar yang berbeda, kepada orang
   * yang berbeda, tanpa petunjuk apa pun tentang asalnya.
   */
  test("tanpa harga rata-rata, akibatnya disebut", async () => {
    onRender(
      { STOCK_ITEM: ["VIEW"] },
      { item: { ...ITEM, avgUnitPrice: null } },
    );

    await screen.findByRole("region", { name: "Stok" });

    expect(screen.getByText(/Pengambilan barang ini ditolak/)).toBeTruthy();
  });

  test("lebih dari 10 mutasi: Lihat semua mutasi", async () => {
    onRender({ STOCK_ITEM: ["VIEW"], STOCK_MOVEMENT: ["VIEW"] }, { total: 14 });

    expect(
      (
        await screen.findByRole("link", { name: "Lihat semua mutasi" })
      ).getAttribute("href"),
    ).toBe(movementListHref(CODE));
  });

  test("riwayat kosong dan gagal", async () => {
    onRender(
      { STOCK_ITEM: ["VIEW"], STOCK_MOVEMENT: ["VIEW"] },
      { movements: [] },
    );
    expect(await screen.findByText("Belum ada mutasi.")).toBeTruthy();

    cleanup();
    onRender(
      { STOCK_ITEM: ["VIEW"], STOCK_MOVEMENT: ["VIEW"] },
      { movements: 500 },
    );
    expect(await screen.findByText("Riwayat stok gagal dimuat.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });

  test("404: data tidak ditemukan", async () => {
    onRender({ STOCK_ITEM: ["VIEW"] }, { item: null });

    expect(
      await screen.findByText("Data barang persediaan tidak ditemukan"),
    ).toBeTruthy();
  });
});
