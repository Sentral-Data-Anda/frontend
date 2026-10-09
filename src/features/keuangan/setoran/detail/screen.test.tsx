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

import type { Transfer } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const journalActions: { current: MenuAction[] } = { current: ["VIEW"] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/bank-deposit/STR-2026-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted =
      slug === "JOURNAL_ENTRY" ? journalActions.current : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { TransferDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  journalActions.current = ["VIEW"];
});

const KAS = { id: 2, code: "1-100", name: "Kas", type: "ASSET" as const };
const BANK = { id: 4, code: "1-200", name: "Bank BCA", type: "ASSET" as const };

const DRAFT: Transfer = {
  id: 1,
  publicId: "str-0001",
  code: "STR-2026-0001",
  transferDate: "2026-09-28T00:00:00.000Z",
  fromAccountId: KAS.id,
  toAccountId: BANK.id,
  fromAccount: KAS,
  toAccount: BANK,
  amount: "6420000",
  description: "Setoran kolekte Minggu",
  reference: "SLIP-0098",
  bapel: null,
  status: "DRAFT",
  method: null,
  journal: null,
};

const PAID: Transfer = {
  ...DRAFT,
  status: "PAID",
  journal: { publicId: "jrn-0007", code: "JRN-2026-0007", status: "POSTED" },
};

const CANCELLED: Transfer = {
  ...DRAFT,
  status: "CANCELLED",
  journal: { publicId: "jrn-0007", code: "JRN-2026-0007", status: "REVERSED" },
};

type Call = { method: string; url: string; body?: unknown };

const onMockApi = (
  transfer: Transfer,
  failure?: { status: number; error: string; code?: string },
) => {
  const calls: Call[] = [];
  const current = { row: transfer };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";

    calls.push({
      method,
      url: String(input),
      ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
    });

    if (method === "GET") {
      return Response.json({ status: 200, message: "OK", data: current.row });
    }

    if (failure) return Response.json(failure, { status: failure.status });

    current.row = String(input).endsWith("/setor")
      ? { ...current.row, status: "PAID", journal: PAID.journal }
      : { ...current.row, status: "CANCELLED" };

    return Response.json({
      status: 200,
      message: "Berhasil Menyetor Setoran",
      data: current.row,
    });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <TransferDetailScreen code="STR-2026-0001" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("ringkasan", () => {
  test("arah dirender sebagai panah di judul dan ringkasan", async () => {
    onMockApi(DRAFT);
    onRender(["VIEW"]);

    expect(
      await screen.findByRole("heading", { name: "Kas → Bank BCA" }),
    ).toBeTruthy();
    expect(screen.getByText("1-100", { exact: false })).toBeTruthy();
    expect(screen.getByText("Rp 6.420.000")).toBeTruthy();
    expect(screen.getByText("SLIP-0098")).toBeTruthy();
  });

  test("tanpa kata Debit atau Kredit", async () => {
    onMockApi(PAID);
    onRender(["VIEW", "CREATE", "DELETE"]);

    await screen.findByRole("heading", { name: "Kas → Bank BCA" });
    expect(document.body.textContent).not.toMatch(/debit|kredit/i);
  });

  test("entri jurnal tertaut sesudah disetor", async () => {
    onMockApi(PAID);
    onRender(["VIEW"]);

    const link = await screen.findByRole("link", { name: "JRN-2026-0007" });

    expect(link.getAttribute("href")).toBe("/finance/journal-entry/jrn-0007");
  });

  test("tanpa akses Jurnal kodenya tampil tanpa tautan", async () => {
    journalActions.current = [];
    onMockApi(PAID);
    onRender(["VIEW"]);

    expect(await screen.findByText("JRN-2026-0007")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "JRN-2026-0007" })).toBeNull();
  });
});

describe("aksi status", () => {
  test("draf: Setor ada, Batalkan tidak", async () => {
    onMockApi(DRAFT);
    onRender(["VIEW", "CREATE", "DELETE"]);

    expect(await screen.findByRole("button", { name: "Setor" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Batalkan" })).toBeNull();
    expect(screen.queryByLabelText("Alasan pembatalan")).toBeNull();
  });

  test("setor lewat konfirmasi bersama, PUT /setor", async () => {
    const calls = onMockApi(DRAFT);
    onRender(["VIEW", "CREATE"]);

    fireEvent.click(await screen.findByRole("button", { name: "Setor" }));
    expect(
      await screen.findByText(/Pemindahan dicatat dan pembukuannya dibuat/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(calls.some((call) => call.method === "PUT")).toBe(true),
    );
    expect(calls.find((call) => call.method === "PUT")?.url).toBe(
      "/api/v1/setoran/STR-2026-0001/setor",
    );
  });

  test("tanpa CREATE: Setor tidak dirender", async () => {
    onMockApi(DRAFT);
    onRender(["VIEW"]);

    await screen.findByRole("heading", { name: "Kas → Bank BCA" });
    expect(screen.queryByRole("button", { name: "Setor" })).toBeNull();
  });

  test("batalkan tanpa alasan: dialog tidak muncul, fieldnya bergalat", async () => {
    const calls = onMockApi(PAID);
    onRender(["VIEW", "DELETE"]);

    fireEvent.click(await screen.findByRole("button", { name: "Batalkan" }));

    expect(await screen.findByText("Isi alasan pembatalan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
    expect(calls.every((call) => call.method === "GET")).toBe(true);
  });

  test("batalkan dengan alasan mengirim alasannya", async () => {
    const calls = onMockApi(PAID);
    onRender(["VIEW", "DELETE"]);

    fireEvent.change(await screen.findByLabelText("Alasan pembatalan"), {
      target: { value: "  Uangnya belum disetor  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(calls.some((call) => call.method === "PUT")).toBe(true),
    );
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({
      reason: "Uangnya belum disetor",
    });
  });

  test("dibatalkan: peringatan, tanpa aksi apa pun", async () => {
    onMockApi(CANCELLED);
    onRender(["VIEW", "CREATE", "DELETE"]);

    expect(await screen.findByText("Setoran dibatalkan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Setor" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Batalkan" })).toBeNull();
  });

  test("setor ditolak periode tertutup: tautan ke Periode Fiskal", async () => {
    onMockApi(DRAFT, {
      status: 400,
      error: "Periode Fiskal Agustus 2026 Sudah Ditutup",
      code: "PERIOD_CLOSED",
    });
    onRender(["VIEW", "CREATE"]);

    fireEvent.click(await screen.findByRole("button", { name: "Setor" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Periode Fiskal Agustus 2026 Sudah Ditutup"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Buka Periode Fiskal" })
        .getAttribute("href"),
    ).toBe("/finance/fiscal-period");
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: tidak menembak server", () => {
    let isFetched = false;
    actions.current = [];
    globalThis.fetch = (async () => {
      isFetched = true;
      return Response.json({ status: 200, data: DRAFT });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Toast.Provider>
          <TransferDetailScreen code="STR-2026-0001" />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Bank Deposit"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});
