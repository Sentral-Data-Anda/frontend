import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useDeleteKontrak, useKontrakDetail, useSaveKontrak } from "./api";
import type { KontrakKaryawanPayload } from "./types";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onSpyFetch = () => {
  const calls: { url: string; method: string; body: string }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: String(init?.body ?? ""),
    });

    return Response.json({ status: 200, message: "OK", data: null });
  }) as typeof fetch;

  return calls;
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const PAYLOAD: KontrakKaryawanPayload = {
  karyawanId: 1,
  contractType: "TETAP",
  position: "Sekretaris",
  basicSalary: 4500000,
  effectiveFrom: "2026-05-12",
  effectiveTo: null,
  weeklyDayOff: [1],
  note: null,
};

const PREFIX = "/api/v1/kontrak-karyawan/";

describe("kunci path disandikan di setiap situs", () => {
  const NASTY = "../payroll/PYR-0001";
  const ENCODED = encodeURIComponent(NASTY);

  test("GET detail menyandikan kodenya", async () => {
    const calls = onSpyFetch();

    renderHook(() => useKontrakDetail(NASTY), { wrapper });

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].url).toBe(`${PREFIX}${ENCODED}`);
    expect(calls[0].url.slice(PREFIX.length)).not.toContain("/");
  });

  test("PUT menyandikan kodenya", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveKontrak(NASTY), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].method).toBe("PUT");
    expect(calls[0].url).toBe(`${PREFIX}${ENCODED}`);
  });

  test("DELETE menyandikan kodenya", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useDeleteKontrak(NASTY), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].url).toBe(`${PREFIX}${ENCODED}`);
  });
});

describe("metode simpan", () => {
  test("tanpa kode: POST ke koleksinya", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveKontrak(), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("/api/v1/kontrak-karyawan");
  });

  test("libur mingguan dikirim sebagai larik angka", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveKontrak(), { wrapper });

    result.current.mutate({ ...PAYLOAD, weeklyDayOff: [1, 2] });

    await waitFor(() => expect(calls.length).toBe(1));
    expect(JSON.parse(calls[0].body)).toMatchObject({ weeklyDayOff: [1, 2] });
  });
});
