import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import type { Payment } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined, push: () => undefined }),
  usePathname: () => "/keuangan/pembayaran/pay-0001",
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

const { PaymentDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  actions.current = {};
});

const PAYMENT: Payment = {
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
  jemaat: { publicId: "jmt-0003", code: "JMT-0003", name: "Christian Wijaya" },
  donorName: null,
  typePersembahan: { code: "TPS-0004", name: "Syukur" },
  period: null,
  persembahan: { code: "PSB-2026-0021" },
  journal: null,
};

const onMockApi = (payment: Payment) => {
  const urls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    urls.push(url);

    return Response.json({ status: 200, message: "OK", data: payment });
  }) as typeof fetch;

  return urls;
};

const onRender = (
  granted: Record<string, MenuAction[]>,
  payment: Payment = PAYMENT,
) => {
  actions.current = granted;

  const urls = onMockApi(payment);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PaymentDetailScreen publicId="pay-0001" />
    </QueryClientProvider>,
  );

  return urls;
};

const FULL = {
  PEMBAYARAN: ["VIEW"] as MenuAction[],
  PERSEMBAHAN: ["VIEW"] as MenuAction[],
  JURNAL: ["VIEW"] as MenuAction[],
  KAS_MASUK: ["VIEW", "CREATE"] as MenuAction[],
};

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan", () => {
    const urls = onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pembayaran"),
    ).toBeTruthy();
    expect(urls).toEqual([]);
  });

  test("rute dibaca lewat publicId", async () => {
    const urls = onRender(FULL);

    await waitFor(() => expect(urls.length).toBeGreaterThan(0));
    expect(urls[0]).toBe("/api/v1/pembayaran/pay-0001");
  });
});

describe("halaman pembayaran", () => {
  test("lunas: catatan pencairan dan tautan Kas Masuk", async () => {
    onRender(FULL);

    expect(await screen.findByText(/masih di payment gateway/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Catat pencairan di Kas Masuk" })
        .getAttribute("href"),
    ).toBe("/keuangan/kas-masuk/baru");
  });

  test("belum lunas: tanpa catatan pencairan", async () => {
    onRender(FULL, {
      ...PAYMENT,
      status: "PENDING",
      paidAt: null,
      persembahan: null,
      expiredAt: "2020-01-01T00:00:00.000Z",
    });

    await screen.findByText("PAY-2026-0001");
    expect(screen.queryByText(/masih di payment gateway/)).toBeNull();
    expect(screen.getByText(/Kedaluwarsa \(belum diperbarui\)/)).toBeTruthy();
  });

  test("tautan persembahan memakai kode, tautan jurnal memakai publicId", async () => {
    onRender(FULL, {
      ...PAYMENT,
      purpose: "EVENT_REGISTRATION",
      journal: {
        publicId: "jrn-0009",
        code: "JRN-2026-0009",
        status: "POSTED",
      },
    });

    expect(
      (await screen.findByRole("link", { name: "PSB-2026-0021" })).getAttribute(
        "href",
      ),
    ).toBe("/keuangan/persembahan/PSB-2026-0021");
    expect(
      screen.getByRole("link", { name: "JRN-2026-0009" }).getAttribute("href"),
    ).toBe("/keuangan/jurnal/jrn-0009");
  });

  test("tanpa izin tetangganya, kodenya tetap terbaca tanpa tautan", async () => {
    onRender(
      { PEMBAYARAN: ["VIEW"] },
      {
        ...PAYMENT,
        journal: {
          publicId: "jrn-0009",
          code: "JRN-2026-0009",
          status: "POSTED",
        },
      },
    );

    await screen.findByText("PSB-2026-0021");
    expect(screen.queryByRole("link", { name: "PSB-2026-0021" })).toBeNull();
    expect(screen.queryByRole("link", { name: "JRN-2026-0009" })).toBeNull();
  });

  test("tanpa aksi dan tanpa tautan bayar milik jemaat", async () => {
    onRender(FULL);

    await screen.findByText("PAY-2026-0001");

    for (const name of [/Ubah/, /Hapus/, /Batalkan/, /Terbitkan/, /Refund/]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    expect(screen.queryByRole("link", { name: /Bayar/ })).toBeNull();
  });
});
