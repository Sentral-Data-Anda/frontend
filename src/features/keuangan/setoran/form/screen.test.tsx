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

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/setoran/baru",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { TransferFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  query.current = "";
});

const DDL = [
  { id: 2, code: "1-100", name: "Kas", type: "ASSET", isActive: true },
  { id: 3, code: "1-110", name: "Kas Kecil", type: "ASSET", isActive: true },
  { id: 4, code: "1-200", name: "Bank BCA", type: "ASSET", isActive: true },
];

type Failure = {
  status: number;
  error: string;
  code?: string;
  issues?: { path: string; message: string }[];
};

type Call = { method: string; url: string; body?: unknown };

const onMockApi = (failure?: Failure, ddl = DDL) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    calls.push({
      method,
      url,
      ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
    });

    if (method === "GET") {
      return ddl.length === 0
        ? Response.json(
            { status: 404, error: "Akun Tidak Ditemukan" },
            { status: 404 },
          )
        : Response.json({
            status: 200,
            totalData: ddl.length,
            totalPage: 1,
            data: ddl,
          });
    }

    if (failure) return Response.json(failure, { status: failure.status });

    return Response.json(
      {
        status: 201,
        message: "Berhasil Mencatat Setoran",
        data: { code: "STR-2026-0004" },
      },
      { status: 201 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <TransferFormScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onFill = (amount: string, description: string) => {
  fireEvent.change(screen.getByLabelText("Jumlah (Rp)"), {
    target: { value: amount },
  });
  fireEvent.change(screen.getByLabelText("Keterangan"), {
    target: { value: description },
  });
};

const accountText = (label: string) =>
  screen.getByLabelText(label).textContent ?? "";

describe("pintasan", () => {
  test("'Setor ke bank' mengisi awal Dari akun dan membiarkan Ke akun kosong", async () => {
    query.current = "dari=kas";
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Dari akun")).toContain("Kas"));
    expect(accountText("Dari akun")).toContain("1-100");
    expect(accountText("Ke akun")).toContain("Pilih akun tujuan");
  });

  test("'Isi kas kecil' mengisi awal Ke akun saja", async () => {
    query.current = "ke=kas-kecil";
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Ke akun")).toContain("Kas Kecil"));
    expect(accountText("Dari akun")).toContain("Pilih akun asal");
  });

  test("pintasan yang tidak cocok akun apa pun: kosong tanpa galat", async () => {
    query.current = "dari=brankas";
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(screen.getByLabelText("Dari akun")).toBeTruthy(),
    );
    expect(accountText("Dari akun")).toContain("Pilih akun asal");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("simpan", () => {
  test("POST membawa dua akun, bapelId null, dan tanpa field jenis", async () => {
    query.current = "dari=kas&ke=bank-bca";
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Dari akun")).toContain("Kas"));
    onFill("6420000", "Setoran kolekte Minggu");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(replaced).toEqual(["/keuangan/setoran/STR-2026-0004"]),
    );
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      transferDate: todayJakarta(),
      fromAccountId: 2,
      toAccountId: 4,
      amount: "6420000",
      description: "Setoran kolekte Minggu",
      reference: null,
      bapelId: null,
    });
  });

  test("kedua akun sama ditolak di Ke akun, dialog tidak muncul", async () => {
    query.current = "dari=kas&ke=kas";
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Dari akun")).toContain("Kas"));
    onFill("6420000", "Setoran kolekte");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Akun tujuan harus berbeda dari akun asal"),
    ).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("akun bukan Aset ditolak server dan jatuh ke fieldnya", async () => {
    query.current = "dari=kas&ke=bank-bca";
    onMockApi({
      status: 400,
      error: "Akun Harus Bertipe Aset",
      issues: [{ path: "toAccountId", message: "Akun Harus Bertipe Aset" }],
    });
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Dari akun")).toContain("Kas"));
    onFill("6420000", "Setoran kolekte");
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Akun Harus Bertipe Aset")).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("periode tertutup: tautan ke Periode Fiskal, dipilih dari code", async () => {
    query.current = "dari=kas&ke=bank-bca";
    onMockApi({
      status: 400,
      error: "Periode Fiskal Agustus 2026 Sudah Ditutup",
      code: "PERIOD_CLOSED",
    });
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(accountText("Dari akun")).toContain("Kas"));
    onFill("6420000", "Setoran kolekte");
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Periode Fiskal Agustus 2026 Sudah Ditutup"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Buka Periode Fiskal" })
        .getAttribute("href"),
    ).toBe("/keuangan/periode-fiskal");
  });
});

describe("keadaan", () => {
  test("tanpa akun: layar menawarkan membuat akun dulu", async () => {
    onMockApi(undefined, []);
    onRenderForm(["VIEW", "CREATE"]);

    expect(
      await screen.findByText(/Belum ada akun kas atau bank/),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buat akun" })).toBeTruthy();
  });

  test("tanpa CREATE form tidak dirender", () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa mencatat setoran")).toBeTruthy();
    expect(screen.queryByLabelText("Jumlah (Rp)")).toBeNull();
  });

  test("tanpa kata Debit atau Kredit", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(screen.getByLabelText("Ke akun")).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/debit|kredit/i);
  });
});
