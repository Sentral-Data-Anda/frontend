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

import type { MenuAction } from "@/types/menu";

import type { JournalEntryDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: (href: string) => replaced.push(href),
  }),
  usePathname: () => "/finance/journal-entry/baru",
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

const { JournalFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DDL = [
  { id: 2, code: "1-100", name: "Kas", type: "ASSET", isActive: true },
  { id: 14, code: "3-100", name: "Saldo Awal", type: "EQUITY", isActive: true },
];

const DRAFT: JournalEntryDetail = {
  id: "jrn-1",
  publicId: "jrn-1",
  code: "JRN-2026-0001",
  entryDate: "2026-01-05T00:00:00.000Z",
  description: "Biaya listrik",
  status: "DRAFT",
  sourceType: "MANUAL",
  source: { type: "MANUAL", id: null },
  reversalOfId: null,
  isReversal: false,
  fiscalPeriod: { year: 2026, month: 1, status: "OPEN" },
  postedBy: null,
  postedAt: null,
  reversalOf: null,
  reversedBy: null,
  lines: [
    {
      id: "jln-1",
      publicId: "jln-1",
      accountId: 2,
      account: { id: 2, code: "1-100", name: "Kas", type: "ASSET" },
      debit: "500000",
      credit: "0",
      description: null,
    },
    {
      id: "jln-2",
      publicId: "jln-2",
      accountId: 14,
      account: { id: 14, code: "3-100", name: "Saldo Awal", type: "EQUITY" },
      debit: "0",
      credit: "450000",
      description: null,
    },
  ],
};

const onMockApi = (entry: JournalEntryDetail | null = null) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    calls.push({
      method,
      url,
      ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
    });

    if (url.startsWith("/api/v1/ddl/account")) {
      return Response.json({
        status: 200,
        totalData: DDL.length,
        totalPage: 1,
        data: DDL,
      });
    }

    if (method === "GET") {
      return entry
        ? Response.json({ status: 200, message: "OK", data: entry })
        : Response.json(
            { status: 404, error: "Jurnal Tidak Ditemukan" },
            { status: 404 },
          );
    }

    return Response.json(
      { status: 201, message: "Berhasil Menambahkan Jurnal", data: DRAFT },
      { status: 201 },
    );
  }) as typeof fetch;

  return calls;
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
        <JournalFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("JournalFormScreen", () => {
  test("form baru membuka dua baris kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(screen.getByLabelText(/Akun baris 1/)).toBeTruthy(),
    );

    expect(screen.getByLabelText(/Akun baris 2/)).toBeTruthy();
    expect(screen.queryByLabelText(/Akun baris 3/)).toBeNull();
  });

  test("simpan draf tetap aktif meski debit dan kredit tidak seimbang", async () => {
    onMockApi(DRAFT);
    onRenderForm(["VIEW", "UPDATE"], "jrn-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Keterangan") as HTMLInputElement).value,
      ).toBe("Biaya listrik"),
    );

    expect(screen.getByText(/Kredit kurang/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Simpan draf" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  test("tanpa izin create, form tidak dirender", async () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("Tidak bisa menambah entri jurnal")).toBeTruthy(),
    );
  });

  test("draf yang sudah diposting tidak bisa dibuka di form ubah", async () => {
    onMockApi({ ...DRAFT, status: "POSTED" });
    onRenderForm(["VIEW", "UPDATE"], "jrn-1");

    await waitFor(() =>
      expect(screen.getByText("Entri ini tidak bisa diubah")).toBeTruthy(),
    );
  });

  test("mengisi Debit mengosongkan Kredit di baris yang sama", async () => {
    onMockApi(DRAFT);
    onRenderForm(["VIEW", "UPDATE"], "jrn-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText(/Kredit baris 2/) as HTMLInputElement).value,
      ).not.toBe(""),
    );

    fireEvent.change(screen.getByLabelText(/Debit baris 2/), {
      target: { value: "450000" },
    });

    await waitFor(() =>
      expect(
        (screen.getByLabelText(/Kredit baris 2/) as HTMLInputElement).value,
      ).toBe(""),
    );
  });
});
