import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useDeleteLoanRoom, useSaveLoanBatch, useSaveLoanRoom } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const KEYS = [
  ["loan-room", "list", "startDate=2026-10-01&endDate=2026-10-07&limit=100"],
  ["loan-room", "booking", "2", "2026-10-01"],
  ["room", "usage", "RM-0002"],
  ["ibadah", "list"],
];

const onSetup = () => {
  const client = new QueryClient();
  const requests: string[] = [];

  for (const key of KEYS) client.setQueryData(key, { data: [] });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(`${init?.method} ${String(input)}`);

    return Response.json({ status: 200, message: "OK", data: { code: "X" } });
  }) as typeof fetch;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const isStale = (key: string[]) =>
    client.getQueryState(key)?.isInvalidated ?? false;

  return { wrapper, requests, isStale };
};

const BODY = {
  roomId: 2,
  date: "2026-10-01",
  startTime: "19:00",
  endTime: "21:00",
  purpose: "Latihan",
  jemaatId: 2,
};

describe("mutasi peminjaman", () => {
  test("simpan, simpan banyak, dan hapus menandai semua kueri loan-room + pemakaian ruang basi", async () => {
    const one = onSetup();
    const saveOne = renderHook(() => useSaveLoanRoom("LR-1"), {
      wrapper: one.wrapper,
    });

    await act(() => saveOne.result.current.mutateAsync(BODY));
    expect(one.requests).toEqual(["PUT /api/v1/loan-room/LR-1"]);
    expect(KEYS.map(one.isStale)).toEqual([true, true, true, false]);

    const batch = onSetup();
    const saveBatch = renderHook(() => useSaveLoanBatch(), {
      wrapper: batch.wrapper,
    });

    await act(() => saveBatch.result.current.mutateAsync([BODY]));
    expect(batch.requests).toEqual(["POST /api/v1/loan-room/batch"]);
    expect(KEYS.map(batch.isStale)).toEqual([true, true, true, false]);

    const removal = onSetup();
    const deleteLoan = renderHook(() => useDeleteLoanRoom("LR-1"), {
      wrapper: removal.wrapper,
    });

    await act(() => deleteLoan.result.current.mutateAsync());
    expect(removal.requests).toEqual(["DELETE /api/v1/loan-room/LR-1"]);
    expect(KEYS.map(removal.isStale)).toEqual([true, true, true, false]);
  });
});
