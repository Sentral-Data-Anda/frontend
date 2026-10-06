import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { PenetapanKomponen } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/sdm/komponen-payroll/karyawan",
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

const { PenetapanListScreen } = await import("./penetapan-screen");

const originalFetch = globalThis.fetch;

const ROWS: PenetapanKomponen[] = [
  {
    publicId: "kkp-1",
    karyawanId: 1,
    payrollComponentId: 1,
    value: null,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: null,
    karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Ani Wijaya" },
    payrollComponent: {
      publicId: "kpy-1",
      code: "KPY-0001",
      name: "Tunjangan Transport",
      type: "EARNING",
      calculationType: "FIXED",
      defaultValue: "350000.00",
      isActive: true,
    },
  },
  {
    publicId: "kkp-2",
    karyawanId: 2,
    payrollComponentId: 4,
    value: "2.00",
    effectiveFrom: "2026-02-01T00:00:00.000Z",
    effectiveTo: "2026-12-31T00:00:00.000Z",
    karyawan: { publicId: "kry-2", code: "KRY-0002", name: "Budi Santoso" },
    payrollComponent: {
      publicId: "kpy-4",
      code: "KPY-0004",
      name: "Iuran BPJS",
      type: "DEDUCTION",
      calculationType: "PERCENTAGE",
      defaultValue: "1.00",
      isActive: false,
    },
  },
];

const onMockApi = () => {
  globalThis.fetch = ((input: string | URL) => {
    const href = String(input);

    if (href.includes("/ddl/")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: [] }),
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
      <PenetapanListScreen />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("gerbang izin daftar penetapan", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Komponen Payroll"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.queryByRole("link", { name: "Tambah penetapan" })).toBeNull();

    viewport.onRestore();
  });
});

describe("penanda data gaji", () => {
  test("menetap di daftar penetapan, dengan kata yang sama", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Data gaji")).toBeTruthy();
  });

  test("nilai null terbaca sebagai default komponen, bukan kosong", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.getByText(/Default komponen/)).toBeTruthy();
    expect(screen.getByText(/Terbuka/)).toBeTruthy();

    viewport.onRestore();
  });

  test("penetapan persentase dibaca persen, bukan rupiah", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Budi Santoso")).toBeTruthy());
    // 2% dulu terbaca "Rp 2": potongan dua persen jadi dua rupiah.
    expect(screen.getByText(/2%/)).toBeTruthy();
    expect(screen.queryByText(/Rp 2$/)).toBeNull();

    viewport.onRestore();
  });

  test("komponen nonaktif ditandai di barisnya", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Budi Santoso")).toBeTruthy());
    expect(screen.getByText("Nonaktif")).toBeTruthy();

    viewport.onRestore();
  });
});
