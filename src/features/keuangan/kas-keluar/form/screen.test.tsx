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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { expenseApproval, expenseDetail } from "../fixtures";
import type { CashExpenseDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
  }),
  usePathname: () => "/finance/kas-keluar/baru",
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

const { ExpenseFormScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  actions.current = [];
  replaced.length = 0;
  compliance.current = [];
  ceiling.current = null;
});

const BAPEL_DDL = [
  { id: 2, code: "BPL-0002", name: "Komisi Anak", isActive: true },
  { id: 3, code: "BPL-0003", name: "Komisi Pemuda", isActive: true },
];

const ACCOUNT_DDL = [
  { id: 2, code: "1-100", name: "Kas", type: "ASSET", isActive: true },
  {
    id: 22,
    code: "5-100",
    name: "Beban Listrik",
    type: "EXPENSE",
    isActive: true,
  },
];

const compliance: { current: unknown[] } = { current: [] };

// Sisa pagu dijawab TERPISAH dari catch-all GET. Tanpa cabang ini catch-all
// mengembalikan fixture detail kas keluar untuk `/sisa-pagu` juga, dan sebuah
// mock yang lebih longgar dari server adalah cara spanduk ini pernah
// menjatuhkan seluruh form.
const ceiling: { current: unknown } = { current: null };

const onMockApi = (detail?: CashExpenseDetail) => {
  const sent: FormData[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/sisa-pagu")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: ceiling.current,
      });
    }

    if (url.includes("belum-lapor")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: compliance.current,
      });
    }

    if (url.includes("/ddl/")) {
      const type = new URL(url, "http://x").searchParams.get("type");

      if (url.includes("/ddl/bapel")) {
        return Response.json({ status: 200, message: "ok", data: BAPEL_DDL });
      }

      return Response.json({
        status: 200,
        message: "ok",
        data: ACCOUNT_DDL.filter((row) => !type || row.type === type),
      });
    }

    if (!init?.method || init.method === "GET") {
      return detail
        ? Response.json({ status: 200, message: "ok", data: detail })
        : Response.json(
            { status: 404, error: "Tidak Ditemukan" },
            { status: 404 },
          );
    }

    sent.push(init.body as FormData);

    return Response.json(
      {
        status: 201,
        message: "Berhasil Menambahkan Kas Keluar",
        data: { ...expenseDetail(), publicId: "doc-new" },
      },
      { status: 201 },
    );
  }) as typeof fetch;

  return sent;
};

const onRenderForm = (granted: MenuAction[], publicId?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ExpenseFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("bentuk form", () => {
  test("tanpa field Program, dan tanpa kata Debit atau Kredit", () => {
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);

    expect(screen.queryByLabelText(/Program/)).toBeNull();
    expect(container.textContent).not.toContain("Program");
    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
  });

  test("tanpa field pajak", () => {
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);

    for (const word of ["PPN", "PPh", "NPWP", "Pajak"]) {
      expect(container.textContent).not.toContain(word);
    }
  });

  test("referensi menyebut pesanan pembelian", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.getByText(/Kode pesanan pembelian, nomor nota/)).toBeTruthy();
  });

  test("rincian menuntun aset ke pos aset tetap", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(
      screen.getByText(/pilih pos aset tetap, bukan pos beban/),
    ).toBeTruthy();
  });
});

describe("gerbang izin", () => {
  test("tanpa CREATE: /baru tidak merender form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah kas keluar")).toBeTruthy();
    expect(screen.queryByLabelText("Dibayarkan kepada")).toBeNull();
  });

  test("tanpa UPDATE: /ubah tidak memuat detail", () => {
    const sent = onMockApi(expenseDetail());
    onRenderForm(["VIEW", "CREATE"], "doc-7");

    expect(screen.getByText("Tidak bisa mengubah kas keluar")).toBeTruthy();
    expect(sent).toEqual([]);
  });
});

describe("ubah diblokir", () => {
  test("selama ada permintaan persetujuan terbuka: tarik dulu", async () => {
    onMockApi(expenseDetail({ approval: expenseApproval() }));
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    expect(
      await screen.findByText("Kas keluar sedang menunggu persetujuan"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Dibayarkan kepada")).toBeNull();
  });

  test("sesudah dibayar: hanya draf yang bisa diubah", async () => {
    onMockApi(expenseDetail({ status: "PAID" }));
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    expect(
      await screen.findByText("Kas keluar tidak bisa diubah"),
    ).toBeTruthy();
  });

  test("ditolak tetap draf, jadi form terbuka", async () => {
    onMockApi(
      expenseDetail({
        approval: expenseApproval({ status: "REJECTED", note: "Kas kurang." }),
      }),
    );
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    expect(
      ((await screen.findByLabelText("Dibayarkan kepada")) as HTMLInputElement)
        .value,
    ).toBe("CV Tirta Nusantara");
  });
});

describe("simpan", () => {
  test("form kosong tidak menembak server dan menandai field yang kurang", async () => {
    const sent = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Isi penerima pembayaran")).toBeTruthy();
    expect(screen.getByText("Pilih akun sumber dana")).toBeTruthy();
    expect(screen.getByText("Isi keterangan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
    expect(sent).toEqual([]);
  });

  test("ubah mengirim lines sebagai JSON string dan keepFiles, tanpa total dan tanpa programId", async () => {
    const sent = onMockApi(expenseDetail());
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    fireEvent.change(screen.getByLabelText("Dibayarkan kepada"), {
      target: { value: "CV Tirta  Nusantara Jaya" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(sent).toHaveLength(1));
    const body = sent[0]!;

    expect(body.get("payee")).toBe("CV Tirta Nusantara Jaya");
    expect(JSON.parse(String(body.get("lines")))).toEqual([
      {
        accountId: 22,
        amount: 3200000,
        description: "Servis dan penggantian impeler",
      },
    ]);
    expect(JSON.parse(String(body.get("keepFiles")))).toEqual([]);
    expect(body.get("totalAmount")).toBeNull();
    expect(body.get("programId")).toBeNull();
    expect(body.get("reference")).toBe("PSN-2026-0012");
  });
});

describe("kolom komisi harus dijawab", () => {
  const onFillRequired = () => {
    fireEvent.change(screen.getByLabelText("Dibayarkan kepada"), {
      target: { value: "PLN UP3 Medan" },
    });
    fireEvent.change(screen.getByLabelText("Keterangan"), {
      target: { value: "Tagihan listrik" },
    });
  };

  test("form baru tidak memilih salah satu, dan BapelField belum dirender", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    const choices = screen.getAllByRole("radio");

    expect(choices.map((node) => (node as HTMLInputElement).checked)).toEqual([
      false,
      false,
    ]);
    expect(screen.queryByLabelText("Badan pelayanan")).toBeNull();
    expect(screen.queryByText("Tanpa badan pelayanan")).toBeNull();
  });

  test("Simpan ditolak selama belum dijawab, dan server tidak ditembak", async () => {
    const sent = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    onFillRequired();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Jawab dulu: untuk badan pelayanan, atau bukan"),
    ).toBeTruthy();
    expect(sent).toEqual([]);
  });

  test("Untuk komisi memunculkan BapelField, dan menuntutnya di field itu", async () => {
    const sent = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    onFillRequired();

    fireEvent.click(
      screen.getByRole("radio", { name: "Untuk badan pelayanan" }),
    );

    expect(await screen.findByLabelText("Badan pelayanan")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Pilih badan pelayanan")).toBeTruthy();
    expect(sent).toEqual([]);
  });

  test("Bukan belanja komisi tidak merender BapelField sama sekali", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(
      screen.getByRole("radio", { name: "Bukan belanja badan pelayanan" }),
    );

    expect(screen.queryByLabelText("Badan pelayanan")).toBeNull();
    expect(
      screen.queryByRole("combobox", { name: "Badan pelayanan" }),
    ).toBeNull();
  });

  test("berganti jawaban tidak menyangkutkan komisi di payload", async () => {
    const sent = onMockApi(
      expenseDetail({
        bapelId: 3,
        bapel: { code: "BPL-0003", name: "Komisi Pemuda" },
        bapelChoice: "KOMISI",
      }),
    );
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Badan pelayanan");
    fireEvent.click(
      screen.getByRole("radio", { name: "Bukan belanja badan pelayanan" }),
    );

    expect(screen.queryByLabelText("Badan pelayanan")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(sent).toHaveLength(1));

    expect(sent[0]!.get("bapelChoice")).toBe("BUKAN_KOMISI");
    expect(sent[0]!.get("bapelId")).toBeNull();
  });

  test("baris lama membuka form ubah dengan kolom jawaban KOSONG", async () => {
    onMockApi(expenseDetail({ bapelId: null, bapel: null, bapelChoice: null }));
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    const choices = screen.getAllByRole("radio") as HTMLInputElement[];

    expect(choices.map((node) => node.checked)).toEqual([false, false]);
    expect(screen.queryByLabelText("Badan pelayanan")).toBeNull();
  });

  test("baris baru membuka form ubah dengan jawabannya terbaca", async () => {
    onMockApi(expenseDetail({ bapelId: null, bapel: null }));
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    const choices = screen.getAllByRole("radio") as HTMLInputElement[];

    expect(choices.map((node) => node.checked)).toEqual([false, true]);
  });

  test("pilihan komisi memakai BapelField bersama, bukan ddl lokal", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(
      screen.getByRole("radio", { name: "Untuk badan pelayanan" }),
    );
    fireEvent.click(
      await screen.findByRole("combobox", { name: "Badan pelayanan" }),
    );

    expect(await screen.findByText("Komisi Pemuda")).toBeTruthy();
    expect(screen.queryByText("Tanpa badan pelayanan")).toBeNull();
  });
});

const GATE_ROW = (state: string, waiver: unknown = null) => [
  { bapelId: 2, state, report: null, waiver },
];

describe("spanduk gerbang di form", () => {
  const onPickKomisi = async () => {
    fireEvent.click(
      screen.getByRole("radio", { name: "Untuk badan pelayanan" }),
    );
    fireEvent.click(
      await screen.findByRole("combobox", { name: "Badan pelayanan" }),
    );
    fireEvent.click(await screen.findByRole("option", { name: /Komisi Anak/ }));
  };

  test("form kosong tidak memperingatkan apa pun", async () => {
    compliance.current = GATE_ROW("MISSING");
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);

    await screen.findByLabelText("Dibayarkan kepada");
    expect(container.textContent).not.toContain("Laporan pemakaian budget");
  });

  test("Bukan belanja komisi: pengeluaran gereja biasa tidak tersentuh", async () => {
    compliance.current = GATE_ROW("MISSING");
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(
      screen.getByRole("radio", { name: "Bukan belanja badan pelayanan" }),
    );

    await screen.findByLabelText("Dibayarkan kepada");
    expect(container.textContent).not.toContain("Laporan pemakaian budget");
  });

  test("laporan M-1 belum ada: spanduk + tautan membuat laporannya", async () => {
    compliance.current = GATE_ROW("MISSING");
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    expect(await screen.findByText(/belum dibuat\./)).toBeTruthy();
    const link = screen.getByRole("link", { name: "Buat laporannya" });
    expect(link.getAttribute("href")).toContain("komisi=2");
    expect(link.getAttribute("href")).toContain("/report/budget-realization");
  });

  test("laporan M-1 masih draf: spanduk + tautan melihatnya", async () => {
    compliance.current = GATE_ROW("DRAFT");
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    expect(await screen.findByText(/masih draf\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Lihat laporannya" })).toBeTruthy();
  });

  test("Simpan TETAP aktif saat spanduk tampil — FE tidak memblokir sendiri", async () => {
    compliance.current = GATE_ROW("DRAFT");
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    await screen.findByText(/masih draf\./);
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  test("laporan M-1 APPROVED: tanpa spanduk", async () => {
    compliance.current = GATE_ROW("APPROVED");
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    await screen.findByLabelText("Badan pelayanan");
    expect(container.textContent).not.toContain("Laporan pemakaian budget");
  });

  test("nol pencairan di M-1: tanpa spanduk, bukan peringatan palsu", async () => {
    compliance.current = GATE_ROW("NOT_DUE");
    onMockApi();
    const { container } = onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    await screen.findByLabelText("Badan pelayanan");
    expect(container.textContent).not.toContain("Laporan pemakaian budget");
  });

  test("dibebaskan: nada info, alasannya PENUH", async () => {
    const reason = "B".repeat(250);
    compliance.current = GATE_ROW("WAIVED", {
      reason,
      createdBy: { name: "Ibu Mariani" },
      createdAt: "2026-09-02T03:00:00.000Z",
    });
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    expect(await screen.findByText(/dibebaskan oleh Ibu Mariani/)).toBeTruthy();

    // Penuh, dan di elemen yang MEMBUNGKUS. Paragraf `message` milik FormAlert
    // tidak punya aturan pembungkus, dan satu alasan 250 karakter tanpa spasi
    // melebarkan halaman 390 menjadi ~2000px lewat sana (diukur di peramban:
    // client 300, scroll 1953). Ditemukan di peramban, dijaga di sini.
    // Hanya ejaan yang benar-benar MENGHASILKAN ATURAN di Tailwind v4:
    // `wrap-break-word` dan `break-all`. `break-words` adalah nama v3 yang di
    // v4 tidak menerbitkan aturan apa pun — menerimanya berarti meloloskan
    // komponen yang mengira membungkus padahal meluber. Diperiksa di CSS hasil
    // build, bukan dengan menghitung kemunculannya di sumber.
    const line = screen.getByText(`Alasan: ${reason}`);

    expect(line.className).toMatch(/wrap-break-word|break-all/);
  });

  test("spanduk dan tautannya terpisah: spanduk tidak bergantung pada izin", async () => {
    compliance.current = GATE_ROW("DRAFT");
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await onPickKomisi();

    // `useMenuAccess` di berkas ini mengabaikan slug-nya, jadi gerbang izin
    // tautan LPJ diuji di `detail/screen.test.tsx` yang memakai peta per-slug.
    // Yang dijaga di sini: spanduknya sendiri, dan bahwa ia bukan galat form.
    expect(await screen.findByText(/masih draf\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Lihat laporannya" })).toBeTruthy();
  });
});

/**
 * Spanduk sisa pagu.
 *
 * Draf setiap test di bawah memakai `expenseDetail()`, yang satu barisnya
 * bernilai 3.200.000 — jadi angka itulah yang harus ikut dihitung. Kalau
 * `amounts` tersambung ke field yang salah, draf terbaca 0 dan setiap kasus
 * pelampauan di bawah ini berhenti muncul.
 */
describe("spanduk sisa pagu di form", () => {
  const PAGU = (ceiling: string | null, disbursed: string) => ({
    budgetYear: { year: 2026, label: "2026" },
    usage: { ceiling, disbursed },
  });

  const onPickKomisi = async () => {
    fireEvent.click(
      screen.getByRole("radio", { name: "Untuk badan pelayanan" }),
    );
    fireEvent.click(
      await screen.findByRole("combobox", { name: "Badan pelayanan" }),
    );
    fireEvent.click(await screen.findByRole("option", { name: /Komisi Anak/ }));
  };

  // 3.000.000 terpakai + 3.200.000 draf = 6.200.000 atas pagu 5.000.000.
  // Tanpa draf, 3.000.000 masih di bawah pagu dan tidak ada spanduk sama
  // sekali — itu yang membuat test ini membuktikan `amounts` tersambung.
  test("melampaui pagu: spanduk menyebut selisihnya", async () => {
    ceiling.current = PAGU("5000000", "3000000");
    onMockApi(expenseDetail());
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    expect(await screen.findByText(/melampaui pagu/)).toBeTruthy();
    expect(await screen.findByText(/Rp 1\.200\.000/)).toBeTruthy();
  });

  test("masih di dalam pagu: tidak ada spanduk", async () => {
    ceiling.current = PAGU("10000000", "3000000");
    onMockApi(expenseDetail());
    const { container } = onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    await screen.findByRole("combobox", { name: "Badan pelayanan" });
    expect(container.textContent).not.toContain("melampaui pagu");
  });

  // Tepat di pagu BUKAN pelampauan, sama seperti `withinCeiling` di server
  // yang memakai `lessThanOrEqualTo`. Dua jawaban atas satu pertanyaan adalah
  // yang dihindari di sini: layar hanya memperingatkan, jadi layar yang
  // berbeda pendapat akan memperingatkan sesuatu yang tidak terjadi.
  test("tepat di pagu bukan pelampauan", async () => {
    ceiling.current = PAGU("6200000", "3000000");
    onMockApi(expenseDetail());
    const { container } = onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    await screen.findByRole("combobox", { name: "Badan pelayanan" });
    expect(container.textContent).not.toContain("melampaui pagu");
  });

  // Dua null tidak boleh diruntuhkan. "Tidak terlihat" bukan "belum
  // ditetapkan" — disuruh yang kedua, komisi akan meminta Majelis menetapkan
  // pagu yang sebenarnya sudah ada.
  test("pagu tidak terlihat: bukan dibilang belum ditetapkan", async () => {
    ceiling.current = {
      budgetYear: { year: 2026, label: "2026" },
      usage: null,
    };
    onMockApi(expenseDetail());
    const { container } = onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    expect(
      await screen.findByText(/tidak terlihat untuk peran Anda/),
    ).toBeTruthy();
    expect(container.textContent).not.toContain("belum menetapkan pagu");
  });

  test("pagu belum ditetapkan: dikatakan apa adanya", async () => {
    ceiling.current = PAGU(null, "0");
    onMockApi(expenseDetail());
    const { container } = onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    expect(await screen.findByText(/belum menetapkan pagu/)).toBeTruthy();
    expect(container.textContent).not.toContain(
      "tidak terlihat untuk peran Anda",
    );
  });

  test("Simpan TETAP aktif saat pagu terlampaui — gereja memilih peringatan", async () => {
    ceiling.current = PAGU("5000000", "3000000");
    onMockApi(expenseDetail());
    onRenderForm(["VIEW", "UPDATE"], "doc-7");

    await screen.findByLabelText("Dibayarkan kepada");
    await onPickKomisi();

    await screen.findByText(/melampaui pagu/);
    expect(
      screen
        .getAllByRole("button", { name: "Simpan" })
        .every((button) => !(button as HTMLButtonElement).disabled),
    ).toBe(true);
  });
});
