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

import { monthOptions, todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { PostingResult } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/finance/payment/posting-pembayaran",
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

const { PostingPembayaranScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  actions.current = {};
});

const CLEAN: PostingResult = { posted: 2, skipped: 1, refused: [] };

const REFUSED: PostingResult = {
  posted: 1,
  skipped: 0,
  refused: [
    {
      code: "PAY-2026-0004",
      reason: "Setelan Akuntansi PENDAPATAN_EVENT Belum Diisi",
      reasonCode: "SETTING_EMPTY",
    },
    {
      code: "PAY-2026-0005",
      reason: "Periode Fiskal September 2026 Sudah Ditutup",
      reasonCode: "PERIOD_CLOSED",
    },
    {
      code: "PAY-2026-0006",
      reason: "Alasan baru yang belum dikenal klien",
      reasonCode: "SOMETHING_NEW",
    },
  ],
};

const ALL_REFUSED: PostingResult = {
  posted: 0,
  skipped: 0,
  refused: [REFUSED.refused[0]],
};

const onMockApi = (result: PostingResult) => {
  const calls: { url: string; body: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const isDryRun = url.includes("dryRun=1");

    calls.push({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    return Response.json(
      {
        status: isDryRun ? 200 : 201,
        message: isDryRun ? "Berhasil Memeriksa" : "Berhasil Memposting",
        data: result,
      },
      { status: isDryRun ? 200 : 201 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderPosting = (
  granted: Record<string, MenuAction[]>,
  result: PostingResult = CLEAN,
) => {
  actions.current = granted;

  const calls = onMockApi(result);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PostingPembayaranScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const postButton = () =>
  screen.getByRole("button", { name: "Posting" }) as HTMLButtonElement;

const onPreview = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Lihat pratinjau/ }));
  await waitFor(() => expect(postButton().disabled).toBe(false));
};

const FULL = { JOURNAL_ENTRY: ["VIEW", "CREATE"] as MenuAction[] };

describe("PostingPembayaranScreen", () => {
  test("gerbangnya JOURNAL_ENTRY CREATE, bukan PAYMENT", () => {
    onRenderPosting({ PAYMENT: ["VIEW", "CREATE"], JOURNAL_ENTRY: ["VIEW"] });

    expect(screen.getByText("Tidak bisa memposting pembayaran")).toBeTruthy();
    expect(screen.getByText(/izinnya adalah izin membuat jurnal/)).toBeTruthy();
  });

  test("tanpa akses jurnal sama sekali, alasannya berbeda", () => {
    onRenderPosting({ PAYMENT: ["VIEW"] });

    expect(
      screen.getByText("Peran Anda tidak memiliki akses ke Pembayaran."),
    ).toBeTruthy();
  });

  test("tombol posting mati sebelum pratinjau, dengan alasannya tertulis", () => {
    onRenderPosting(FULL);

    expect(postButton().disabled).toBe(true);
    expect(
      screen.getAllByText(/Jalankan pratinjau dulu/).length,
    ).toBeGreaterThan(0);
  });

  test("pratinjau mengirim dryRun=1 dan tidak menulis apa pun", async () => {
    const calls = onRenderPosting(FULL);

    await onPreview();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("dryRun=1");
    expect(calls[0].url).toContain("/jurnal/posting-pembayaran");
  });

  test("tiga angka pratinjau terbaca, dan dilewati bukan galat", async () => {
    onRenderPosting(FULL);
    await onPreview();

    expect(screen.getByText("Akan diposting")).toBeTruthy();
    expect(screen.getByText("Dilewati")).toBeTruthy();
    expect(
      screen.getByText(/sudah pernah diposting — bukan galat/),
    ).toBeTruthy();
    expect(screen.getByText("tidak ada yang ditolak")).toBeTruthy();
  });

  test("pratinjau yang menolak semuanya tetap mematikan posting, dengan alasannya", async () => {
    onRenderPosting(FULL, ALL_REFUSED);

    fireEvent.click(screen.getByRole("button", { name: /Lihat pratinjau/ }));
    await screen.findByRole("region", { name: "Pratinjau posting" });

    expect(postButton().disabled).toBe(true);
    expect(
      screen.getAllByText(/Tidak ada pembayaran yang bisa diposting/).length,
    ).toBeGreaterThan(0);
  });

  test("mengubah rentang mengosongkan pratinjau dan mematikan posting lagi", async () => {
    onRenderPosting(FULL);
    await onPreview();

    const options = monthOptions();
    const current = options.findIndex(
      (option) => option.value === todayJakarta().slice(0, 7),
    );
    const next = options[current + 1];
    const trigger = screen.getByLabelText("Bulan pembayaran");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await screen.findByRole("option", { name: next.label });
    fireEvent.keyDown(document.activeElement ?? trigger, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement ?? trigger, { key: "Enter" });

    await waitFor(() => expect(trigger.textContent).toContain(next.label));
    expect(postButton().disabled).toBe(true);
    expect(screen.queryByText("Akan diposting")).toBeNull();
  });

  test("alasan penolakan dirender dengan tautan perbaikannya, per kode", async () => {
    onRenderPosting(
      { ...FULL, ACCOUNTING_SETTING: ["VIEW"], FISCAL_PERIOD: ["VIEW"] },
      REFUSED,
    );
    await onPreview();

    expect(
      screen
        .getAllByRole("link", { name: "Buka Setelan Akuntansi" })[0]
        .getAttribute("href"),
    ).toBe("/finance/accounting-setting");
    expect(
      screen
        .getAllByRole("link", { name: "Buka Periode Fiskal" })[0]
        .getAttribute("href"),
    ).toBe("/finance/fiscal-period");
  });

  test("kode yang tidak dikenali menampilkan pesan server tanpa menebak tautan", async () => {
    onRenderPosting(
      { ...FULL, ACCOUNTING_SETTING: ["VIEW"], CHART_OF_ACCOUNT: ["VIEW"] },
      REFUSED,
    );
    await onPreview();

    expect(
      screen.getAllByText("Alasan baru yang belum dikenal klien").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Buka Akun/ })).toBeNull();
  });

  test("posting sungguhan berjalan sesudah konfirmasi, lalu pratinjau diminta ulang", async () => {
    const calls = onRenderPosting(FULL);

    await onPreview();
    fireEvent.click(postButton());

    await waitFor(() =>
      expect(screen.getByText(/akan membukukan/)).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(2));

    expect(calls[1].url).not.toContain("dryRun");
    await waitFor(() => expect(postButton().disabled).toBe(true));
  });
});
