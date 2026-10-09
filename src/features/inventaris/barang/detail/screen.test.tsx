import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import {
  approvalHref,
  barangEditHref,
  cycleCreateHref,
  cycleListHref,
  disposalHref,
} from "../model";
import type { AssetDetail } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/fixed-asset/asset-master/AST_0001_0001-0001",
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

const { BarangDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const CODE = "AST_0001_0001-0001";
const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const ASSET: AssetDetail = {
  id: 1,
  publicId: "a1",
  code: CODE,
  name: "Proyektor Epson EB-X51",
  description: "Proyektor utama ibadah raya.",
  serialNumber: "X51-7Q2K9031",
  condition: "BAIK",
  acquisitionSource: "PURCHASE",
  donorName: null,
  acquisitionDate: "2025-07-01T00:00:00.000Z",
  acquisitionCost: "8500000.00",
  warrantyUntil: "2020-01-01T00:00:00.000Z",
  isDepreciable: true,
  salvageValue: "500000.00",
  usefulLifeMonths: 48,
  depreciationStartDate: "2025-07-01T00:00:00.000Z",
  openingAccumulatedDepreciation: "1666666.70",
  openingAccumulatedAsOf: "2026-05-01T00:00:00.000Z",
  type: { id: 1, code: "TYP_ITM-0001", name: "Elektronik" },
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  mainImage: null,
  detailImage: [],
  status: "AKTIF",
  disposal: null,
  depreciation: {
    openingAccumulated: "1666666.70",
    accumulated: "2000000.04",
    bookValue: "6499999.96",
    lastPeriod: { year: 2026, month: 7 },
  },
};

const MAINTENANCE = Array.from({ length: 5 }, (_, index) => ({
  code: `SKA-2026-000${index + 1}`,
  status: "DONE",
  scheduledDate: "2026-08-01T00:00:00.000Z",
  completedDate: `2026-08-0${index + 2}T00:00:00.000Z`,
  description: `Servis ${index + 1}`,
}));

const listOf = (rows: unknown[], totalData = rows.length) =>
  rows.length
    ? Response.json({ status: 200, totalData, totalPage: 1, data: rows })
    : Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 });

const onRender = (
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
  options: { asset?: AssetDetail | null; history?: 500 } = {},
) => {
  const urls: string[] = [];

  grants.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);

    if (url.includes("/siklus-aset/")) {
      if (options.history === 500) {
        return Response.json(
          { status: 500, error: "Internal Server Error" },
          { status: 500 },
        );
      }
      if (url.includes("/perawatan")) return listOf(MAINTENANCE, 7);

      return listOf([]);
    }
    if (options.asset === null) {
      return Response.json(
        { status: 404, error: "Barang Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({ status: 200, data: options.asset ?? ASSET });
  }) as unknown as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BarangDetailScreen code={CODE} />
    </QueryClientProvider>,
  );

  return urls;
};

describe("halaman barang", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Barang"),
    ).toBeTruthy();
  });

  test("nilai buku dengan akumulasi awal; garansi habis; tanpa foto", async () => {
    onRender({ ASSET_MASTER: ["VIEW"] });

    const value = await screen.findByRole("region", {
      name: "Perolehan dan penyusutan",
    });
    expect(within(value).getByText("Harga perolehan")).toBeTruthy();
    expect(
      within(value).getByText("Rp 1.666.666,70 per Mei 2026"),
    ).toBeTruthy();
    expect(within(value).getByText("Rp 6.499.999,96")).toBeTruthy();
    expect(within(value).getByText("48 bulan (4 tahun)")).toBeTruthy();
    expect(within(value).getByText("Juli 2026")).toBeTruthy();
    expect(screen.getByText("1 Januari 2020 · habis")).toBeTruthy();
    expect(screen.getByText("Belum ada foto barang")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });

  test("donasi tanpa penyusutan: Nilai perolehan + pemberi, Tidak disusutkan", async () => {
    onRender(
      { ASSET_MASTER: ["VIEW"] },
      {
        asset: {
          ...ASSET,
          acquisitionSource: "DONATION",
          donorName: "Keluarga Bpk. Simanjuntak",
          isDepreciable: false,
          depreciation: null,
        },
      },
    );

    expect(
      await screen.findByText("Donasi dari Keluarga Bpk. Simanjuntak"),
    ).toBeTruthy();
    expect(screen.getByText("Nilai perolehan")).toBeTruthy();
    expect(screen.getByText("Tidak disusutkan")).toBeTruthy();
  });

  test("riwayat hanya dengan ASSET_TRANSACTION VIEW; > 5 → Lihat semua", async () => {
    const urls = onRender({ ASSET_MASTER: ["VIEW"] });

    await screen.findByText("Data barang");
    expect(screen.queryByText("Riwayat")).toBeNull();
    expect(urls.some((url) => url.includes("/siklus-aset/"))).toBe(false);

    cleanup();
    const granted = onRender({
      ASSET_MASTER: ["VIEW"],
      ASSET_TRANSACTION: ["VIEW"],
    });

    expect(await screen.findByText("Servis 1")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Lihat semua 7" }).getAttribute("href"),
    ).toBe(cycleListHref("perawatan", CODE));
    expect(await screen.findByText("Belum pernah dipindah.")).toBeTruthy();
    expect(screen.getByText("Belum ada pelepasan.")).toBeTruthy();
    expect(granted).toContain(
      "/api/v1/siklus-aset/perawatan?assetId=1&limit=5",
    );
    expect(screen.queryByRole("link", { name: /Catat perawatan/ })).toBeNull();
  });

  test("riwayat gagal: satu baris + Coba lagi per kelompok", async () => {
    onRender(
      { ASSET_MASTER: ["VIEW"], ASSET_TRANSACTION: ["VIEW"] },
      { history: 500 },
    );

    expect(await screen.findAllByText("Riwayat gagal dimuat.")).toHaveLength(3);
  });

  test("aksi siklus per izin; Ubah dengan UPDATE", async () => {
    onRender({ ASSET_MASTER: ALL, ASSET_TRANSACTION: ["VIEW", "CREATE"] });

    expect(
      (
        await screen.findByRole("link", { name: "Catat perawatan" })
      ).getAttribute("href"),
    ).toBe(cycleCreateHref("perawatan", CODE));
    expect(
      screen.getByRole("link", { name: "Pindahkan" }).getAttribute("href"),
    ).toBe(cycleCreateHref("pindah", CODE));
    expect(screen.queryByRole("link", { name: "Ajukan pelepasan" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(barangEditHref(CODE));

    cleanup();
    onRender({ ASSET_MASTER: ["VIEW"], ASSET_TRANSACTION: ["VIEW", "DELETE"] });
    expect(
      (
        await screen.findByRole("link", { name: "Ajukan pelepasan" })
      ).getAttribute("href"),
    ).toBe(cycleCreateHref("pelepasan", CODE));
    expect(screen.queryByRole("link", { name: "Pindahkan" })).toBeNull();
  });

  test("menunggu pelepasan: baris status + tautan; tanpa aksi siklus dan Ubah", async () => {
    onRender(
      {
        ASSET_MASTER: ALL,
        ASSET_TRANSACTION: ALL,
        APPROVAL_REQUEST: ["VIEW"],
      },
      {
        asset: {
          ...ASSET,
          status: "MENUNGGU_PELEPASAN",
          disposal: {
            code: "SKA-2026-0011",
            method: "LOST",
            disposalDate: "2026-09-20T00:00:00.000Z",
            status: "PENDING",
            approval: {
              publicId: "p-1",
              code: "PST-2026-0903",
              status: "PENDING",
            },
          },
        },
      },
    );

    expect(
      await screen.findByText("Pelepasan (hilang) menunggu persetujuan"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat pelepasan" })
        .getAttribute("href"),
    ).toBe(disposalHref("SKA-2026-0011"));
    expect(
      screen
        .getByRole("link", { name: "Lihat persetujuan" })
        .getAttribute("href"),
    ).toBe(approvalHref("p-1"));
    expect(screen.queryByRole("link", { name: "Catat perawatan" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });

  test("dilepas: baris status tanggal + cara", async () => {
    onRender(
      { ASSET_MASTER: ["VIEW"] },
      {
        asset: {
          ...ASSET,
          status: "DILEPAS",
          disposal: {
            code: "SKA-2026-0009",
            method: "SOLD",
            disposalDate: "2026-08-15T00:00:00.000Z",
            status: "APPROVED",
            approval: null,
          },
        },
      },
    );

    expect(
      await screen.findByText("Dilepas 15 Agustus 2026 — Dijual"),
    ).toBeTruthy();
  });

  test("404: data barang tidak ditemukan", async () => {
    onRender({ ASSET_MASTER: ["VIEW"] }, { asset: null });

    expect(await screen.findByText("Data barang tidak ditemukan")).toBeTruthy();
  });
});
