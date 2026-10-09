import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { QrCode } from "@/components/common/display";

const isCanView: { current: boolean } = { current: true };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/fixed-asset/asset-master/label",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: isCanView.current,
    isCanCreate: false,
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { BarangLabelScreen } = await import("./screen");

const LONG_NAME =
  "Proyektor Epson EB-X500 dengan layar tarik otomatis dan kabel HDMI dua puluh meter";

const ASSETS: Record<string, string> = {
  "AST_0001_0002-0001": LONG_NAME,
  "AST_0003_0001-0002": "Kursi Lipat",
};

const originalFetch = globalThis.fetch;
const urls: string[] = [];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  urls.length = 0;
  isCanView.current = true;
});

const onRender = (query: string) => {
  search.current = query;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const code = decodeURIComponent(url.split("/asset/")[1] ?? "");

    if (url.includes("/asset?")) {
      return Response.json({
        status: 200,
        data: Object.entries(ASSETS).map(([key, name]) => ({
          code: key,
          name,
        })),
        totalData: 130,
        totalPage: 2,
      });
    }

    return code in ASSETS
      ? Response.json({ status: 200, data: { code, name: ASSETS[code] } })
      : Response.json(
          { status: 404, error: "Barang Tidak Ditemukan" },
          { status: 404 },
        );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BarangLabelScreen siteUrl="https://sada.example" />
    </QueryClientProvider>,
  );
};

describe("cetak label barang", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    isCanView.current = false;
    onRender("kode=AST_0001_0002-0001");

    expect(
      screen.getByText("Anda tidak memiliki akses ke Barang"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("?kode= memuat per kode; kode tak dikenal dilaporkan", async () => {
    onRender("kode=AST_0001_0002-0001,SALAH");

    expect(
      await screen.findByRole("button", { name: "Cetak 1 label" }),
    ).toBeTruthy();
    expect(urls.sort()).toEqual([
      "/api/v1/asset/AST_0001_0002-0001",
      "/api/v1/asset/SALAH",
    ]);
    expect(screen.getByText("Kode tidak ditemukan: SALAH")).toBeTruthy();

    const name = screen.getByTitle(LONG_NAME);
    expect(name.className).toContain("line-clamp-2");
  });

  test("filter daftar → satu halaman 100, hint bila terpotong", async () => {
    onRender("status=aktif&ruang=2");

    expect(
      await screen.findByRole("button", { name: "Cetak 2 label" }),
    ).toBeTruthy();
    expect(urls).toEqual([
      "/api/v1/asset?page=1&limit=100&status=aktif&roomId=2",
    ]);
    expect(
      screen.getByText("Hanya 100 barang pertama. Persempit filter."),
    ).toBeTruthy();
  });

  test("0 dipilih → tombol cetak nonaktif dengan petunjuk", async () => {
    onRender("");

    fireEvent.click(await screen.findByRole("button", { name: "Kosongkan" }));

    const print = screen.getByRole("button", { name: "Cetak 0 label" });
    expect(print.hasAttribute("disabled")).toBe(true);
    expect(screen.getAllByText("Pilih minimal satu barang").length).toBe(2);

    fireEvent.click(screen.getByRole("checkbox", { name: /Kursi Lipat/ }));
    expect(
      screen
        .getByRole("button", { name: "Cetak 1 label" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  test("semua kode tak dikenal → kosong", async () => {
    onRender("kode=SALAH");

    expect(
      await screen.findByText("Tidak ada barang untuk dicetak"),
    ).toBeTruthy();
    expect(
      screen.getByText("Kode barang tidak ditemukan: SALAH."),
    ).toBeTruthy();
  });

  test("QR berupa SVG untuk kode ber-_ dan -", () => {
    const { container } = render(
      <QrCode value="https://sada.example/fixed-asset/asset-master/AST_0001_0002-0001" />,
    );

    expect(container.querySelector("svg path, svg rect")).toBeTruthy();
  });
});
