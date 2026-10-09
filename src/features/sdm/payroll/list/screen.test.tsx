import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { exportControlsIn } from "../../../../../tests/export-guard";
import { onStubViewport } from "../../../../../tests/viewport";
import type { PayrollRun } from "../types";

/**
 * Nama orang, kode slip, dan nominal per orang, dicari atas TEKS yang benar-
 * benar dirender — bukan lewat `queryByText`, yang menyusun pesan galatnya
 * dengan menyerialisasi seluruh DOM dan menjatuhkan runner (exit 133) persis
 * saat ia menemukan sesuatu, yaitu saat kuitansinya paling dibutuhkan.
 */
const SALARY_LEAKS = [
  /Andreas Sitanggang/,
  /Debora Manurung/,
  /SLP-\d{4}-\d{4}/,
] as const;

const salaryLeaksIn = (root: ParentNode & { textContent: string | null }) =>
  SALARY_LEAKS.filter((pattern) => pattern.test(root.textContent ?? "")).map(
    String,
  );

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/hr/payroll",
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
    granted.current = { [MENU.EMPLOYEE_CONTRACT]: ["VIEW", "CREATE"] };

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

  // `formatAmount("0.00")` → "Rp 0", bukan "—": nol rupiah adalah angka, bukan
  // ketiadaan, dan itu kasus yang helper lokal paling sering salah. Dua tempat
  // yang gagal sendiri-sendiri: kolom Bersih di lebar tabel, dan meta "<kode> ·
  // Bersih <angka>" di baris HP.
  test("nol rupiah dirender Rp 0 di kolom Bersih dan di meta baris HP", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Juli 2026")).toBeTruthy());

    const row = [
      ...document.querySelectorAll<HTMLElement>("[data-row-id]"),
    ].find((node) => node.textContent?.includes("Juli 2026"));

    if (!row) throw new Error("baris Juli 2026 tidak ada di himpunan subjek");

    // Bruto | Potongan | Bersih, ketiganya nol di run Juli: isi selnya dipaku
    // sekaligus jumlah selnya, supaya kolom yang hilang tidak lewat sebagai
    // hijau.
    expect(
      within(row)
        .getAllByRole("cell")
        .slice(2, 5)
        .map((cell) => cell.textContent),
    ).toEqual(["Rp 0", "Rp 0", "Rp 0"]);

    act(() => viewport.onResize(false));

    await waitFor(() => expect(screen.getByText(/Bersih Rp 0$/)).toBeTruthy());
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
    const viewport = onStubViewport(true);
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
    expect(salaryLeaksIn(document.body)).toEqual([]);
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
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await waitFor(() =>
      expect(screen.getByText("September 2026")).toBeTruthy(),
    );
    // `document`, bukan container: Base UI mem-portal panel filter ke `body`.
    expect(exportControlsIn(document)).toEqual([]);

    viewport.onRestore();
  });

  /**
   * Dialog DAN pemilihnya dibuka, lalu seluruh `document` dipindai.
   *
   * Tiga lapis DOM, masing-masing dengan caranya sendiri untuk tidak ada saat
   * dipindai: badan halaman selalu ada; isi dialog hanya ada setelah dialognya
   * dibuka; opsi `SelectField` hidup di `Select.Portal` dan **tidak ada sama
   * sekali** sampai select-nya dibuka. Dua assertion yang benar di dua keadaan
   * berbeda punya irisan kosong, jadi semuanya berdiri di keadaan yang sama.
   *
   * Satu select per test, dengan dialog yang baru: menutup popup Base UI di
   * happy-dom tidak bisa diandalkan, dan select kedua yang gagal terbuka
   * membuat pemindaian berikutnya memindai nol opsi tanpa bilang apa-apa.
   */
  test.each([
    ["Tahun", 0],
    ["Bulan", 1],
  ])("isi dialog dan opsi pemilih %s ikut dipindai", async (_label, index) => {
    const viewport = onStubViewport(true);
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

    const triggers = screen.getAllByRole("combobox");

    expect(triggers).toHaveLength(2);
    fireEvent.keyDown(triggers[index], { key: "ArrowDown" });

    // Kuantifiernya: select yang diam-diam nol opsi membuat pemindaian di
    // bawahnya tidak memindai apa pun, dan hijaunya tidak berarti apa pun.
    await waitFor(() =>
      expect(
        document.querySelectorAll("[role='option']").length,
      ).toBeGreaterThan(0),
    );

    expect(exportControlsIn(document)).toEqual([]);
    expect(salaryLeaksIn(document.body)).toEqual([]);

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
