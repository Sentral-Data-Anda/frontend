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

import { exportControlsIn } from "../export-guard";
import type { PayrollRunDetail, PayrollStatus, Payslip } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => {},
  }),
  usePathname: () => "/sdm/payroll/PYR-2026-0003",
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

const { PayrollDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const slip = (
  code: string,
  name: string,
  extra: Partial<Payslip> = {},
): Payslip => ({
  id: Number(code.slice(-1)),
  publicId: `slp-${code}`,
  code,
  karyawanId: Number(code.slice(-1)),
  basicSalary: "4500000.00",
  grossAmount: "4850000.00",
  deductionTotal: "0.00",
  netAmount: "4850000.00",
  note: null,
  karyawan: { publicId: `kry-${code}`, code: "KRY-0001", name },
  lines: [
    {
      publicId: `psl-${code}-1`,
      payrollComponentId: 1,
      componentName: "Tunjangan Transport",
      componentType: "EARNING",
      amount: "350000.00",
    },
  ],
  ...extra,
});

const detail = (
  status: PayrollStatus,
  extra: Partial<PayrollRunDetail> = {},
): PayrollRunDetail => ({
  id: 3,
  publicId: "pyr-3",
  code: "PYR-2026-0003",
  year: 2026,
  month: 8,
  status,
  totalGross: "9700000.00",
  totalDeduction: "0.00",
  totalNet: "9700000.00",
  approvedAt: null,
  paidAt: null,
  payslips: [
    slip("SLP-2026-0001", "Andreas Sitanggang"),
    slip("SLP-2026-0002", "Debora Manurung"),
  ],
  ...extra,
});

const PENDING_APPROVAL = {
  publicId: "apr-1",
  code: "APR-0901",
  status: "PENDING" as const,
  steps: [
    {
      order: 1,
      approverRoleName: "Bendahara",
      status: "APPROVED" as const,
      actor: { name: "Lidya" },
      actedAt: "2026-08-31T02:00:00.000Z",
    },
  ],
};

const onMockApi = (
  run: PayrollRunDetail,
  failure?: { status: number; error: string; code?: string },
) => {
  globalThis.fetch = ((input: string | URL, init?: RequestInit) => {
    if (init?.method && init.method !== "GET" && failure) {
      return Promise.resolve(
        Response.json(
          { status: failure.status, error: failure.error, code: failure.code },
          { status: failure.status },
        ),
      );
    }

    if (init?.method && init.method !== "GET") {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: run }),
      );
    }

    void input;

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: run }),
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
        <PayrollDetailScreen code="PYR-2026-0003" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
  replaced.length = 0;
});

describe("gerbang izin detail penggajian", () => {
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

  test("VIEW saja: nol tombol aksi di DOM", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    for (const label of [
      "Hitung ulang",
      "Ajukan untuk persetujuan",
      "Tandai sudah dibayar",
      "Batalkan",
      "Hapus",
    ]) {
      expect(screen.queryByRole("button", { name: label }), label).toBeNull();
    }
  });
});

/**
 * Tombol yang statusnya tidak mengizinkan TIDAK ADA di DOM, bukan disabled —
 * dan PAID tidak punya satu pun jalan keluar, karena be-sada tidak punya satu
 * pun. Itulah yang membuat posting jurnal aman tanpa jalur pembalikan.
 */
describe("aksi mengikuti mesin status", () => {
  const labelsOf = () =>
    screen
      .queryAllByRole("button")
      .map((node) => node.textContent?.trim() ?? "")
      .filter((label) =>
        [
          "Hitung gaji",
          "Hitung ulang",
          "Ajukan untuk persetujuan",
          "Tandai sudah dibayar",
          "Batalkan",
          "Hapus",
        ].includes(label),
      )
      .sort();

  test("DRAFT menawarkan hitung, batalkan, hapus", async () => {
    onMockApi(detail("DRAFT", { payslips: [] }));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual(["Batalkan", "Hapus", "Hitung gaji"]);
  });

  test("CALCULATED menawarkan hitung ulang dan ajukan", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual([
      "Ajukan untuk persetujuan",
      "Batalkan",
      "Hapus",
      "Hitung ulang",
    ]);
  });

  test("APPROVED menawarkan bayar dan batalkan, bukan hapus", async () => {
    onMockApi(detail("APPROVED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual(["Batalkan", "Tandai sudah dibayar"]);
  });

  test("PAID: nol tombol, dan layar mengatakan ia final", async () => {
    onMockApi(detail("PAID", { paidAt: "2026-08-31T04:00:00.000Z" }));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual([]);
    expect(
      screen.getAllByText(/sudah dibayarkan dan pembukuannya sudah ditulis/)
        .length,
    ).toBeGreaterThan(0);
  });

  // Dibatalkan masih boleh dihapus — itu yang membebaskan bulannya untuk
  // dibuka ulang, dan be-sada memang mengizinkannya.
  test("CANCELLED hanya menawarkan hapus", async () => {
    onMockApi(detail("CANCELLED", { payslips: [] }));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual(["Hapus"]);
  });

  // "Menunggu persetujuan" BUKAN nilai status: ia diturunkan dari `approval`.
  test("menunggu tanda tangan: nol hitung ulang, dan jalan keluarnya ditulis", async () => {
    onMockApi(detail("CALCULATED", { approval: PENDING_APPROVAL }));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(labelsOf()).toEqual([]);
    expect(screen.getAllByText("Menunggu persetujuan").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(/Tarik pengajuannya di Permintaan Persetujuan/)
        .length,
    ).toBeGreaterThan(0);
  });
});

describe("konfirmasi menyebut akibatnya", () => {
  test("hitung ulang mengatakan hasil lama dibuang", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Hitung ulang" }));

    await waitFor(() =>
      expect(
        screen.getByText(/Seluruh slip yang sudah dihitung dibuang/),
      ).toBeTruthy(),
    );
  });

  test("bayar mengatakan jurnal ditulis dan tidak bisa dibalik", async () => {
    onMockApi(detail("APPROVED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Tandai sudah dibayar" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          /Satu entri jurnal ditulis dan tidak ada jalur pembalikannya/,
        ),
      ).toBeTruthy(),
    );
  });
});

describe("galat bercabang pada kode, bukan pada prosanya", () => {
  test("PAYROLL_RUN_CHANGED menawarkan muat ulang, bukan kirim ulang", async () => {
    onMockApi(detail("APPROVED"), {
      status: 409,
      error: "Penggajian Ini Sudah Berstatus PAID Dan Tidak Dapat Diubah Lagi",
      code: "PAYROLL_RUN_CHANGED",
    });
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Tandai sudah dibayar" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Penggajian ini sudah berubah.")).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Muat ulang" })).toBeTruthy();
  });

  test("PAYROLL_ACCOUNT_UNMAPPED menunjuk ke tempat memperbaikinya", async () => {
    onMockApi(detail("APPROVED"), {
      status: 400,
      error: "Akun Beban Gaji Belum Diatur Di Setelan Akuntansi",
      code: "PAYROLL_ACCOUNT_UNMAPPED",
    });
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Tandai sudah dibayar" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(
        screen.getByText(/Atur akunnya di Keuangan › Setelan Akuntansi/),
      ).toBeTruthy(),
    );
  });

  // 400 TANPA kode bukan salah satu cabang itu: prosanya lewat apa adanya.
  test("400 tanpa kode tidak memicu petunjuk perbaikan", async () => {
    onMockApi(detail("APPROVED"), {
      status: 400,
      error: "Penggajian Ini Belum Disetujui",
    });
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Tandai sudah dibayar" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText(/Penggajian Ini Belum Disetujui/)).toBeTruthy(),
    );
    expect(screen.queryByText(/Atur akunnya di Keuangan/)).toBeNull();
    expect(screen.queryByText("Penggajian ini sudah berubah.")).toBeNull();
  });
});

describe("layar mengatakan apa yang tidak lewat sini", () => {
  test("bulan penuh dan upah variabel ditulis di ringkasan", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText(/Penggajian membayar bulan penuh/)).toBeTruthy();
    expect(
      screen.getByText(
        /dibayar per ibadah atau per hari dicatat di Kas Keluar/,
      ),
    ).toBeTruthy();
  });

  // Jangan membangun slip yang bisa disunting, dan jangan membiarkan orang
  // mencari tombol yang tidak ada.
  test("nol tombol sunting slip, tambah baris, atau THR", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    for (const label of [/Tambah baris/i, /Sesuaikan slip/i, /THR/i]) {
      expect(screen.queryByText(label), String(label)).toBeNull();
    }
  });
});

describe("privasi detail", () => {
  test("penanda Data gaji ada, dan slip menaut ke halamannya sendiri", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Data gaji")).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Buka slip gaji Andreas Sitanggang SLP-2026-0001",
        })
        .getAttribute("href"),
    ).toBe("/sdm/payroll/PYR-2026-0003/slip/SLP-2026-0001");
  });

  // be-sada meng-`include` payslips tanpa `orderBy`; panelnya yang menstabilkan.
  test("slip dirender urut kode, apa pun urutan responsnya", async () => {
    onMockApi(
      detail("CALCULATED", {
        payslips: [
          slip("SLP-2026-0003", "Gideon Tampubolon"),
          slip("SLP-2026-0001", "Andreas Sitanggang"),
          slip("SLP-2026-0002", "Debora Manurung"),
        ],
      }),
    );
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );

    expect(
      screen
        .getAllByRole("link", { name: /^Buka slip gaji / })
        .map((node) => node.getAttribute("href")),
    ).toEqual([
      "/sdm/payroll/PYR-2026-0003/slip/SLP-2026-0001",
      "/sdm/payroll/PYR-2026-0003/slip/SLP-2026-0002",
      "/sdm/payroll/PYR-2026-0003/slip/SLP-2026-0003",
    ]);
  });

  test("nol kendali ekspor, cetak, atau unduh di seluruh dokumen", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(exportControlsIn(document)).toEqual([]);
  });

  /**
   * KEDUA cabang, karena baris jurnal punya dua: tautan bila pembaca memegang
   * JURNAL VIEW, teks polos bila tidak. Menguji satu saja membuat nominal yang
   * ditanam di cabang lain lolos — diukur, bukan dibayangkan.
   */
  test.each([
    ["dengan JURNAL VIEW", true],
    ["tanpa JURNAL VIEW", false],
  ])("nol nominal per orang di baris jurnal, %s", async (_label, isGranted) => {
    onMockApi(
      detail("PAID", {
        paidAt: "2026-08-31T04:00:00.000Z",
        journal: { publicId: "jrn-16", code: "JRN-2026-0016" },
      }),
    );
    granted.current = {
      [MENU.PAYROLL]: ALL,
      ...(isGranted ? { [MENU.JURNAL]: ["VIEW" as MenuAction] } : {}),
    };

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Toast.Provider>
          <PayrollDetailScreen code="PYR-2026-0003" />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );

    const journalRow = screen.getByText("Entri jurnal").closest("div");

    expect(journalRow?.textContent).toContain("JRN-2026-0016");
    expect(
      screen.queryAllByRole("link", { name: /JRN-2026-0016/ }).length,
    ).toBe(isGranted ? 1 : 0);
    expect(journalRow?.textContent).not.toContain("Andreas");
    expect(journalRow?.textContent).not.toContain("Rp");
  });

  // Run yang PAID tanpa `journal` di responsnya tidak boleh mengaku "belum
  // diposting": `markPaid` menulis entry-nya, jadi kalimat itu akan bohong.
  test("PAID tanpa data jurnal tidak mengklaim apa pun", async () => {
    onMockApi(detail("PAID", { paidAt: "2026-08-31T04:00:00.000Z" }));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(screen.queryByText("Belum diposting")).toBeNull();
    expect(screen.queryByText("Entri jurnal")).toBeNull();
  });

  test("sebelum dibayar, Belum diposting benar dari mesin statusnya", async () => {
    onMockApi(detail("CALCULATED"));
    onRender(ALL);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Agustus 2026" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Belum diposting")).toBeTruthy();
  });
});

describe("step-up pada bacaan detail", () => {
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

  test("403 polos jatuh ke galat biasa", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        Response.json(
          { status: 403, error: "Access denied: You do not have permission" },
          { status: 403 },
        ),
      )) as unknown as typeof fetch;
    onRender(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Gagal memuat penggajian")).toBeTruthy(),
    );
    expect(screen.queryByText("Data gaji terkunci")).toBeNull();
  });
});
