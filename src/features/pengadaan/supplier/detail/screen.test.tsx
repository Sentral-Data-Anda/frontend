import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { MENU, type MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { supplierEditHref } from "../model";
import type { Supplier } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/procurement/supplier/SUP-0001",
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

const onRender = (granted: Partial<Record<MenuSlug, MenuAction[]>>) => {
  const calls: string[] = [];

  grants.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(input)}`);

    return Response.json({ status: 200, data: SUPPLIER });
  }) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SupplierDetailScreen code={CODE} />
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
    expect(screen.queryByRole("button", { name: /Hapus/ })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Lihat pesanan supplier ini" }),
    ).toBeNull();
  });

  test("tautan pesanan hanya dengan PURCHASE_ORDER VIEW; hapus tidak di halaman ini", async () => {
    onRender({
      [MENU.SUPPLIER]: ["VIEW", "UPDATE", "DELETE"],
      [MENU.PURCHASE_ORDER]: ["VIEW"],
    });

    expect(
      (
        await screen.findByRole("link", { name: "Lihat pesanan supplier ini" })
      ).getAttribute("href"),
    ).toBe("/procurement/purchase-order?supplier=1");
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(supplierEditHref(CODE));
    expect(screen.queryByRole("button", { name: /Hapus/ })).toBeNull();
  });
});
