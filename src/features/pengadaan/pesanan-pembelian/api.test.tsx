import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useOrderAction, useRatePreview, useSaveOrder } from "./api";

const originalFetch = globalThis.fetch;
const requests: string[] = [];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requests.length = 0;
});

const KEYS = [
  ["purchase-order", "list"],
  ["purchase-order", "detail", "PO-2026-0006"],
  ["purchase-request", "list"],
  ["ddl", "pesanan-pembelian?terbuka=1"],
  ["ddl", "permintaan-pembelian"],
  ["ddl", "supplier"],
  ["goods-receipt", "list"],
];

const onSetup = () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(`${init?.method ?? "GET"} ${String(input)}`);

    return Promise.resolve(
      Response.json({ status: 200, message: "OK", data: { code: "X" } }),
    );
  }) as typeof fetch;

  const queryClient = new QueryClient();

  for (const key of KEYS) queryClient.setQueryData(key, { data: [] });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const staleKeys = () =>
    KEYS.filter((key) => queryClient.getQueryState(key)?.isInvalidated).map(
      (key) => key.join(":"),
    );

  return { wrapper, staleKeys };
};

const PAYLOAD = {
  purchaseRequestId: 5,
  supplierId: 6,
  currencyCode: "IDR",
  orderDate: "2026-09-24",
  items: [],
};

test("simpan: POST tanpa kode, PUT dengan kode; pesanan, permintaan, dan ddl terkait segar ulang", async () => {
  const { wrapper, staleKeys } = onSetup();
  const created = renderHook(() => useSaveOrder(), { wrapper });
  const updated = renderHook(() => useSaveOrder("PO-2026-0006"), { wrapper });

  await act(async () => {
    await created.result.current.mutateAsync(PAYLOAD);
    await updated.result.current.mutateAsync(PAYLOAD);
  });
  await waitFor(() => expect(updated.result.current.isSuccess).toBe(true));

  expect(requests).toEqual([
    "POST /api/v1/pesanan-pembelian",
    "PUT /api/v1/pesanan-pembelian/PO-2026-0006",
  ]);
  expect(staleKeys()).toEqual([
    "purchase-order:list",
    "purchase-order:detail:PO-2026-0006",
    "purchase-request:list",
    "ddl:pesanan-pembelian?terbuka=1",
    "ddl:permintaan-pembelian",
  ]);
});

test("aksi: batal/tutup PUT, hapus DELETE tanpa menyegarkan detail", async () => {
  const { wrapper, staleKeys } = onSetup();
  const { result } = renderHook(() => useOrderAction("PO-2026-0006"), {
    wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync("hapus");
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(staleKeys()).not.toContain("purchase-order:detail:PO-2026-0006");
  expect(staleKeys()).toContain("purchase-order:list");

  await act(async () => {
    await result.current.mutateAsync("batal");
    await result.current.mutateAsync("tutup");
  });

  expect(requests).toEqual([
    "DELETE /api/v1/pesanan-pembelian/PO-2026-0006",
    "PUT /api/v1/pesanan-pembelian/PO-2026-0006/batal",
    "PUT /api/v1/pesanan-pembelian/PO-2026-0006/tutup",
  ]);
  expect(staleKeys()).toContain("purchase-order:detail:PO-2026-0006");
});

const onStubRate = (status: number, body: Record<string, unknown>) => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    requests.push(`GET ${String(input)}`);

    return Promise.resolve(Response.json(body, { status }));
  }) as typeof fetch;

  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

test("kurs pratinjau: IDR dan tanggal belum lengkap tidak mengirim kueri kosong", () => {
  const wrapper = onStubRate(400, {
    status: 400,
    error: "Mohon Lengkapi Tanggal",
  });
  const idr = renderHook(() => useRatePreview("IDR", "2026-09-20"), {
    wrapper,
  });
  const noDate = renderHook(() => useRatePreview("USD", "2026-09"), {
    wrapper,
  });

  expect(idr.result.current.isEnabled).toBe(false);
  expect(noDate.result.current.isEnabled).toBe(false);
  expect(requests).toEqual([]);
});

test("kurs pratinjau: angka terpendek, 404 = belum ada kurs, 400 = gagal", async () => {
  const found = renderHook(() => useRatePreview("USD", "2026-09-20"), {
    wrapper: onStubRate(200, {
      status: 200,
      message: "OK",
      data: {
        currencyCode: "USD",
        rate: "15800",
        rateDate: "2026-09-18T00:00:00.000Z",
        source: "MANUAL",
      },
    }),
  });

  await waitFor(() => expect(found.result.current.rate?.rate).toBe("15800"));
  expect(requests).toEqual([
    "GET /api/v1/ddl/kurs?currencyCode=USD&date=2026-09-20",
  ]);

  const missing = renderHook(() => useRatePreview("EUR", "2026-09-20"), {
    wrapper: onStubRate(404, {
      status: 404,
      error:
        "Belum Ada Kurs EUR Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu",
      issues: [{ path: "currencyCode", message: "Belum Ada Kurs EUR" }],
    }),
  });

  await waitFor(() => expect(missing.result.current.isMissing).toBe(true));

  const invalid = renderHook(() => useRatePreview("EUR", "2026-09-20"), {
    wrapper: onStubRate(400, {
      status: 400,
      error: "Kode Mata Uang harus 3 huruf",
      issues: [
        { path: "currencyCode", message: "Kode Mata Uang harus 3 huruf" },
      ],
    }),
  });

  await waitFor(() => expect(invalid.result.current.isFailed).toBe(true));
  expect(invalid.result.current.isMissing).toBe(false);
});
