import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
import type { Persembahan } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/finance/persembahan",
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

const { PersembahanListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => {
  viewport.onRestore();
});

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  actions.current = {};
});

const rowOf = (extra: Partial<Persembahan> = {}): Persembahan => ({
  id: 1,
  publicId: "psb-0001",
  code: "PSB-2026-0001",
  typePersembahan: {
    id: 1,
    code: "TPS-0001",
    name: "Kolekte",
    hasPeriod: false,
  },
  jemaat: null,
  donorName: null,
  period: null,
  amount: "1250000",
  receiveMethod: "TUNAI",
  receivedDate: "2026-09-27T00:00:00.000Z",
  receivedBy: { name: "Debora Manurung" },
  ibadah: null,
  status: "ACTIVE",
  voidReason: null,
  voidedAt: null,
  voidedBy: null,
  reversalJournal: null,
  journal: null,
  ...extra,
});

const ROWS = [
  rowOf({
    journal: { publicId: "jrn-0002", code: "JRN-2026-0002", status: "POSTED" },
  }),
  rowOf({
    id: 2,
    publicId: "psb-0002",
    code: "PSB-2026-0002",
    amount: "500000",
    jemaat: { id: 1, code: "JMT-0001", name: "Andreas Sitanggang" },
    typePersembahan: {
      id: 2,
      code: "TPS-0002",
      name: "Perpuluhan",
      hasPeriod: false,
    },
    receiveMethod: "PAYMENT_GATEWAY",
  }),
  rowOf({
    id: 3,
    publicId: "psb-0003",
    code: "PSB-2026-0003",
    amount: "620000",
    status: "VOID",
    voidReason: "Terhitung dua kali.",
  }),
];

const onMockApi = () => {
  const urls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    urls.push(url);

    if (url.startsWith("/api/v1/ddl/")) {
      return Response.json(
        { status: 404, error: "Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({
      status: 200,
      message: "OK",
      totalData: ROWS.length,
      totalPage: 1,
      totalAmount: "1750000",
      data: ROWS,
    });
  }) as typeof fetch;

  return urls;
};

const onRender = (granted: Record<string, MenuAction[]>) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PersembahanListScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan", () => {
    const urls = onMockApi();
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Persembahan"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tanpa CREATE: tombol Catat Kolekte tidak dirender", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    await waitFor(() =>
      expect(screen.getAllByText(/3 persembahan/).length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("link", { name: "Catat Kolekte" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Catat satu persembahan" }),
    ).toBeNull();
  });

  test("dengan CREATE: Catat Kolekte utama dan catat satu di sebelahnya", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW", "CREATE"] });

    expect(
      screen.getByRole("link", { name: "Catat Kolekte" }).getAttribute("href"),
    ).toBe("/finance/persembahan/kolekte");
    expect(
      screen
        .getByRole("link", { name: "Catat satu persembahan" })
        .getAttribute("href"),
    ).toBe("/finance/persembahan/baru");
  });
});

describe("daftar", () => {
  test("bawaan 30 hari terakhir, bukan seluruh tabel", async () => {
    const urls = onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    await waitFor(() => expect(urls.length).toBeGreaterThan(0));

    const listUrl = urls.find((url) => url.includes("/api/v1/persembahan?"));

    expect(listUrl).toContain("startDate=");
    expect(listUrl).toContain("endDate=");
  });

  test("subjudul menyebut jumlah dan total saringan aktif", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(
      await screen.findByText("3 persembahan · Total Rp 1.750.000"),
    ).toBeTruthy();
  });

  test("kolom Jurnal: kode bertaut bila diposting, — bila belum", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"], JOURNAL_ENTRY: ["VIEW"] });

    expect(
      (await screen.findByRole("link", { name: "JRN-2026-0002" })).getAttribute(
        "href",
      ),
    ).toBe("/finance/journal-entry/jrn-0002");
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  test("tanpa JOURNAL_ENTRY VIEW: kode jurnal tampil tanpa tautan", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(await screen.findByText("JRN-2026-0002")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "JRN-2026-0002" })).toBeNull();
  });

  test("baris anonim tampil Anonim, bukan sel kosong", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect((await screen.findAllByText(/Anonim/)).length).toBeGreaterThan(0);
  });

  test("baris pembayaran online tetap tampil di daftar", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(await screen.findByText("Pembayaran online")).toBeTruthy();
  });
});
