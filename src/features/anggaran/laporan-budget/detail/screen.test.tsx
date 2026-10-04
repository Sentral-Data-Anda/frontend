import { Toast } from "@base-ui/react/toast";
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
import type {
  BudgetReportDetail,
  ReportApproval,
  ReportApprovalStep,
} from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/anggaran/laporan-budget/lpb-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = actions.current[slug] ?? [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { ReportDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const ALL = ["VIEW", "CREATE", "UPDATE", "DELETE"] as MenuAction[];

const step = (next: Partial<ReportApprovalStep> = {}): ReportApprovalStep => ({
  publicId: "aps-lpb-0001-1",
  order: 1,
  approverRoleName: "Ketua Pengurus",
  status: "APPROVED",
  note: null,
  actedAt: "2026-10-02T02:00:00.000Z",
  actor: { name: "Pnt. Hotman Sinaga" },
  ...next,
});

const approval = (next: Partial<ReportApproval> = {}): ReportApproval => ({
  publicId: "apr-1",
  code: "APR-2026-0001",
  status: "APPROVED",
  currentOrder: 2,
  isSubmittedByViewer: true,
  steps: [
    step(),
    step({
      publicId: "aps-lpb-0001-2",
      order: 2,
      approverRoleName: "Sekretaris/Bendahara Pengurus",
      status: "PENDING",
      actedAt: null,
      actor: null,
    }),
  ],
  ...next,
});

const report = (
  next: Partial<BudgetReportDetail> = {},
): BudgetReportDetail => ({
  publicId: "lpb-0001",
  code: "LPB-2026-0001",
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  year: 2026,
  month: 9,
  label: "September 2026",
  status: "DRAFT",
  totalAmount: "10750000",
  approval: null,
  waiver: null,
  bapelId: 2,
  note: "Pemakaian bulan lalu.",
  disbursementTotal: "5250000",
  approvedBy: null,
  approvedAt: null,
  lines: [
    {
      publicId: "lpl-1",
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      programId: 1,
      program: {
        publicId: "prg-0001",
        code: "PRG-2026-0001",
        name: "Retret Pemuda",
      },
      spentDate: "2026-09-08",
      description: "Sewa tempat retret",
      amount: "5250000",
      cashExpense: { publicId: "bkk-0011", code: "BKK-2026-0011" },
    },
    {
      publicId: "lpl-2",
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      programId: null,
      program: null,
      spentDate: "2026-09-12",
      description: "Konsumsi rapat pengurus",
      amount: "5500000",
      cashExpense: null,
    },
  ],
  listReceipt: [
    {
      publicId: "att-1",
      name: "Kwitansi sewa vila",
      mimeType: "image/jpeg",
      size: 100,
      showOnWebsite: false,
      url: "/media/a.jpg",
    },
  ],
  ...next,
});

const onRender = (
  detail: BudgetReportDetail,
  granted: Record<string, MenuAction[]> = { LAPORAN_BUDGET: ALL },
) => {
  actions.current = granted;

  globalThis.fetch = (async (_input: RequestInfo | URL) =>
    Response.json({
      status: 200,
      message: "ok",
      data: detail,
    })) as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ReportDetailScreen publicId="lpb-0001" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const qrCount = () => document.querySelectorAll("ol svg").length;

describe("strip selisih di halaman baca", () => {
  test("dirender walaupun selisihnya nol, dan Ajukan tidak di-disable karenanya", async () => {
    onRender(report({ disbursementTotal: "10750000" }));

    expect(
      await screen.findByText(
        "Kas Keluar bulan ini Rp 10.750.000 · Laporan ini Rp 10.750.000 · selisih Rp 0",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ajukan" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  test("selisih besar tetap tidak memblokir pengajuan", async () => {
    onRender(report());

    expect(
      await screen.findByText(
        "Kas Keluar bulan ini Rp 5.250.000 · Laporan ini Rp 10.750.000 · selisih Rp 5.500.000",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ajukan" }).hasAttribute("disabled"),
    ).toBe(false);
  });
});

describe("daftar periksa sebelum Ajukan", () => {
  test("muncul di halaman baca dengan kelima butirnya, dan Ajukan tetap aktif", async () => {
    onRender(report({ listReceipt: [] }));

    const list = await screen.findByLabelText("Periksa sebelum mengajukan");

    expect(list.textContent).toContain("Belum ada kwitansi terlampir");
    expect(list.textContent).toContain("2 baris pemakaian.");
    expect(list.textContent).toContain("Selisih terhadap Kas Keluar");
    expect(list.textContent).toContain("1 baris tanpa program.");
    expect(
      screen.getByRole("button", { name: "Ajukan" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  test("butir baris tanpa program bernada informasi, bukan peringatan", async () => {
    onRender(report());

    const item = (await screen.findByText("1 baris tanpa program."))
      .parentElement;

    expect(item?.className).toContain("border-border");
    expect(item?.className).not.toContain("border-warning");
  });

  test("butir kwitansi nol diberi peringatan", async () => {
    onRender(report({ listReceipt: [] }));

    const item = (
      await screen.findByText(
        "Belum ada kwitansi terlampir. Penanda tangan tidak punya bukti untuk dilihat.",
      )
    ).parentElement;

    expect(item?.className).toContain("border-warning");
  });
});

describe("ringkasan per program", () => {
  test("baris Tanpa program dirender dengan kelas yang sama dengan baris di atasnya", async () => {
    onRender(report());

    await screen.findAllByText("Tanpa program");

    const untagged = document.querySelector("[data-untagged]");

    expect(untagged?.textContent).toContain("Rp 5.500.000");
    expect(untagged?.className).toBe(
      untagged?.previousElementSibling?.className ?? "",
    );
  });

  test("baris Tanpa program tetap dirender ketika nilainya nol", async () => {
    onRender(
      report({
        lines: [report().lines[0]!],
        totalAmount: "5250000",
      }),
    );

    await screen.findAllByText("Tanpa program");

    expect(document.querySelector("[data-untagged]")?.textContent).toContain(
      "Rp 0",
    );
  });
});

describe("rincian menaut dengan kunci yang benar", () => {
  test("akun memakai code, program dan Kas Keluar memakai publicId", async () => {
    onRender(report(), {
      LAPORAN_BUDGET: ALL,
      AKUN: ["VIEW"] as MenuAction[],
      PROGRAM: ["VIEW"] as MenuAction[],
      KAS_KELUAR: ["VIEW"] as MenuAction[],
    });

    await screen.findByText("Sewa tempat retret");

    const hrefs = [...document.querySelectorAll("a")].map((node) =>
      node.getAttribute("href"),
    );

    expect(hrefs).toContain("/keuangan/akun/5-110");
    expect(hrefs).toContain("/anggaran/program/prg-0001");
    expect(hrefs).toContain("/keuangan/kas-keluar/bkk-0011");
  });

  test("tanpa izin menu tujuan, kodenya tetap terbaca sebagai teks", async () => {
    onRender(report(), { LAPORAN_BUDGET: ALL });

    await screen.findByText("Sewa tempat retret");

    const hrefs = [...document.querySelectorAll("a")].map((node) =>
      node.getAttribute("href"),
    );

    expect(hrefs).not.toContain("/keuangan/akun/5-110");
    expect(screen.getAllByText(/5-110 · Beban Administrasi/).length).toBe(2);
  });
});

describe("panel persetujuan", () => {
  test("jumlah tahap dibaca dari steps, dan jabatan yang ditampilkan", async () => {
    onRender(
      report({
        approval: approval({ status: "PENDING", currentOrder: 2 }),
      }),
    );

    expect(
      (await screen.findAllByText("Menunggu persetujuan (2 dari 2)")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Ketua Pengurus").length).toBeGreaterThan(0);
    expect(screen.getByText("Sekretaris/Bendahara Pengurus")).toBeTruthy();
  });

  test("tahap yang belum bertindak menyebut jabatannya, bukan nama orang", async () => {
    onRender(report({ approval: approval({ status: "PENDING" }) }));

    await screen.findByText("Sekretaris/Bendahara Pengurus");

    expect(screen.getByText("Menunggu tanda tangan jabatan ini")).toBeTruthy();
  });

  test("lencana diturunkan dari approval.status, bukan dari status dokumen", async () => {
    onRender(
      report({ status: "DRAFT", approval: approval({ status: "PENDING" }) }),
    );

    expect(
      (await screen.findAllByText("Menunggu persetujuan (2 dari 2)")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
  });
});

describe("QR verifikasi tanda tangan", () => {
  test("hanya tahap yang sudah bertindak yang punya QR", async () => {
    onRender(report({ approval: approval() }));

    await screen.findByText("Ketua Pengurus");

    expect(qrCount()).toBe(1);
  });

  test("tahap tanpa publicId tidak menghasilkan QR kosong", async () => {
    onRender(
      report({
        approval: approval({
          steps: [step({ publicId: null }), step({ publicId: null, order: 2 })],
        }),
      }),
    );

    await screen.findAllByText("Ketua Pengurus");

    expect(qrCount()).toBe(0);
  });

  test("tidak ada nominal di baris tahap yang membawa QR", async () => {
    onRender(report({ approval: approval() }));

    const row = (await screen.findAllByText("Ketua Pengurus"))[0]?.closest(
      "li",
    );

    expect(row?.textContent).not.toContain("Rp");
  });
});

describe("penolakan dan pembebasan ditampilkan penuh", () => {
  const LONG_NOTE =
    "Nominal konsumsi di baris ketiga tidak ada kwitansinya, dan dua baris bertanggal di luar bulan laporan. Mohon lampirkan kwitansinya, pindahkan baris yang bukan bulan ini ke laporan bulan yang benar, lalu ajukan lagi.";

  test("alasan penolakan tampil utuh dengan nama dan jabatan penolaknya", async () => {
    onRender(
      report({
        approval: approval({
          status: "REJECTED",
          steps: [step({ status: "REJECTED", note: LONG_NOTE })],
        }),
      }),
    );

    const alert = await screen.findByText(
      `${LONG_NOTE} Perbaiki lalu ajukan lagi.`,
    );

    expect(alert).toBeTruthy();
    expect(
      screen.getByText(/Ditolak · Pnt\. Hotman Sinaga · Ketua Pengurus/),
    ).toBeTruthy();
  });

  test("laporan yang ditolak tetap Draf dan masih bisa disunting", async () => {
    onRender(
      report({
        approval: approval({
          status: "REJECTED",
          steps: [step({ status: "REJECTED", note: LONG_NOTE })],
        }),
      }),
    );

    expect(await screen.findByRole("button", { name: "Ajukan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("alasan pembebasan tampil utuh dengan nama pembebas", async () => {
    const reason = "B".repeat(250);

    onRender(
      report({
        waiver: {
          reason,
          createdBy: { name: "Daniel Panjaitan" },
          createdAt: "2026-10-02T02:00:00.000Z",
        },
      }),
    );

    expect(await screen.findByText(reason)).toBeTruthy();
    expect(screen.getByText(/Daniel Panjaitan/)).toBeTruthy();
  });
});

describe("aksi status", () => {
  test("laporan disetujui tidak bisa dihapus dan tidak bisa diubah", async () => {
    onRender(report({ status: "APPROVED", approval: approval() }));

    await screen.findAllByText("September 2026");

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
  });

  test("Tarik hanya untuk pengaju", async () => {
    onRender(
      report({
        approval: approval({ status: "PENDING", isSubmittedByViewer: false }),
      }),
    );

    await screen.findAllByText("September 2026");

    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
  });

  test("tombol Cetak selalu ada untuk pemegang VIEW", async () => {
    onRender(report(), { LAPORAN_BUDGET: ["VIEW"] as MenuAction[] });

    expect(await screen.findByRole("button", { name: "Cetak" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
  });
});

describe("cetak", () => {
  test("aksi dan daftar periksa disembunyikan saat cetak, kwitansi tidak ikut tercetak", async () => {
    onRender(report());

    const checklist = await screen.findByLabelText(
      "Periksa sebelum mengajukan",
    );
    const receipts = screen.getByLabelText("Kwitansi laporan");

    expect(checklist.parentElement?.className).toContain("print:hidden");
    expect(
      screen.getByLabelText("Aksi laporan").parentElement?.className,
    ).toContain("print:hidden");
    expect(receipts.parentElement?.className).toContain("print:hidden");
  });

  test("judul print-only membawa komisi, kode, dan totalnya", async () => {
    onRender(report());

    const heading = await screen.findByRole("heading", {
      name: "Laporan Pemakaian Budget September 2026",
    });

    expect(heading.parentElement?.className).toContain("print:block");
    expect(heading.parentElement?.textContent).toContain("LPB-2026-0001");
    expect(heading.parentElement?.textContent).toContain("Rp 10.750.000");
  });
});

describe("tanpa akses", () => {
  test("tanpa VIEW layar tidak meminta datanya", async () => {
    onRender(report(), {});

    expect(
      await screen.findByText("Anda tidak memiliki akses ke Laporan Budget"),
    ).toBeTruthy();
  });
});
