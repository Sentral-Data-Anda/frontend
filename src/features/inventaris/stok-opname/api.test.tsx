import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useOpnameAction, useSaveOpname } from "./api";

const originalFetch = globalThis.fetch;
const requests: string[] = [];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requests.length = 0;
});

const onSetup = () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(`${init?.method ?? "GET"} ${String(input)}`);

    return Promise.resolve(
      Response.json({ status: 200, message: "OK", data: { code: "X" } }),
    );
  }) as typeof fetch;

  const queryClient = new QueryClient();
  const keys = [
    ["stock-opname", "list"],
    ["stock-item", "list"],
    ["stock-movement", "list"],
    ["ddl", "barang-persediaan?roomId=2"],
    ["ddl", "room"],
  ];

  for (const key of keys) queryClient.setQueryData(key, { data: [] });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const staleKeys = () =>
    keys
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => key.join(":"));

  return { wrapper, staleKeys };
};

test("selesai: PUT /:code/selesai, hanya stok opname yang segar ulang", async () => {
  const { wrapper, staleKeys } = onSetup();
  const { result } = renderHook(() => useOpnameAction("OPN-2026-0005"), {
    wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync("selesai");
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(requests).toEqual(["PUT /api/v1/stok-opname/OPN-2026-0005/selesai"]);
  expect(staleKeys()).toEqual(["stock-opname:list"]);
});

test("posting juga meng-invalidate stok, mutasi, dan ddl barang persediaan", async () => {
  const { wrapper, staleKeys } = onSetup();
  const { result } = renderHook(() => useOpnameAction("OPN-2026-0004"), {
    wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync("posting");
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(staleKeys()).toEqual([
    "stock-opname:list",
    "stock-item:list",
    "stock-movement:list",
    "ddl:barang-persediaan?roomId=2",
  ]);
});

test("simpan: POST tanpa kode, PUT dengan kode", async () => {
  const { wrapper } = onSetup();
  const created = renderHook(() => useSaveOpname(), { wrapper });
  const updated = renderHook(() => useSaveOpname("OPN-2026-0005"), { wrapper });
  const payload = {
    opnameDate: "2026-09-29",
    roomId: null,
    note: null,
    items: [],
  };

  await act(async () => {
    await created.result.current.mutateAsync(payload);
  });
  await waitFor(() => expect(created.result.current.isSuccess).toBe(true));
  await act(async () => {
    await updated.result.current.mutateAsync(payload);
  });
  await waitFor(() => expect(updated.result.current.isSuccess).toBe(true));

  expect(requests).toEqual([
    "POST /api/v1/stok-opname",
    "PUT /api/v1/stok-opname/OPN-2026-0005",
  ]);
});
