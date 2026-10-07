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

import { addDays, toInputText, todayJakarta } from "@/lib/date";
import type { BudgetSetting } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { ProgramApproval, ProgramDetail } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/anggaran/program/baru",
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

const { ProgramFormScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
});

const YEAR = 2026;

const ALL = ["VIEW", "CREATE", "UPDATE", "DELETE"] as MenuAction[];

const budgetYear = (year: number) => ({
  year,
  startMonth: 7,
  from: `${year}-07-01`,
  to: `${year + 1}-06-30`,
  label: `${year}/${year + 1} label server`,
});

const SETTING: BudgetSetting = {
  startMonth: 7,
  budgetYear: budgetYear(YEAR),
  budgetYears: [budgetYear(YEAR - 1), budgetYear(YEAR), budgetYear(YEAR + 1)],
};

const approval = (next: Partial<ProgramApproval> = {}): ProgramApproval => ({
  publicId: "apr-1",
  code: "APR-2026-0001",
  status: "PENDING",
  currentOrder: 1,
  amount: "3000000",
  isSubmittedByViewer: true,
  steps: [],
  ...next,
});

const DETAIL: ProgramDetail = {
  publicId: "prg-0001",
  code: `PRG-${YEAR}-0001`,
  name: "Bakti Sosial Pemuda",
  year: YEAR,
  budgetYear: budgetYear(YEAR),
  status: "DRAFT",
  isUnplanned: false,
  startDate: null,
  endDate: null,
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  proposedAmount: "3000000",
  approval: null,
  bapelId: 2,
  description: null,
  items: [
    {
      publicId: "pbi-1",
      accountId: 23,
      account: { code: "5-110", name: "Beban Administrasi" },
      description: "Paket sembako",
      quantity: "2",
      unitPrice: "1500000",
      amount: "3000000",
      note: null,
    },
  ],
  ceiling: {
    year: YEAR,
    ceiling: "45000000",
    committed: "45000000",
    remaining: "0",
    isWithinCeiling: true,
    disbursed: "0",
    reported: "0",
    untagged: "0",
  },
  reportedUsage: { parts: [], total: "0", untagged: "0" },
  approvedBy: null,
  approvedAt: null,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
};

const onMockApi = (detail: ProgramDetail | null) => {
  const calls: { url: string; method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    if (url.startsWith("/api/v1/setelan-anggaran")) {
      return Response.json({ status: 200, message: "ok", data: SETTING });
    }

    if (url.startsWith("/api/v1/ddl/bapel")) {
      return Response.json({
        status: 200,
        data: [{ id: 2, code: "BPL-2", name: "Komisi Pemuda" }],
      });
    }

    if (url.startsWith("/api/v1/ddl/account")) {
      return Response.json({
        status: 200,
        data: [
          {
            id: 23,
            code: "5-110",
            name: "Beban Administrasi",
            type: "EXPENSE",
          },
        ],
      });
    }

    if (method === "POST" && url === "/api/v1/program") {
      return Response.json(
        {
          status: 201,
          message: "Berhasil Menambahkan Program",
          data: DETAIL,
        },
        { status: 201 },
      );
    }

    if (url.startsWith("/api/v1/program/")) {
      return detail
        ? Response.json({ status: 200, message: "ok", data: detail })
        : Response.json(
            { status: 404, error: "Program Tidak Ditemukan" },
            { status: 404 },
          );
    }

    return Response.json({ status: 200, data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (
  publicId?: string,
  detail: ProgramDetail | null = DETAIL,
  granted: Record<string, MenuAction[]> = { PROGRAM: ALL },
) => {
  actions.current = granted;
  const calls = onMockApi(detail);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ProgramFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const onType = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("form program", () => {
  test("galat muncul saat Simpan, dan rincian minimal satu baris", async () => {
    onRender();

    fireEvent.click(await screen.findByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Isi nama program")).toBeTruthy();
    expect(screen.getAllByText("Pilih badan pelayanan").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Pilih pos").length).toBeGreaterThan(0);
    expect(screen.getByText("Isi uraian")).toBeTruthy();
  });

  test("form dibuka dengan satu baris rincian, bukan nol", async () => {
    onRender();

    expect(
      await screen.findByRole("button", { name: "Hapus baris 1" }),
    ).toBeTruthy();
  });

  test("subtotal dan total dihitung saat render", async () => {
    onRender();

    onType("Jumlah baris 1", "2");
    onType("Harga satuan (Rp) baris 1", "1500000");

    await waitFor(() =>
      expect(screen.getByLabelText("Subtotal baris 1").textContent).toBe(
        "Rp 3.000.000",
      ),
    );
    expect(screen.getByText("Total usulan Rp 3.000.000")).toBeTruthy();
  });

  test("payload tanpa proposedAmount, tanpa amount per baris, tanpa status", async () => {
    const calls = onRender();

    fireEvent.click(
      await screen.findByRole("combobox", { name: "Badan pelayanan" }),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: /Komisi Pemuda/ }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Badan pelayanan" }).textContent,
      ).toContain("Komisi Pemuda"),
    );

    fireEvent.click(screen.getByRole("combobox", { name: /^Pos baris 1/ }));
    fireEvent.click(
      await screen.findByRole("option", { name: /Beban Administrasi/ }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: /^Pos baris 1/ }).textContent,
      ).toContain("Beban Administrasi"),
    );

    onType("Nama program", "Bakti Sosial Pemuda");
    onType("Uraian baris 1", "Paket sembako");
    onType("Jumlah baris 1", "2");
    onType("Harga satuan (Rp) baris 1", "1500000");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => {
      const posted = calls.find(
        (call) => call.method === "POST" && call.url === "/api/v1/program",
      );

      expect(posted).toBeTruthy();

      const body = posted!.body as Record<string, unknown>;

      expect(Object.keys(body)).not.toContain("proposedAmount");
      expect(Object.keys(body)).not.toContain("status");
      expect(body.isUnplanned).toBe(false);

      const items = body.items as Record<string, unknown>[];

      expect(Object.keys(items[0]!)).not.toContain("amount");
    });
  });

  test("tahun bawaan diambil dari server dengan labelnya apa adanya", async () => {
    onRender();

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Tahun pelayanan" }).textContent,
      ).toBe(`${YEAR}/${YEAR + 1} label server`),
    );
  });

  test("ubah diblokir saat ada permintaan terbuka", async () => {
    onRender("prg-0001", { ...DETAIL, approval: approval() });

    expect(
      await screen.findByText("Usulan ini tidak bisa diubah"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
  });

  test("ubah diblokir saat usulan sudah disetujui", async () => {
    onRender("prg-0001", { ...DETAIL, status: "APPROVED" });

    expect(
      await screen.findByText("Usulan ini tidak bisa diubah"),
    ).toBeTruthy();
  });

  test("tanpa CREATE layar merender keadaan tidak bisa menambah", async () => {
    onRender(undefined, DETAIL, { PROGRAM: ["VIEW"] });

    expect(await screen.findByText("Tidak bisa menambah program")).toBeTruthy();
  });

  test("ubah memuat rincian yang tersimpan", async () => {
    onRender("prg-0001");

    await waitFor(() =>
      expect(
        screen.getByLabelText("Uraian baris 1").getAttribute("value"),
      ).toBe("Paket sembako"),
    );
  });

  test("usulan yang tidak ditemukan tidak menyatakan cakupan", async () => {
    onRender("prg-9999", null);

    await waitFor(() =>
      expect(screen.queryByText(/tidak ditemukan/i)).toBeTruthy(),
    );

    expect(screen.queryByText(/tidak punya akses ke program ini/i)).toBeNull();
  });
});

describe("tanggal program boleh di masa depan", () => {
  test.each([/^Tanggal mulai/, /^Tanggal selesai/])(
    "%s di masa depan diterima",
    async (label) => {
      onRender();
      await screen.findByRole("button", { name: "Simpan" });

      const box = screen.getByLabelText(label) as HTMLInputElement;

      onType(label, toInputText(addDays(todayJakarta(), 90)));
      fireEvent.blur(box);

      expect(
        screen.queryByText(/tidak boleh di masa depan/)?.textContent,
      ).toBeUndefined();
      expect(box.getAttribute("aria-invalid")).toBeNull();
    },
  );
});
