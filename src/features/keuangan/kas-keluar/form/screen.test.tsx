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
  usePathname: () => "/keuangan/kas-keluar/baru",
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

const onMockApi = (detail?: CashExpenseDetail) => {
  const sent: FormData[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

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
    expect(screen.queryByLabelText("Komisi")).toBeNull();
    expect(screen.queryByText("Tanpa badan pelayanan")).toBeNull();
  });

  test("Simpan ditolak selama belum dijawab, dan server tidak ditembak", async () => {
    const sent = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    onFillRequired();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Jawab dulu: untuk komisi, atau bukan"),
    ).toBeTruthy();
    expect(sent).toEqual([]);
  });

  test("Untuk komisi memunculkan BapelField, dan menuntutnya di field itu", async () => {
    const sent = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    onFillRequired();

    fireEvent.click(screen.getByRole("radio", { name: "Untuk komisi" }));

    expect(await screen.findByLabelText("Komisi")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Pilih komisi")).toBeTruthy();
    expect(sent).toEqual([]);
  });

  test("Bukan belanja komisi tidak merender BapelField sama sekali", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(
      screen.getByRole("radio", { name: "Bukan belanja komisi" }),
    );

    expect(screen.queryByLabelText("Komisi")).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Komisi" })).toBeNull();
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

    await screen.findByLabelText("Komisi");
    fireEvent.click(
      screen.getByRole("radio", { name: "Bukan belanja komisi" }),
    );

    expect(screen.queryByLabelText("Komisi")).toBeNull();

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
    expect(screen.queryByLabelText("Komisi")).toBeNull();
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

    fireEvent.click(screen.getByRole("radio", { name: "Untuk komisi" }));
    fireEvent.click(await screen.findByRole("combobox", { name: "Komisi" }));

    expect(await screen.findByText("Komisi Pemuda")).toBeTruthy();
    expect(screen.queryByText("Tanpa badan pelayanan")).toBeNull();
  });
});
