import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { MENU, type MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { SUPPLIER_LIST_PATH, supplierEditHref } from "../model";
import type { Supplier } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pengadaan/supplier/SUP-0001",
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

const { SupplierDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const CODE = "SUP-0001";

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
});

const SUPPLIER: Supplier = {
  id: 1,
  publicId: "s1",
  code: CODE,
  name: "CV Sinar Teknik",
  contactPerson: "Budi Hartono",
  phone: "081263114520",
  email: "sales@sinarteknik.co.id",
  address: "Jl. Sisingamangaraja No. 88, Medan",
  npwp: null,
  bankName: "BCA",
  bankAccountNumber: "8200331145",
  bankAccountName: "CV Sinar Teknik",
  isActive: true,
};

const IN_USE =
  "Supplier Tidak Dapat Dihapus Karena Terhubung dengan Data Pengadaan. Nonaktifkan Saja";

const onRender = (
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
  options: { remove?: 200 | 400 } = {},
) => {
  const calls: string[] = [];

  grants.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push(`${method} ${String(input)}`);

    if (method === "DELETE") {
      return options.remove === 400
        ? Response.json({ status: 400, error: IN_USE }, { status: 400 })
        : Response.json({
            status: 200,
            message: "Berhasil Menghapus Supplier",
            data: SUPPLIER,
          });
    }

    return Response.json({ status: 200, data: SUPPLIER });
  }) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <SupplierDetailScreen code={CODE} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

describe("halaman supplier", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    const calls = onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Supplier"),
    ).toBeTruthy();
    expect(calls).toEqual([]);
  });

  test("data, tautan tel/mailto; tanpa UPDATE/DELETE/PESANAN tidak ada aksi", async () => {
    onRender({ [MENU.SUPPLIER]: ["VIEW"] });

    expect(
      await screen.findByRole("heading", { name: "CV Sinar Teknik" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "081263114520" }).getAttribute("href"),
    ).toBe("tel:081263114520");
    expect(
      screen
        .getByRole("link", { name: "sales@sinarteknik.co.id" })
        .getAttribute("href"),
    ).toBe("mailto:sales@sinarteknik.co.id");
    expect(
      screen.getByText("BCA · 8200331145 a.n. CV Sinar Teknik"),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus supplier" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Lihat pesanan supplier ini" }),
    ).toBeNull();
  });

  test("tautan pesanan hanya dengan PESANAN_PEMBELIAN VIEW", async () => {
    onRender({
      [MENU.SUPPLIER]: ["VIEW", "UPDATE"],
      [MENU.PESANAN_PEMBELIAN]: ["VIEW"],
    });

    expect(
      (
        await screen.findByRole("link", { name: "Lihat pesanan supplier ini" })
      ).getAttribute("href"),
    ).toBe("/pengadaan/pesanan-pembelian?supplier=1");
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(supplierEditHref(CODE));
  });

  test("hapus: konfirmasi preset, Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onRender({ [MENU.SUPPLIER]: ["VIEW", "DELETE"] });

    fireEvent.click(
      await screen.findByRole("button", { name: "Hapus supplier" }),
    );
    expect(
      await screen.findByText("Apakah Anda ingin menghapus supplier ini?"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([SUPPLIER_LIST_PATH]));
    expect(calls).toContain(`DELETE /api/v1/supplier/${CODE}`);
  });

  test("hapus dipakai (400): FormAlert pesan server + Nonaktifkan membuka form ubah", async () => {
    onRender(
      { [MENU.SUPPLIER]: ["VIEW", "UPDATE", "DELETE"] },
      { remove: 400 },
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Hapus supplier" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(IN_USE)).toBeTruthy();
    expect(screen.getByText("Supplier belum terhapus.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Nonaktifkan" }).getAttribute("href"),
    ).toBe(supplierEditHref(CODE));
    expect(replaced).toEqual([]);
  });
});
