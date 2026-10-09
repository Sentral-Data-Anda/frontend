import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { KomponenPayroll } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/hr/payroll-component",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { KatalogListScreen } = await import("./katalog-screen");

const originalFetch = globalThis.fetch;

const ROWS: KomponenPayroll[] = [
  {
    id: 1,
    code: "KPY-0001",
    name: "Tunjangan Transport",
    type: "EARNING",
    calculationType: "FIXED",
    defaultValue: "350000.00",
    isTaxable: true,
    isActive: true,
    accountId: 23,
  },
  {
    id: 6,
    code: "PPH21",
    name: "PPh21",
    type: "DEDUCTION",
    calculationType: "FIXED",
    defaultValue: null,
    isTaxable: false,
    isActive: true,
    accountId: null,
  },
];

const onMockApi = () => {
  globalThis.fetch = ((input: string | URL) => {
    const href = String(input);

    if (href.includes("/ddl/account")) {
      return Promise.resolve(
        Response.json({
          status: 200,
          message: "ok",
          data: [{ id: 23, code: "5-110", name: "Beban Administrasi" }],
        }),
      );
    }

    return Promise.resolve(
      Response.json({
        status: 200,
        message: "ok",
        totalData: ROWS.length,
        totalPage: 1,
        data: ROWS,
      }),
    );
  }) as unknown as typeof fetch;
};

const onRender = (granted: MenuAction[]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <KatalogListScreen />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("gerbang izin daftar katalog", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Payroll Component"),
    ).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(isFetched).toBe(false);
  });

  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Tunjangan Transport")).toBeTruthy(),
    );
    expect(screen.queryByRole("link", { name: "Tambah komponen" })).toBeNull();

    viewport.onRestore();
  });
});

describe("baris PPH21 tampil tapi tidak bisa disunting", () => {
  test("dengan UPDATE: baris biasa punya pensil, PPH21 tidak", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("PPh21")).toBeTruthy());

    expect(
      screen
        .getByRole("link", { name: "Ubah Tunjangan Transport" })
        .getAttribute("href"),
    ).toBe("/hr/payroll-component/KPY-0001/ubah");
    expect(screen.queryByRole("link", { name: "Ubah PPh21" })).toBeNull();
    expect(screen.getByText("Dikelola sistem")).toBeTruthy();

    viewport.onRestore();
  });
});

describe("konfigurasi tabel katalog", () => {
  test("getRowHref menolak PPH21 walau UPDATE dipegang", async () => {
    const { katalogTable } = await import("./katalog-item");
    const table = katalogTable(true);

    expect(table.getRowHref?.(ROWS[0])).toBe(
      "/hr/payroll-component/KPY-0001/ubah",
    );
    expect(table.getRowHref?.(ROWS[1])).toBeUndefined();
  });

  test("tujuh kolom, dan Cara hitung serta Akun yang pelengkap", async () => {
    const { katalogTable } = await import("./katalog-item");
    const columns = katalogTable(false).columns;

    expect(columns.map((column) => column.key)).toEqual([
      "name",
      "code",
      "type",
      "calculationType",
      "defaultValue",
      "account",
      "status",
    ]);
    expect(
      columns
        .filter((column) => column.isSecondary)
        .map((column) => column.key),
    ).toEqual(["calculationType", "account"]);
  });
});
