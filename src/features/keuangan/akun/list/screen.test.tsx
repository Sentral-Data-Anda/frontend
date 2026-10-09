import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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
import type { Account } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/chart-of-account",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { AccountListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  query.current = "";
});

const account = (
  id: number,
  code: string,
  name: string,
  parentAccountId: number | null,
  extra: Partial<Account> = {},
): Account => ({
  id,
  publicId: `acc-${id}`,
  code,
  name,
  type: "ASSET",
  parentAccountId,
  parent:
    parentAccountId === null
      ? null
      : { id: parentAccountId, code: "1", name: "Aset", type: "ASSET" },
  isActive: true,
  netAssetClass: null,
  cashFlowCategory: null,
  childCount: 0,
  ...extra,
});

const ROWS: Account[] = [
  account(2, "1-100", "Kas", 1),
  account(1, "1", "Aset", null, { childCount: 2 }),
  account(3, "1-110", "Kas Kecil", 1, { isActive: false }),
];

const onRender = (granted: MenuAction[], rows: Account[] = ROWS) => {
  actions.current = granted;
  globalThis.fetch = (async () =>
    rows.length === 0
      ? Response.json(
          { status: 404, error: "Akun Tidak Ditemukan" },
          { status: 404 },
        )
      : Response.json({
          status: 200,
          totalData: rows.length,
          totalPage: 1,
          data: rows,
        })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AccountListScreen />
    </QueryClientProvider>,
  );
};

const orderOf = () =>
  [...document.querySelectorAll<HTMLElement>("[data-row-id]")].map(
    (row) => row.dataset.rowId,
  );

describe("daftar akun kosong", () => {
  test("instalasi baru: kalimatnya menjelaskan kenapa, plus Tambah akun", async () => {
    onRender(["VIEW", "CREATE"], []);

    expect(await screen.findByText("Belum ada akun")).toBeTruthy();
    expect(
      screen.getByText(/Daftar akun adalah dasar seluruh pembukuan/),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tambah akun" })).toBeTruthy();
    expect(screen.queryByLabelText("Cari akun")).toBeNull();
  });

  test("tanpa CREATE: tidak ada jalan keluar yang tidak bisa dipakai", async () => {
    onRender(["VIEW"], []);

    expect(await screen.findByText("Belum ada akun")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tambah akun" })).toBeNull();
  });
});

describe("pohon akun", () => {
  test("induk dulu lalu anaknya, dengan hitungan sub akun", async () => {
    onRender(["VIEW"]);

    expect(
      await screen.findByText("2 sub akun", { exact: false }),
    ).toBeTruthy();
    expect(orderOf()).toEqual(["1", "1-100", "1-110"]);
    expect(screen.getByText("3 akun")).toBeTruthy();
  });

  test("akun nonaktif ditandai di daftar", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Nonaktif")).toBeTruthy();
  });

  test("pencarian aktif meratakan pohon: urutan server dipertahankan", async () => {
    query.current = "search=kas";
    onRender(["VIEW"]);

    await screen.findByLabelText("Lihat akun 1-100 Kas");
    expect(orderOf()).toEqual(["1-100", "1", "1-110"]);
  });

  test("baris yang diratakan tetap menyebut induknya di meta", async () => {
    query.current = "search=kas";
    onRender(["VIEW"]);

    await screen.findByLabelText("Lihat akun 1-100 Kas");
    expect(screen.getAllByText(/Induk 1/).length).toBeGreaterThan(0);
  });

  test("anak yang bersarang tidak mengulang induknya di meta", async () => {
    onRender(["VIEW"]);

    await screen.findByLabelText("Lihat akun 1-100 Kas");
    expect(screen.queryByText(/Induk 1/)).toBeNull();
  });

  test("pensil ubah hanya dengan UPDATE", async () => {
    onRender(["VIEW"]);
    await screen.findByLabelText("Lihat akun 1-100 Kas");
    expect(screen.queryByLabelText("Ubah akun 1-100 Kas")).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE"]);
    expect(await screen.findByLabelText("Ubah akun 1-100 Kas")).toBeTruthy();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan ke server", () => {
    let isFetched = false;
    actions.current = [];
    globalThis.fetch = (async () => {
      isFetched = true;
      return Response.json({ status: 200, data: [] });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AccountListScreen />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Chart of Account"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});
