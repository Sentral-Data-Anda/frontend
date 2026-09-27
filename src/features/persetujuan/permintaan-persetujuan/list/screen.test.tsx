import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { permintaanPersetujuanMock } from "../../../../../scripts/mock/handlers/permintaan-persetujuan";
import { onStubViewport } from "../../../../../tests/viewport";
import { PERMINTAAN_LIST_PATH } from "../model";

const search = { current: "" };
const access = { isCanView: true };
const replaced: string[] = [];
const requested: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => PERMINTAAN_LIST_PATH,
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: access.isCanView,
    isCanCreate: false,
    isCanUpdate: true,
    isCanDelete: false,
  }),
}));

const { PermintaanListScreen } = await import("./screen");
const { permintaanTable } = await import("./list-item");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    requested.push(url.search);

    return permintaanPersetujuanMock({
      request: new Request(url),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
      method: "GET",
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    });
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  replaced.length = 0;
  requested.length = 0;
  access.isCanView = true;
});

const onRenderPage = (query: string) => {
  search.current = query;
  window.history.replaceState(null, "", `${PERMINTAAN_LIST_PATH}?${query}`);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PermintaanListScreen />
    </QueryClientProvider>,
  );
};

describe("tiga bacaan", () => {
  test("antrean mengirim menunggu=saya tanpa status dan tampil", async () => {
    onRenderPage("status=REJECTED");

    await screen.findByText("Tidak ada yang menunggu tanda tangan Anda");
    expect(requested[0]).toContain("menunggu=saya");
    expect(requested[0]).not.toContain("status=");
    expect(requested[0]).not.toContain("tampil");
  });

  test("pengajuan meneruskan status", async () => {
    onRenderPage("tampil=pengajuan&status=REJECTED");

    await screen.findByText("1 pengajuan");
    expect(requested[0]).toContain("status=REJECTED");
    expect(requested[0]).not.toContain("menunggu");
    expect(requested[0]).not.toContain("tampil");
  });

  test("riwayat mengirim diproses=saya; baris memuat keputusan saya, bukan status kini", async () => {
    onRenderPage("tampil=riwayat&status=PENDING");

    await screen.findByText("4 sudah Anda proses");
    expect(requested[0]).toContain("diproses=saya");
    expect(requested[0]).not.toContain("status=");

    const row = document.querySelector<HTMLElement>(
      '[data-row-id="0b5e7a00-0000-4000-a000-000000000019"]',
    );

    expect(row?.textContent).toContain("Disetujui");
    expect(row?.textContent).not.toContain("Ditolak");
  });

  test("ganti bacaan membuang status dan halaman", async () => {
    onRenderPage("tampil=pengajuan&status=REJECTED&page=2");

    await screen.findByText("1 pengajuan");
    fireEvent.click(screen.getByRole("radio", { name: "Riwayat" }));

    expect(replaced.at(-1)).toBe(`${PERMINTAAN_LIST_PATH}?tampil=riwayat`);
  });

  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan ke server", () => {
    access.isCanView = false;
    onRenderPage("");

    expect(
      screen.getByText("Anda tidak memiliki akses ke Permintaan Persetujuan"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });
});

describe("konfigurasi tabel per bacaan", () => {
  const shape = (view: Parameters<typeof permintaanTable>[0]) =>
    permintaanTable(view).columns.map(
      (column) => `${column.header}${column.isSecondary ? "*" : ""}`,
    );

  test("kolom dan isSecondary", () => {
    expect(shape("menunggu")).toEqual([
      "Dokumen",
      "Pengaju",
      "Nominal",
      "Tahap",
      "Diajukan*",
      "Menunggu",
    ]);
    expect(shape("pengajuan")).toEqual([
      "Dokumen",
      "Nominal",
      "Posisi",
      "Diajukan*",
      "Status",
    ]);
    expect(shape("riwayat")).toEqual([
      "Dokumen",
      "Pengaju",
      "Nominal",
      "Keputusan saya",
      "Diproses",
      "Status kini*",
    ]);
  });
});
