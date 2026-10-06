import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import type { CeilingUsage } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { ProgramApproval, ProgramDetail } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/anggaran/program/prg-0001",
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

const { ProgramDetailScreen } = await import("./screen");

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

const YEAR = 2026;

const ALL = ["VIEW", "CREATE", "UPDATE", "DELETE"] as MenuAction[];

const usage = (next: Partial<CeilingUsage> = {}): CeilingUsage => ({
  year: YEAR,
  ceiling: "45000000",
  committed: "45000000",
  remaining: "0",
  isWithinCeiling: true,
  disbursed: "9000000",
  reported: "4500000",
  untagged: "2500000",
  ...next,
});

const approval = (next: Partial<ProgramApproval> = {}): ProgramApproval => ({
  publicId: "apr-1",
  code: "APR-2026-0001",
  status: "PENDING",
  currentOrder: 2,
  amount: "3000000",
  isSubmittedByViewer: true,
  steps: [
    {
      order: 1,
      approverRoleName: "Ketua Majelis Jemaat",
      status: "APPROVED",
      note: null,
      actedAt: null,
      actor: { name: "Pnt. Hotman Sinaga" },
    },
    {
      order: 2,
      approverRoleName: "Sekretaris Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
    {
      order: 3,
      approverRoleName: "Bendahara Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
  ],
  ...next,
});

const program = (next: Partial<ProgramDetail> = {}): ProgramDetail => ({
  publicId: "prg-0001",
  code: `PRG-${YEAR}-0001`,
  name: "Bakti Sosial Pemuda",
  year: YEAR,
  budgetYear: {
    year: YEAR,
    startMonth: 7,
    from: `${YEAR}-07-01`,
    to: `${YEAR + 1}-06-30`,
    label: `${YEAR}/${YEAR + 1} label server`,
  },
  status: "DRAFT",
  isUnplanned: false,
  startDate: `${YEAR}-09-01`,
  endDate: `${YEAR}-09-03`,
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  proposedAmount: "3000000",
  approval: null,
  bapelId: 2,
  description: "Paket sembako untuk jemaat lansia.",
  items: [
    {
      publicId: "pbi-1",
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      description: "Paket sembako",
      quantity: "1",
      unitPrice: "3000000",
      amount: "3000000",
      note: null,
    },
  ],
  ceiling: usage(),
  reportedUsage: {
    parts: [
      {
        publicId: "lpb-0001",
        code: `LPB-${YEAR}-0001`,
        label: "Agustus 2026",
        amount: "1200000",
      },
    ],
    total: "1200000",
    untagged: "4000000",
  },
  approvedBy: null,
  approvedAt: null,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
  ...next,
});

type Routes = Record<string, () => Response>;

const onMockApi = (detail: ProgramDetail, routes: Routes = {}) => {
  const calls: { url: string; method: string }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method });

    const route = Object.keys(routes).find(
      (key) => key === `${method} ${url.split("?")[0]}`,
    );

    if (route) return routes[route]!();

    if (url.startsWith("/api/v1/program/")) {
      return Response.json({ status: 200, message: "ok", data: detail });
    }

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (
  detail: ProgramDetail,
  granted: Record<string, MenuAction[]> = { PROGRAM: ALL },
  routes: Routes = {},
) => {
  actions.current = granted;
  const calls = onMockApi(detail, routes);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ProgramDetailScreen publicId="prg-0001" />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const failure = (code: string | null, error: string) => () =>
  Response.json(
    { status: 400, error, ...(code ? { code } : {}) },
    { status: 400 },
  );

describe("halaman usulan: pagu", () => {
  test("usulan tepat di pagu — Ajukan aktif, batas inklusif", async () => {
    onRender(program());

    const submit = await screen.findByRole("button", { name: "Ajukan" });

    expect(submit.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("Sisa setelah usulan ini")).toBeTruthy();
  });

  test("usulan satu rupiah di atas pagu — Ajukan disabled dengan alasan tertulis", async () => {
    onRender(
      program({
        proposedAmount: "3000001",
        ceiling: usage({
          committed: "45000001",
          remaining: "-1",
          isWithinCeiling: false,
        }),
      }),
    );

    const submit = await screen.findByRole("button", { name: "Ajukan" });

    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getAllByText("Usulan ini melebihi sisa pagu Rp 3.000.000.").length,
    ).toBeGreaterThan(0);
  });

  test("pagu belum ada — spanduk, tautan Pagu Anggaran, dan Ajukan TETAP dirender", async () => {
    onRender(
      program({
        ceiling: usage({
          ceiling: null,
          remaining: null,
          isWithinCeiling: false,
        }),
      }),
      { PROGRAM: ALL, PAGU_ANGGARAN: ["VIEW"] },
    );

    expect(
      await screen.findByText("Pagu anggaran badan pelayanan ini belum ada"),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Lihat Pagu Anggaran" })[0]
        ?.getAttribute("href"),
    ).toBe(`/anggaran/pagu-anggaran?komisi=2&tahun=${YEAR}`);

    const submit = screen.getByRole("button", { name: "Ajukan" });

    expect(submit.hasAttribute("disabled")).toBe(false);
  });

  test("tanpa izin Pagu Anggaran, spanduk tetap muncul tanpa tautannya", async () => {
    onRender(
      program({
        ceiling: usage({
          ceiling: null,
          remaining: null,
          isWithinCeiling: false,
        }),
      }),
    );

    expect(
      await screen.findByText("Pagu anggaran badan pelayanan ini belum ada"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Lihat Pagu Anggaran" }),
    ).toBeNull();
  });
});

describe("halaman usulan: galat ber-code", () => {
  test("NO_WORKFLOW memberi tautan Setelan Alur Persetujuan", async () => {
    onRender(
      program(),
      { PROGRAM: ALL, SETELAN_PERSETUJUAN: ["VIEW"] },
      {
        "POST /api/v1/program/prg-0001/pengajuan": failure(
          "NO_WORKFLOW",
          "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
        ),
      },
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ajukan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByRole("link", {
        name: "Lihat Setelan Alur Persetujuan",
      }),
    ).toBeTruthy();
  });

  test("pesan yang memuat kata alur tanpa code tidak memberi tautan", async () => {
    onRender(
      program(),
      { PROGRAM: ALL, SETELAN_PERSETUJUAN: ["VIEW"] },
      {
        "POST /api/v1/program/prg-0001/pengajuan": failure(
          null,
          "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
        ),
      },
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ajukan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await screen.findByText(
      "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    );

    expect(
      screen.queryByRole("link", { name: "Lihat Setelan Alur Persetujuan" }),
    ).toBeNull();
  });

  test("code yang tidak dikenal dirender sebagai kalimatnya tanpa tautan", async () => {
    onRender(
      program(),
      { PROGRAM: ALL, SETELAN_PERSETUJUAN: ["VIEW"] },
      {
        "POST /api/v1/program/prg-0001/pengajuan": failure(
          "SESUATU_BARU",
          "Penolakan yang belum dikenal layar ini",
        ),
      },
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ajukan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await screen.findByText("Penolakan yang belum dikenal layar ini");

    expect(screen.queryByRole("link", { name: /^Lihat / })).toBeNull();
  });
});

describe("halaman usulan: persetujuan", () => {
  test("Menunggu persetujuan diturunkan dari approval, bukan dari status", async () => {
    onRender(program({ approval: approval() }));

    expect(
      (await screen.findAllByText("Menunggu persetujuan (2 dari 3)")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
  });

  test("tarik hanya untuk pengaju", async () => {
    onRender(program({ approval: approval({ isSubmittedByViewer: false }) }));

    await screen.findAllByText("Menunggu persetujuan (2 dari 3)");

    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
  });

  test("pengaju melihat Tarik pengajuan", async () => {
    onRender(program({ approval: approval() }));

    expect(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    ).toBeTruthy();
  });

  test("ditolak: dokumen tetap Draf dan catatan penolak tampil penuh", async () => {
    const note =
      "Nominal konsumsi jauh di atas kegiatan sejenis tahun lalu. Mohon pecah per pos dan sesuaikan dengan sisa pagu komisi, lalu ajukan lagi.";

    onRender(
      program({
        approval: approval({
          status: "REJECTED",
          steps: [
            {
              order: 1,
              approverRoleName: "Ketua Majelis Jemaat",
              status: "REJECTED",
              note,
              actedAt: "2026-10-01T02:00:00.000Z",
              actor: { name: "Pnt. Hotman Sinaga" },
            },
          ],
        }),
      }),
    );

    const alert = await screen.findByText(`${note} Perbaiki lalu ajukan lagi.`);

    expect(alert.textContent).toContain(note);
    expect(
      screen.getByText(/Ditolak · Pnt. Hotman Sinaga · Ketua Majelis Jemaat/),
    ).toBeTruthy();
    expect(screen.getAllByText("Draf").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Ajukan" })).toBeTruthy();
  });
});

describe("halaman usulan: dua angka belanja", () => {
  test("Dilaporkan ke program ini dibaca dari laporan budget, bukan Kas Keluar atau jurnal", async () => {
    const calls = onRender(program(), {
      PROGRAM: ALL,
      LAPORAN_BUDGET: ["VIEW"],
    });

    await screen.findAllByText("Dilaporkan ke program ini");

    expect(
      screen.getByRole("link", { name: /LPB-2026-0001/ }).getAttribute("href"),
    ).toBe("/anggaran/laporan-budget/lpb-0001");
    expect(calls.some((call) => call.url.includes("programId"))).toBe(false);
    expect(calls.some((call) => call.url.includes("/jurnal"))).toBe(false);
    expect(calls.some((call) => call.url.includes("/kas-keluar"))).toBe(false);
  });

  test("Tanpa program tetap dirender saat nol, dengan kelas sama dengan baris di atasnya", async () => {
    onRender(
      program({ reportedUsage: { parts: [], total: "0", untagged: "0" } }),
    );

    const untagged = await screen.findByText("Tanpa program");
    const row = untagged.closest("[data-untagged]");

    expect(row).toBeTruthy();
    expect(row?.className).toBe(
      row?.nextElementSibling?.className.replace(" font-medium", ""),
    );
    expect(
      screen.getByText(
        "Belum ada pemakaian yang dilaporkan untuk program ini.",
      ),
    ).toBeTruthy();
  });

  test("tidak ada sel, field, atau aksi untuk Diberikan", async () => {
    onRender(program());

    await screen.findAllByText("Dilaporkan ke program ini");

    expect(screen.queryByText(/Diberikan/)).toBeNull();
    expect(screen.queryByText(/budgetAmount/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Tetapkan nominal/ }),
    ).toBeNull();
  });

  test("Dicairkan ke komisi dan Dilaporkan tidak digabung jadi satu angka", async () => {
    onRender(program());

    await screen.findAllByText("Dilaporkan ke program ini");

    expect(
      screen.getAllByText("Dicairkan ke badan pelayanan").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/^Realisasi$/)).toBeNull();
  });
});

describe("halaman usulan: batalkan", () => {
  test("batalkan tanpa alasan menolak di field, dan dialog menyebut pagu yang kembali", async () => {
    onRender(program());

    fireEvent.click(await screen.findByRole("button", { name: "Batalkan" }));

    expect(
      await screen.findByText(
        "Pagu badan pelayanan sebesar Rp 3.000.000 akan kembali tersedia untuk usulan lain.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batalkan usulan" }));

    expect(await screen.findByText("Isi alasan pembatalan")).toBeTruthy();
  });

  test("alasan pembatalan yang tersimpan tampil penuh", async () => {
    const reason =
      "Jadwal berbenturan dengan perayaan Natal gabungan jemaat, dan panitia sepakat kegiatan ini dilebur ke acara gabungan.";

    onRender(
      program({
        status: "CANCELLED",
        cancelReason: reason,
        cancelledBy: { name: "Daniel Panjaitan" },
        cancelledAt: "2026-10-01T02:00:00.000Z",
      }),
    );

    expect((await screen.findByText(reason)).textContent).toBe(reason);
    expect(screen.getByText(/Dibatalkan · Daniel Panjaitan/)).toBeTruthy();
  });
});

describe("halaman usulan: lingkup dan status mati", () => {
  test("di luar lingkup diperlakukan tidak ditemukan, tanpa menyatakan cakupan", async () => {
    onRender(
      program(),
      { PROGRAM: ALL },
      {
        "GET /api/v1/program/prg-0001": () =>
          Response.json(
            { status: 404, error: "Program Tidak Ditemukan" },
            { status: 404 },
          ),
      },
    );

    await waitFor(() =>
      expect(screen.queryByText(/tidak ditemukan/i)).toBeTruthy(),
    );

    expect(screen.queryByText(/tidak punya akses ke program ini/i)).toBeNull();
    expect(screen.queryByText(/(komisi|badan pelayanan) lain/i)).toBeNull();
  });

  test("ACTIVE dan COMPLETED tidak muncul sebagai label", async () => {
    onRender(program());

    await screen.findAllByText("Dilaporkan ke program ini");

    expect(screen.queryByText("Aktif")).toBeNull();
    expect(screen.queryByText("Selesai")).toBeNull();
  });

  test("label tahun dipakai apa adanya, tanpa perakitan di klien", async () => {
    onRender(program());

    expect(
      (await screen.findAllByText(`${YEAR}/${YEAR + 1} label server`)).length,
    ).toBeGreaterThan(0);
  });

  test("program mendadak memunculkan lencana Mendadak", async () => {
    onRender(program({ isUnplanned: true }));

    expect(await screen.findByText("Mendadak")).toBeTruthy();
  });
});
