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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { karyawanMock } from "../../../../../scripts/mock/handlers/karyawan";
import { onStubViewport } from "../../../../../tests/viewport";

const search = { current: "" };
const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/hr/employee",
  useSearchParams: () => new URLSearchParams(search.current),
}));

/**
 * Mock SADAR-SLUG, dan ia harus begitu: factory yang mengabaikan argumennya
 * membuat `useMenuAccess(MENU.LEAVE)` di ketiga layar ini tetap hijau, yaitu
 * persis kelas bug yang `useMenuAccess` ada untuk mencegah. Hibah hanya
 * diberikan ke `MENU.EMPLOYEE`, jadi slug lain mengembalikan nol aksi.
 */
mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = slug === MENU.EMPLOYEE ? actions.current : [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { KaryawanListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");

    return karyawanMock({
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

// `MOCK_EMPTY` dibaca `list()` di kit mock, jadi ia global lintas berkas.
// Dibersihkan di sini, bukan di ekor test yang menyalakannya: test yang gagal
// di tengah tidak pernah sampai ke baris pembersihnya.
afterEach(() => {
  cleanup();
  delete process.env.MOCK_EMPTY;
});

const onRenderList = (granted: MenuAction[], query = "") => {
  search.current = query;
  actions.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <KaryawanListScreen />
    </QueryClientProvider>,
  );
};

const rowIdsOf = () =>
  [...document.querySelectorAll<HTMLElement>("[data-row-id]")].map(
    (row) => row.dataset.rowId,
  );

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan tanpa akses, bukan daftar kosong", () => {
    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Employee"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Cari karyawan")).toBeNull();
  });

  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText("8 karyawan");
    expect(screen.queryByRole("link", { name: "Tambah karyawan" })).toBeNull();
  });

  test("dengan CREATE: tombol tambah menunjuk /hr/employee/baru", async () => {
    onRenderList(["VIEW", "CREATE"]);

    await screen.findByText("8 karyawan");
    expect(
      screen
        .getByRole("link", { name: "Tambah karyawan" })
        .getAttribute("href"),
    ).toBe("/hr/employee/baru");
  });

  test("tanpa UPDATE: nol tautan ubah di baris", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText("8 karyawan");
    expect(screen.queryByRole("link", { name: /^Ubah / })).toBeNull();
  });

  test("dengan UPDATE: tautan baris memakai kode, bukan id", async () => {
    onRenderList(["VIEW", "UPDATE"]);

    await screen.findByText("8 karyawan");
    expect(
      screen
        .getByRole("link", { name: "Ubah Gideon Tampubolon" })
        .getAttribute("href"),
    ).toBe("/hr/employee/KRY-0003/ubah");
  });
});

describe("daftar", () => {
  test("baris berkunci kode dan urut nama dari server", async () => {
    onRenderList(["VIEW", "UPDATE"]);

    await screen.findByText("8 karyawan");
    expect(rowIdsOf()).toEqual([
      "KRY-0001",
      "KRY-0002",
      "KRY-0008",
      "KRY-0003",
      "KRY-0004",
      "KRY-0007",
      "KRY-0005",
      "KRY-0006",
    ]);
  });

  test("status dirender titik + teks dalam bahasa user", async () => {
    onRenderList(["VIEW"]);

    await screen.findByText("8 karyawan");
    expect(screen.getAllByText("Aktif").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Berhenti").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Diberhentikan").length).toBeGreaterThan(0);
    expect(screen.queryByText("ACTIVE")).toBeNull();
  });

  // README §0.3 no. 1: nol ekspor di seluruh grup SDM, termasuk layar yang
  // tidak menampilkan gaji — layar ini menampilkan nama, telepon, dan alamat.
  test("nol tombol ekspor, unduh, atau cetak", async () => {
    onRenderList(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await screen.findByText("8 karyawan");
    for (const name of [/ekspor/i, /unduh/i, /cetak/i, /export/i]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
      expect(screen.queryByRole("link", { name })).toBeNull();
    }
  });

  // S23: daftar kosong be-sada adalah 404. `fetchList` sudah menerjemahkannya
  // jadi nol baris, jadi layar ini TIDAK menulis cabang galat untuknya.
  test("404 karena pencarian: keadaan kosong, bukan keadaan galat", async () => {
    onRenderList(["VIEW"], "search=zzz");

    await waitFor(() =>
      expect(
        screen.getByText("Tidak ada karyawan yang cocok dengan pencarian ini."),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Coba lagi" })).toBeNull();
    expect(rowIdsOf()).toEqual([]);
  });

  test("tanpa pencarian: keadaan kosong menjelaskan apa yang dicatat di sini", async () => {
    process.env.MOCK_EMPTY = "1";
    onRenderList(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Belum ada karyawan")).toBeTruthy(),
    );
  });
});
