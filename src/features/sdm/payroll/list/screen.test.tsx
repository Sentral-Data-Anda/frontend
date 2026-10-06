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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { exportControlsIn } from "../export-guard";
import type { PayrollRun } from "../types";

/**
 * `tests/viewport.ts` hanya mencocokkan `DESKTOP_MEDIA_QUERY`, sementara
 * `DataList` merender tabelnya pada `TABLE_MEDIA_QUERY` (48rem). Jadi stub itu
 * sendirian membuat SELURUH tabel jatuh keluar dari himpunan subjek — diukur:
 * dengan ia saja, menanam kolom nama di `payrollTable()` membuat penjaga
 * privasi di bawah tetap hijau. Stub ini mencocokkan keduanya.
 */
const onStubWideViewport = () => {
  const original = window.matchMedia;

  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;

  return { onRestore: () => (window.matchMedia = original) };
};

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/sdm/payroll",
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

const { PayrollListScreen } = await import("./screen");
const { payrollTable } = await import("./list-item");

const originalFetch = globalThis.fetch;

const run = (
  code: string,
  month: number,
  status: PayrollRun["status"],
  extra: Partial<PayrollRun> = {},
): PayrollRun => ({
  id: month,
  publicId: `pyr-${month}`,
  code,
  year: 2026,
  month,
  status,
  totalGross: "16100000.00",
  totalDeduction: "64000.00",
  totalNet: "16036000.00",
  approvedAt: null,
  paidAt: null,
  ...extra,
});

const ROWS: PayrollRun[] = [
  run("PYR-2026-0003", 9, "PAID", { paidAt: "2026-09-30T04:00:00.000Z" }),
  run("PYR-2026-0002", 8, "CALCULATED"),
  run("PYR-2026-0001", 7, "DRAFT", {
    totalGross: "0.00",
    totalDeduction: "0.00",
    totalNet: "0.00",
  }),
];

const onMockApi = (status = 200, code: string | null = null) => {
  globalThis.fetch = (() => {
    if (status !== 200) {
      return Promise.resolve(
        Response.json(
          { status, error: "Verifikasi Password Diperlukan", code },
          { status },
        ),
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

const onRender = (actions: MenuAction[]) => {
  granted.current = { [MENU.PAYROLL]: actions };

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PayrollListScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

describe("gerbang izin daftar penggajian", () => {
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

  // Gerbang yang menjaga menu TETANGGA lolos kalau mocknya mengabaikan slug.
  test("VIEW di menu lain tidak membuka layar ini", () => {
    granted.current = { [MENU.KONTRAK_KARYAWAN]: ["VIEW", "CREATE"] };

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Toast.Provider>
          <PayrollListScreen />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Penggajian"),
    ).toBeTruthy();
  });

  test("tanpa CREATE: tombol buka periode tidak ada di DOM", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Buka periode" })).toBeNull();

    viewport.onRestore();
  });
});

describe("daftar penggajian", () => {
  test("periode ditulis dengan nama bulan, bukan 9/2026", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    expect(screen.getByText("Agustus 2026")).toBeTruthy();
    expect(screen.queryByText("9/2026")).toBeNull();

    viewport.onRestore();
  });

  test("nol rupiah dirender Rp 0, bukan tanda hubung", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Juli 2026")).toBeTruthy());
    // `formatAmount("0.00")` → "Rp 0", bukan "—": potongan nol rupiah adalah
    // angka, bukan ketiadaan, dan itu kasus yang helper lokal paling sering
    // salah.
    expect(screen.getByText(/Bersih Rp 0$/)).toBeTruthy();
    expect(screen.queryByText(/Bersih —/)).toBeNull();

    viewport.onRestore();
  });

  test("penanda Data gaji menetap di layar", async () => {
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Data gaji")).toBeTruthy());
  });
});

/**
 * §0.3 no. 3 — daftar yang bisa di-screenshot sekali jepret adalah risiko yang
 * berbeda dari halaman yang harus dibuka per orang.
 */
describe("privasi daftar", () => {
  test("nol nama karyawan di DOM, walau respons membawanya", async () => {
    const viewport = onStubWideViewport();
    globalThis.fetch = (() =>
      Promise.resolve(
        Response.json({
          status: 200,
          message: "ok",
          totalData: 1,
          totalPage: 1,
          // Bentuk yang be-sada TIDAK kirim hari ini, dikirim justru supaya
          // layar terbukti tidak merendernya kalau kelak ia datang.
          data: [
            {
              ...ROWS[0],
              payslips: [
                {
                  code: "SLP-2026-0001",
                  netAmount: "4500000.00",
                  karyawan: { name: "Andreas Sitanggang" },
                },
              ],
            },
          ],
        }),
      )) as unknown as typeof fetch;

    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    expect(screen.queryByText(/Andreas Sitanggang/)).toBeNull();
    expect(screen.queryByText(/SLP-2026-0001/)).toBeNull();
    // Dan kolomnya dinyatakan sendiri: baris tabel yang kosong karena datanya
    // kebetulan tidak ada bukan bukti bahwa kolomnya tidak ada.
    expect(payrollTable().columns.map((column) => column.key)).toEqual([
      "period",
      "code",
      "totalGross",
      "totalDeduction",
      "totalNet",
      "status",
    ]);

    viewport.onRestore();
  });

  test("nol kendali ekspor, cetak, atau unduh di seluruh dokumen", async () => {
    const viewport = onStubWideViewport();
    onMockApi();
    onRender(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    // `document`, bukan container: Base UI mem-portal panel filter ke `body`.
    expect(exportControlsIn(document)).toEqual([]);

    viewport.onRestore();
  });

  // Base UI mem-portal dialog ke `body`: kendali yang dipasang di sana jatuh
  // keluar dari container `render()`, jadi penjaganya memindai `document` dan
  // dialognya BENAR-BENAR dibuka supaya ada yang dipindai.
  test("dialog yang ter-portal ikut dipindai, bukan hanya badan halaman", async () => {
    const viewport = onStubWideViewport();
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Buka periode" }));

    await waitFor(() =>
      expect(screen.getByText("Buka periode penggajian")).toBeTruthy(),
    );
    expect(document.querySelectorAll("[role='alertdialog']").length).toBe(1);
    expect(exportControlsIn(document)).toEqual([]);

    viewport.onRestore();
  });
});

describe("step-up pada bacaan gaji", () => {
  test("403 ber-kode meminta password, bukan menyatakan tidak punya izin", async () => {
    onMockApi(403, "STEP_UP_REQUIRED");
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Data gaji terkunci")).toBeTruthy(),
    );
    expect(screen.getAllByText(/Masukkan password/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Anda tidak memiliki akses ke Penggajian"),
    ).toBeNull();
  });

  // 403 POLOS bukan step-up. Kontrak sempat salah persis di sini.
  test("403 tanpa kode jatuh ke galat biasa, bukan ke dialog password", async () => {
    onMockApi(403, null);
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.queryByText("Data gaji terkunci")).toBeNull(),
    );
    expect(screen.queryByText("Konfirmasi Password")).toBeNull();
  });
});
