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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { expenseApproval, expenseDetail } from "../fixtures";
import type { CashExpenseDetail } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/kas-keluar/doc-7",
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

const { ExpenseDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

const FULL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onRender = (
  expense: CashExpenseDetail,
  access: Record<string, MenuAction[]> = { [MENU.KAS_KELUAR]: FULL },
) => {
  granted.current = access;
  globalThis.fetch = (async () =>
    Response.json({
      status: 200,
      message: "OK",
      data: expense,
    })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Toast.Provider>
        <ExpenseDetailScreen publicId={expense.publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("bahasa layar", () => {
  test("tidak pernah mengucapkan Debit atau Kredit", async () => {
    const { container } = onRender(
      expenseDetail({
        journal: {
          publicId: "jrn-0031",
          code: "JRN-2026-0031",
          status: "POSTED",
        },
      }),
    );

    await screen.findByText("Dibayarkan kepada");
    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
    expect(container.textContent).toContain("5-100 — Beban Listrik dan Air");
  });

  test("referensi tampil di ringkasan: itu tautan ke pesanannya", async () => {
    onRender(expenseDetail());

    expect(await screen.findByText("Referensi")).toBeTruthy();
    expect(screen.getByText("PSN-2026-0012")).toBeTruthy();
  });
});

describe("keadaan persetujuan", () => {
  test("Menunggu persetujuan diturunkan dari approval, dokumen tetap Draf", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    expect(await screen.findByText("Menunggu persetujuan")).toBeTruthy();
    expect(screen.queryByText("Draf")).toBeNull();
  });

  test("ditolak: tetap Draf, catatan penolak tampil, boleh diubah lagi", async () => {
    onRender(
      expenseDetail({
        approval: expenseApproval({
          status: "REJECTED",
          note: "Kas komisi belum cukup bulan ini.",
        }),
      }),
    );

    expect(await screen.findByText("Draf")).toBeTruthy();
    expect(screen.getByText(/Kas komisi belum cukup bulan ini\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
  });

  test("tautan ke permintaan persetujuan hanya dengan izin Persetujuan", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    await screen.findByText("Menunggu persetujuan");
    expect(screen.queryByRole("link", { name: "PST-2026-0007" })).toBeNull();

    cleanup();
    onRender(expenseDetail({ approval: expenseApproval() }), {
      [MENU.KAS_KELUAR]: FULL,
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW"],
    });

    expect(
      (await screen.findByRole("link", { name: "PST-2026-0007" })).getAttribute(
        "href",
      ),
    ).toBe(
      "/persetujuan/permintaan-persetujuan/0b5e7a00-0000-4000-a000-000000000007",
    );
  });
});

describe("aksi status", () => {
  test("draf tanpa pengajuan: Ubah, Hapus, Ajukan — tanpa Bayar", async () => {
    onRender(expenseDetail());

    expect(await screen.findByRole("button", { name: "Ajukan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bayar" })).toBeNull();
  });

  test("menunggu: Ubah dan Hapus hilang; tarik hanya untuk pengaju", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    expect(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(
      expenseDetail({
        approval: expenseApproval({ isSubmittedByViewer: false }),
      }),
    );

    await screen.findByText("Menunggu persetujuan");
    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
  });

  test("Bayar hanya dari Disetujui", async () => {
    onRender(
      expenseDetail({
        status: "APPROVED",
        approval: expenseApproval({ status: "APPROVED" }),
      }),
    );

    expect(await screen.findByRole("button", { name: "Bayar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeTruthy();

    cleanup();
    onRender(expenseDetail({ status: "PAID" }));

    await screen.findByText("Dibayar");
    expect(screen.queryByRole("button", { name: "Bayar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeTruthy();
  });

  test("Batalkan menanyakan alasan di halaman, bukan di dalam dialog", async () => {
    onRender(expenseDetail({ status: "PAID" }));

    fireEvent.click(await screen.findByRole("button", { name: "Batalkan" }));

    expect(
      await screen.findByRole("textbox", { name: /Alasan pembatalan/ }),
    ).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  test("tanpa UPDATE dan DELETE: tidak ada aksi yang dirender", async () => {
    onRender(expenseDetail(), { [MENU.KAS_KELUAR]: ["VIEW"] });

    await screen.findByText("Dibayarkan kepada");
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });
});

describe("entri jurnal", () => {
  test("dibayar: barisnya tampil dan menautkan entrinya dengan izin Jurnal", async () => {
    onRender(
      expenseDetail({
        status: "PAID",
        journal: {
          publicId: "jrn-0031",
          code: "JRN-2026-0031",
          status: "POSTED",
        },
      }),
      { [MENU.KAS_KELUAR]: FULL, [MENU.JURNAL]: ["VIEW"] },
    );

    expect(
      (await screen.findByRole("link", { name: "JRN-2026-0031" })).getAttribute(
        "href",
      ),
    ).toBe("/keuangan/jurnal/jrn-0031");
  });

  test("draf: tidak ada baris entri jurnal", async () => {
    onRender(expenseDetail());

    await screen.findByText("Dibayarkan kepada");
    expect(screen.queryByText("Entri jurnal")).toBeNull();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan ke server", () => {
    let isFetched = false;
    granted.current = {};
    globalThis.fetch = (async () => {
      isFetched = true;

      return Response.json({ status: 200, data: expenseDetail() });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Toast.Provider>
          <ExpenseDetailScreen publicId="doc-7" />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kas Keluar"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});

// Gerbang + pintu darurat. `onRender` di atas menjawab SETIAP fetch dengan
// dokumennya; di sini jawabannya dibedakan per URL supaya baris kepatuhan
// M−1 bisa diatur per test.
const onRenderGate = (
  expense: CashExpenseDetail,
  compliance: unknown[],
  access: Record<string, MenuAction[]> = { [MENU.KAS_KELUAR]: FULL },
) => {
  granted.current = access;
  const sent: { url: string; body: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("belum-lapor")) {
      return Response.json({ status: 200, message: "OK", data: compliance });
    }
    if (init?.method && init.method !== "GET") {
      sent.push({ url, body: JSON.parse(String(init.body)) });

      return Response.json(
        { status: 201, message: "OK", data: {} },
        { status: 201 },
      );
    }

    return Response.json({ status: 200, message: "OK", data: expense });
  }) as unknown as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ExpenseDetailScreen publicId={expense.publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return sent;
};

const APPROVED_KOMISI = () =>
  expenseDetail({
    status: "APPROVED",
    bapelId: 2,
    bapel: { code: "BPL-2", name: "Komisi Pemuda" },
    bapelChoice: "KOMISI",
  });

const pending = (state: string, waiver: unknown = null) => [
  { bapelId: 2, state, report: null, waiver },
];

describe("pintu darurat pembebasan", () => {
  test("bendahara melihat Bebaskan saat gerbang akan menolak", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("MISSING"));

    expect(
      await screen.findByRole("button", { name: "Bebaskan pencairan" }),
    ).toBeTruthy();
  });

  test("majelis TIDAK punya aksi itu di DOM — bukan disabled", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("MISSING"), {
      [MENU.KAS_KELUAR]: ["VIEW"],
    });

    await screen.findByText("Dibayarkan kepada");
    expect(
      screen.queryByRole("button", { name: "Bebaskan pencairan" }),
    ).toBeNull();
  });

  test("komisi TIDAK punya aksi itu di DOM — VIEW + CREATE saja", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("MISSING"), {
      [MENU.KAS_KELUAR]: ["VIEW", "CREATE"],
    });

    await screen.findByText("Dibayarkan kepada");
    expect(
      screen.queryByRole("button", { name: "Bebaskan pencairan" }),
    ).toBeNull();
  });

  test("gerbang tidak akan menolak: tidak ada pintu untuk dibuka", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("APPROVED"));

    await screen.findByText("Dibayarkan kepada");
    expect(
      screen.queryByRole("button", { name: "Bebaskan pencairan" }),
    ).toBeNull();
  });

  test("nol pencairan M-1: tidak ditawarkan", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("NOT_DUE"));

    await screen.findByText("Dibayarkan kepada");
    expect(
      screen.queryByRole("button", { name: "Bebaskan pencairan" }),
    ).toBeNull();
  });

  test("alasan wajib: dialog menolak yang kosong tanpa menembak server", async () => {
    const sent = onRenderGate(APPROVED_KOMISI(), pending("MISSING"));

    fireEvent.click(
      await screen.findByRole("button", { name: "Bebaskan pencairan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Bebaskan" }));

    expect(await screen.findByText("Tulis alasan pembebasannya")).toBeTruthy();
    expect(sent).toEqual([]);
  });

  test("dialog menyebut komisi DAN bulannya, supaya tak dikira global", async () => {
    onRenderGate(APPROVED_KOMISI(), pending("MISSING"));

    fireEvent.click(
      await screen.findByRole("button", { name: "Bebaskan pencairan" }),
    );

    expect(
      await screen.findByText(
        /Pencairan Komisi Pemuda bulan .+ akan dibebaskan/,
      ),
    ).toBeTruthy();
  });

  test("mengirim bapelId, tahun, bulan, dan alasan ke /pembebasan", async () => {
    const sent = onRenderGate(APPROVED_KOMISI(), pending("MISSING"));

    fireEvent.click(
      await screen.findByRole("button", { name: "Bebaskan pencairan" }),
    );
    fireEvent.change(await screen.findByLabelText("Alasan"), {
      target: { value: "  Pengurus baru dilantik.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bebaskan" }));

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.url).toContain("/kas-keluar/pembebasan");
    expect(sent[0]!.body).toEqual({
      bapelId: 2,
      year: 2026,
      month: 8,
      reason: "Pengurus baru dilantik.",
    });
  });
});

describe("panel alasan pembebasan", () => {
  const LONG = "A".repeat(250);

  test("alasan tampil PENUH, tanpa line-clamp maupun truncate", async () => {
    const { container } = render(<div />);
    cleanup();
    void container;

    onRenderGate(
      expenseDetail({
        status: "APPROVED",
        bapelId: 2,
        bapel: { code: "BPL-2", name: "Komisi Pemuda" },
        bapelChoice: "KOMISI",
        waiver: {
          reason: LONG,
          createdBy: { name: "Ibu Mariani" },
          createdAt: "2026-09-02T03:00:00.000Z",
        },
      }),
      pending("WAIVED"),
    );

    const panel = await screen.findByLabelText("Pembebasan gerbang pencairan");

    expect(panel.textContent).toContain(LONG);
    expect(panel.textContent).toContain("Ibu Mariani");

    // SETIAP ejaan pemotong yang Tailwind izinkan, bukan hanya yang terbayang —
    // dihitung dulu, bukan ditebak: `truncate` 373 di `src`, `line-clamp` 12,
    // `text-ellipsis` 1. `querySelectorAll` tidak mencocokkan akarnya, jadi
    // panelnya sendiri ikut diperiksa: memotong di elemen terluar lolos dari
    // pemeriksaan keturunan.
    //
    // LANGIT-LANGITNYA, satu kalimat lalu berhenti: ini pin teks, karena test
    // DOM tidak punya tata letak. Penjaga sebenarnya adalah pengukuran peramban
    // (`scrollWidth` vs `clientWidth`) yang menemukan luberannya; pin ini kawat
    // pemicunya, bukan buktinya.
    // Dikumpulkan sebagai STRING kelas, bukan sebagai simpul: membandingkan
    // simpul membuat laporan gagalnya mencetak seluruh pohon DOM.
    const clipped = [panel, ...panel.querySelectorAll("*")]
      .map((node) => node.className?.toString() ?? "")
      .filter((value) => /line-clamp|truncate|text-ellipsis/.test(value));

    expect(clipped).toEqual([]);

    // Dan ia harus MEMBUNGKUS: satu alasan 250 karakter tanpa spasi melebarkan
    // halaman 390 menjadi ~2000px tanpa ini — ditemukan di peramban, bukan di
    // sini. Membungkus bukan memotong; teksnya tetap utuh di atas.
    expect(
      [panel, ...panel.querySelectorAll("p")].some((node) =>
        /wrap-break-word|break-words|break-all/.test(
          node.className?.toString() ?? "",
        ),
      ),
    ).toBe(true);
  });
});

// Penolakan Bayar: dua `code`, dua perbaikan, dua spanduk. Masing-masing
// diperbaiki orang yang berbeda di layar yang berbeda.
const onRenderPayFailure = (
  failure: { error: string; code?: string },
  access: Record<string, MenuAction[]> = {
    [MENU.KAS_KELUAR]: FULL,
    [MENU.LAPORAN_BUDGET]: ["VIEW"],
    [MENU.PERIODE_FISKAL]: ["VIEW"],
  },
) => {
  granted.current = access;
  const expense = APPROVED_KOMISI();

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("belum-lapor")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: pending("MISSING"),
      });
    }
    if (init?.method && init.method !== "GET") {
      return Response.json({ status: 400, ...failure }, { status: 400 });
    }

    return Response.json({ status: 200, message: "OK", data: expense });
  }) as unknown as typeof fetch;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ExpenseDetailScreen publicId={expense.publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onPay = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Bayar" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("penolakan Bayar bercabang pada code", () => {
  test("BUDGET_REPORT_PENDING: tautan LPJ tersaring komisi, tahun, dan bulan", async () => {
    onRenderPayFailure({
      error: "Komisi Ini Belum Menyelesaikan Laporan Pemakaian Budget",
      code: "BUDGET_REPORT_PENDING",
    });
    await onPay();

    const link = await screen.findByRole("link", {
      name: "Lihat Laporan Budget",
    });

    expect(link.getAttribute("href")).toContain("/anggaran/laporan-budget");
    expect(link.getAttribute("href")).toContain("komisi=2");
    expect(link.getAttribute("href")).toContain("tahun=2026");
    expect(link.getAttribute("href")).toContain("bulan=8");
  });

  test("kata laporan dan budget TANPA code: pesan saja, tanpa tautan", async () => {
    onRenderPayFailure({
      error: "Laporan Pemakaian Budget komisi ini belum disetujui",
    });
    await onPay();

    expect(
      await screen.findByText(/Laporan Pemakaian Budget komisi ini/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Lihat Laporan Budget" }),
    ).toBeNull();
  });

  test("code tak dikenal: kalimatnya apa adanya, tanpa tautan", async () => {
    onRenderPayFailure({ error: "Sesuatu yang baru", code: "SOMETHING_NEW" });
    await onPay();

    expect(await screen.findByText("Sesuatu yang baru")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Lihat/ })).toBeNull();
  });

  test("tanpa LAPORAN_BUDGET VIEW: spanduknya tetap, tautannya tidak dirender", async () => {
    onRenderPayFailure(
      { error: "Belum disetujui", code: "BUDGET_REPORT_PENDING" },
      { [MENU.KAS_KELUAR]: FULL },
    );
    await onPay();

    expect(await screen.findByText("Belum disetujui")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Lihat Laporan Budget" }),
    ).toBeNull();
  });

  test("periode tertutup menautkan ke Periode Fiskal, BUKAN ke Laporan Budget", async () => {
    onRenderPayFailure({
      error: "Periode Fiskal Sudah Ditutup",
      code: "PERIOD_CLOSED",
    });
    await onPay();

    const link = await screen.findByRole("link", {
      name: "Lihat Periode Fiskal",
    });

    expect(link.getAttribute("href")).toBe("/keuangan/periode-fiskal");
    expect(
      screen.queryByRole("link", { name: "Lihat Laporan Budget" }),
    ).toBeNull();
  });
});
