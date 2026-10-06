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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { TipeCuti } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/sdm/tipe-cuti",
  useSearchParams: () =>
    new URLSearchParams(search.current ? `search=${search.current}` : ""),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { TipeCutiList } = await import("./tipe-cuti-list");

let viewport: ReturnType<typeof onStubViewport>;
const originalFetch = globalThis.fetch;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  search.current = "";
});

const ROWS: TipeCuti[] = [
  {
    id: 1,
    publicId: "p-1",
    code: "TCT-0001",
    name: "Cuti Tahunan",
    maxDaysPerYear: 12,
    isPaid: true,
    isActive: true,
  },
  {
    id: 3,
    publicId: "p-3",
    code: "TCT-0003",
    name: "Cuti Melahirkan",
    maxDaysPerYear: null,
    isPaid: true,
    isActive: false,
  },
];

const onStubList = (rows: TipeCuti[]) => {
  globalThis.fetch = (() =>
    Promise.resolve(
      rows.length
        ? Response.json({
            status: 200,
            message: "Berhasil Mendapatkan Tipe Cuti",
            totalData: rows.length,
            totalPage: 1,
            data: rows,
          })
        : Response.json(
            { status: 404, error: "Tipe Cuti Tidak Ditemukan" },
            { status: 404 },
          ),
    )) as unknown as typeof fetch;
};

const onRenderList = (granted: MenuAction[] = ["VIEW", "CREATE", "UPDATE"]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TipeCutiList />
    </QueryClientProvider>,
  );
};

// §0.2: nol tipe cuti di-seed, jadi kosong adalah keadaan HARI PERTAMA dan
// kalimatnya yang mengajari gereja apa yang harus diisi. Tanpa test ini
// kalimatnya bisa hilang dalam satu merge tanpa apa pun berbunyi.
describe("keadaan kosong hari pertama", () => {
  test("mengajari apa yang harus diisi, dengan daftar lazimnya", async () => {
    onStubList([]);
    onRenderList();

    expect(await screen.findByText("Belum ada tipe cuti")).toBeTruthy();

    const description = screen.getByText(/Gereja yang menentukan/);
    for (const usual of [
      "cuti tahunan",
      "sakit",
      "melahirkan",
      "menikah",
      "duka",
    ]) {
      expect(description.textContent).toContain(usual);
    }
    expect(description.textContent).toMatch(/jatah hari/i);
  });

  test("menawarkan daftar lazim sebagai KALIMAT, bukan tombol penyemai", async () => {
    onStubList([]);
    onRenderList();

    await screen.findByText("Belum ada tipe cuti");

    for (const seeded of ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan"]) {
      expect(screen.queryByRole("button", { name: seeded })).toBeNull();
      expect(screen.queryByRole("link", { name: seeded })).toBeNull();
    }
    expect(
      screen.queryByRole("button", { name: /Isi otomatis|Tambahkan semua/i }),
    ).toBeNull();
  });

  test("kosong karena pencarian memakai kalimat yang BERBEDA", async () => {
    search.current = "zzz";
    onStubList([]);
    onRenderList();

    expect(await screen.findByText("Tidak ada tipe cuti")).toBeTruthy();
    expect(screen.queryByText(/Gereja yang menentukan/)).toBeNull();
    expect(screen.getByText(/cocok dengan pencarian/)).toBeTruthy();
  });
});

describe("daftar berisi", () => {
  test("subjudul menghitung tipe cuti, dan baris merender jatah apa adanya", async () => {
    onStubList(ROWS);
    onRenderList();

    await waitFor(() => expect(screen.getByText("Cuti Tahunan")).toBeTruthy());

    expect(screen.getByText("2 tipe cuti")).toBeTruthy();
    expect(screen.getByText(/Tanpa batas/)).toBeTruthy();
    expect(screen.queryByText(/Gereja yang menentukan/)).toBeNull();
  });

  test("yang tidak aktif TETAP tampil — di sini ia dirawat", async () => {
    onStubList(ROWS);
    onRenderList();

    await waitFor(() =>
      expect(screen.getByText("Cuti Melahirkan")).toBeTruthy(),
    );
    expect(screen.getByText("Tidak aktif")).toBeTruthy();
  });

  test("kotak cari memberi tahu apa yang dicari", async () => {
    onStubList(ROWS);
    onRenderList();

    expect(
      await screen.findByPlaceholderText("Cari nama tipe cuti"),
    ).toBeTruthy();
  });

  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    onStubList(ROWS);
    onRenderList(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Cuti Tahunan")).toBeTruthy());
    expect(screen.queryByRole("link", { name: "Tambah tipe cuti" })).toBeNull();
  });

  test("dengan CREATE: tombol tambah menunjuk rute /baru", async () => {
    onStubList(ROWS);
    onRenderList();

    const add = await screen.findByRole("link", { name: "Tambah tipe cuti" });
    expect(add.getAttribute("href")).toBe("/sdm/tipe-cuti/baru");
  });
});
