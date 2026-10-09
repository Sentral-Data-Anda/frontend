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
import { supplierDetailHref, supplierEditHref } from "../model";
import type { Supplier } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const search: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/procurement/supplier",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { SupplierListScreen } = await import("./screen");
const { SupplierListItemRow, supplierTable } = await import("./list-item");

const originalFetch = globalThis.fetch;
const urls: string[] = [];
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  urls.length = 0;
  search.current = "";
});

const onRender = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = query;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input));

    return Response.json(
      { status: 404, error: "Supplier Tidak Ditemukan" },
      { status: 404 },
    );
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SupplierListScreen />
    </QueryClientProvider>,
  );
};

describe("daftar supplier", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Supplier"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tambah hanya dengan CREATE; kosong mengajak menambah", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada supplier")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tambah supplier" })).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    expect(
      await screen.findByRole("link", { name: "Tambah supplier" }),
    ).toBeTruthy();
  });

  test("filter Nonaktif dari URL → isActive=false; kosong karena filter", async () => {
    onRender(["VIEW"], "status=nonaktif&search=jaya");

    expect(
      await screen.findByText(
        "Tidak ada supplier yang cocok dengan filter ini.",
      ),
    ).toBeTruthy();
    expect(urls[0]).toBe(
      "/api/v1/supplier?page=1&limit=10&filter=jaya&isActive=false",
    );
  });
});

const SUPPLIER: Supplier = {
  id: 7,
  publicId: "s7",
  code: "SUP-0007",
  name: "CV Lama Jaya",
  contactPerson: null,
  phone: "0614100221",
  email: null,
  address: null,
  npwp: null,
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
  isActive: false,
};

describe("baris supplier", () => {
  test("meta telepon saja bila tanpa kontak; nonaktif bertanda; pensil hanya dengan UPDATE", () => {
    render(
      <ul>
        <SupplierListItemRow supplier={SUPPLIER} />
      </ul>,
    );

    expect(
      screen
        .getByRole("link", { name: "Lihat supplier CV Lama Jaya" })
        .getAttribute("href"),
    ).toBe(supplierDetailHref("SUP-0007"));
    expect(screen.getByText("0614100221")).toBeTruthy();
    expect(screen.getByText("Nonaktif")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Ubah CV Lama Jaya" }),
    ).toBeNull();

    cleanup();
    render(
      <ul>
        <SupplierListItemRow
          supplier={{ ...SUPPLIER, isActive: true, contactPerson: "Andi" }}
          isCanUpdate
        />
      </ul>,
    );

    expect(screen.getByText("Andi · 0614100221")).toBeTruthy();
    expect(screen.queryByText("Aktif")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Ubah CV Lama Jaya" })
        .getAttribute("href"),
    ).toBe(supplierEditHref("SUP-0007"));
  });

  test("tabel: Email pelengkap; kolom aksi hanya dengan UPDATE", () => {
    const table = supplierTable(false);

    expect(table.columns.map((column) => column.key)).toEqual([
      "name",
      "contact",
      "phone",
      "email",
      "status",
    ]);
    expect(
      table.columns.find((column) => column.key === "email")?.isSecondary,
    ).toBe(true);
    expect(supplierTable(true).columns.at(-1)?.key).toBe("edit");
    expect(table.getRowHref?.(SUPPLIER)).toBe(supplierDetailHref("SUP-0007"));
  });
});
