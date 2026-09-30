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

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import type { Payment } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/keuangan/pembayaran",
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

const { PaymentListScreen } = await import("./screen");

const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.startsWith("(min-width"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
});
afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  actions.current = {};
});

const rowOf = (extra: Partial<Payment> = {}): Payment => ({
  id: 1,
  publicId: "pay-0001",
  code: "PAY-2026-0001",
  purpose: "PERSEMBAHAN",
  amount: "500000",
  status: "PAID",
  method: "QRIS",
  paidAt: "2026-09-27T03:15:00.000Z",
  expiredAt: null,
  createdAt: "2026-09-26T03:15:00.000Z",
  jemaat: null,
  donorName: null,
  typePersembahan: null,
  period: null,
  persembahan: null,
  journal: null,
  ...extra,
});

const ROWS: Payment[] = [
  rowOf({ persembahan: { code: "PSB-2026-0021" } }),
  rowOf({
    id: 2,
    publicId: "pay-0002",
    code: "PAY-2026-0002",
    purpose: "EVENT_REGISTRATION",
    amount: "350000",
    jemaat: { publicId: "jmt-0007", code: "JMT-0007", name: "Gideon" },
  }),
  rowOf({
    id: 3,
    publicId: "pay-0003",
    code: "PAY-2026-0003",
    purpose: "EVENT_REGISTRATION",
    amount: "700000",
    journal: {
      publicId: "jrn-0009",
      code: "JRN-2026-0009",
      status: "POSTED",
    },
  }),
  rowOf({
    id: 4,
    publicId: "pay-0004",
    code: "PAY-2026-0004",
    status: "PENDING",
    method: null,
    paidAt: null,
    expiredAt: "2020-01-01T00:00:00.000Z",
    donorName: "Hamba Tuhan",
  }),
];

const onMockApi = (rows: Payment[] = ROWS) => {
  const urls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    urls.push(url);

    return Response.json({
      status: 200,
      message: "OK",
      totalData: rows.length,
      totalPage: 1,
      data: rows,
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
      <PaymentListScreen />
    </QueryClientProvider>,
  );
};

const VIEWER = { PEMBAYARAN: ["VIEW"] as MenuAction[] };

const POSTER = {
  PEMBAYARAN: ["VIEW"] as MenuAction[],
  JURNAL: ["VIEW", "CREATE"] as MenuAction[],
};

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan", () => {
    const urls = onMockApi();
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pembayaran"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("tanpa JURNAL CREATE: tombol posting tidak dirender", async () => {
    onMockApi();
    onRender(VIEWER);

    await waitFor(() =>
      expect(screen.getAllByText(/4 pembayaran/).length).toBeGreaterThan(0),
    );
    expect(
      screen.queryByRole("link", { name: /Posting pendaftaran event/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /Posting persembahan/ }),
    ).toBeNull();
  });

  test("dengan JURNAL CREATE: kedua jalur posting terlihat", () => {
    onMockApi();
    onRender(POSTER);

    expect(
      screen
        .getByRole("link", { name: /Posting persembahan/ })
        .getAttribute("href"),
    ).toBe("/keuangan/jurnal/posting-persembahan");
    expect(
      screen
        .getByRole("link", { name: /Posting pendaftaran event/ })
        .getAttribute("href"),
    ).toBe("/keuangan/pembayaran/posting-pembayaran");
  });
});

describe("daftar", () => {
  test("bawaan 30 hari terakhir, bukan seluruh tabel", async () => {
    const urls = onMockApi();
    onRender(VIEWER);

    await waitFor(() => expect(urls.length).toBeGreaterThan(0));

    const today = todayJakarta();

    expect(urls[0]).toContain(`endDate=${today}`);
    expect(urls[0]).toContain("startDate=");
  });

  test("baris menaut lewat publicId, tidak pernah lewat kode", async () => {
    onMockApi();
    onRender(VIEWER);

    const link = await screen.findByRole("link", {
      name: /Lihat pembayaran PAY-2026-0001/,
    });

    expect(link.getAttribute("href")).toBe("/keuangan/pembayaran/pay-0001");
  });

  test("di buku benar untuk keempat kombinasi", async () => {
    onMockApi();
    onRender(VIEWER);

    await screen.findAllByText("PAY-2026-0001");

    expect(screen.getAllByText("Sudah")).toHaveLength(2);
    expect(screen.getAllByText("Belum")).toHaveLength(1);
  });

  test("PENDING yang sudah lewat diberi keterangan tampilan", async () => {
    onMockApi();
    onRender(VIEWER);

    expect(
      (await screen.findAllByText("Kedaluwarsa (belum diperbarui)")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Menunggu").length).toBeGreaterThan(0);
  });

  test("anonim dipakai saat tidak ada jemaat maupun nama pemberi", async () => {
    onMockApi();
    onRender(VIEWER);

    expect((await screen.findAllByText("Anonim")).length).toBeGreaterThan(0);
  });

  test("tidak ada tombol tambah, ubah, hapus, reissue, atau refund", async () => {
    onMockApi();
    onRender(POSTER);

    await screen.findAllByText("PAY-2026-0001");

    for (const name of [/Tambah/, /Ubah/, /Hapus/, /Terbitkan/, /Refund/]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
      expect(screen.queryByRole("link", { name })).toBeNull();
    }
  });
});
