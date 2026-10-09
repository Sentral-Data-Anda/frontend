import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { exportControlsIn } from "../../../../../tests/export-guard";
import type { PayrollRunDetail, Payslip } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/hr/payroll/PYR-2026-0003/slip/SLP-2026-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const actions = granted.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { PayslipScreen } = await import("./slip-screen");

const originalFetch = globalThis.fetch;

const SLIP: Payslip = {
  id: 1,
  publicId: "slp-1",
  code: "SLP-2026-0001",
  karyawanId: 1,
  basicSalary: "4500000.00",
  grossAmount: "4850000.00",
  deductionTotal: "0.00",
  netAmount: "4850000.00",
  note: null,
  karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Andreas Sitanggang" },
  lines: [
    {
      publicId: "psl-1",
      payrollComponentId: 1,
      componentName: "Tunjangan Transport",
      componentType: "EARNING",
      amount: "350000.00",
    },
  ],
};

const RUN: PayrollRunDetail = {
  id: 3,
  publicId: "pyr-3",
  code: "PYR-2026-0003",
  year: 2026,
  month: 8,
  status: "CALCULATED",
  totalGross: "4850000.00",
  totalDeduction: "0.00",
  totalNet: "4850000.00",
  approvedAt: null,
  paidAt: null,
  payslips: [SLIP],
};

const onMockApi = (run: PayrollRunDetail = RUN) => {
  globalThis.fetch = (() =>
    Promise.resolve(
      Response.json({ status: 200, message: "ok", data: run }),
    )) as unknown as typeof fetch;
};

const onRender = (actions: MenuAction[], slipCode = "SLP-2026-0001") => {
  granted.current = { [MENU.PAYROLL]: actions };

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PayslipScreen code="PYR-2026-0003" slipCode={slipCode} />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

describe("gerbang izin halaman slip", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Penggajian"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("kode slip yang tidak ada di run ini: tidak ditemukan", async () => {
    onMockApi();
    onRender(["VIEW"], "SLP-2026-9999");

    await waitFor(() =>
      expect(screen.getByText("Data slip gaji tidak ditemukan")).toBeTruthy(),
    );
  });
});

describe("isi slip", () => {
  test("merender karyawan, gaji pokok, baris, dan ketiga total", async () => {
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Andreas Sitanggang" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Tunjangan Transport")).toBeTruthy();
    expect(screen.getByText("Rp 4.500.000")).toBeTruthy();
    expect(screen.getAllByText("Rp 4.850.000").length).toBeGreaterThan(0);
  });

  /**
   * Gereja ini tidak memotong PPh21, jadi slip tanpa baris pajak adalah hasil
   * yang BENAR. Layar merender baris yang datang dan tidak menulis cabang
   * khusus untuk yang tidak datang.
   */
  test("nol baris PPh21 dikarang, dan nol panel potongan kosong dirender", async () => {
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Andreas Sitanggang" }),
      ).toBeTruthy(),
    );
    expect(screen.queryByText("PPh21")).toBeNull();
    expect(screen.queryByText(/Pajak/i)).toBeNull();
    // Potongan nol tetap angka di ringkasan, bukan tanda hubung.
    expect(screen.getByText("Rp 0")).toBeTruthy();
    expect(screen.queryByText("Total potongan")).toBeNull();
  });

  test("potongan yang ada dirender beserta totalnya", async () => {
    onMockApi({
      ...RUN,
      payslips: [
        {
          ...SLIP,
          deductionTotal: "64000.00",
          netAmount: "4786000.00",
          lines: [
            ...SLIP.lines,
            {
              publicId: "psl-2",
              payrollComponentId: 4,
              componentName: "Iuran BPJS Kesehatan",
              componentType: "DEDUCTION",
              amount: "64000.00",
            },
          ],
        },
      ],
    });
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Iuran BPJS Kesehatan")).toBeTruthy(),
    );
    expect(screen.getByText("Total potongan")).toBeTruthy();
  });
});

describe("privasi halaman slip", () => {
  test("penanda Data gaji ada", async () => {
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Data gaji")).toBeTruthy());
  });

  test("nol kendali ekspor, cetak, atau unduh di seluruh dokumen", async () => {
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Andreas Sitanggang" }),
      ).toBeTruthy(),
    );
    expect(exportControlsIn(document)).toEqual([]);
  });
});

describe("slip tidak bisa disunting, dan layar mengatakannya", () => {
  test("nol tombol sunting, dan jalan yang benar ditulis", async () => {
    onMockApi();
    onRender(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Andreas Sitanggang" }),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: /Ubah/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
    expect(screen.getByText(/dan tidak bisa disunting/)).toBeTruthy();
    expect(screen.getByText(/THR, bonus, honor per ibadah/)).toBeTruthy();
    expect(screen.getByText(/Catat di Kas Keluar/)).toBeTruthy();
  });
});

describe("step-up pada halaman slip", () => {
  test("403 ber-kode meminta password", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        Response.json(
          {
            status: 403,
            error: "Verifikasi Password Diperlukan",
            code: "STEP_UP_REQUIRED",
          },
          { status: 403 },
        ),
      )) as unknown as typeof fetch;
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Data gaji terkunci")).toBeTruthy(),
    );
  });
});
