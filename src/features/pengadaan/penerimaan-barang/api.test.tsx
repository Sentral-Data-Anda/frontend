import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { ddlKeys } from "@/hooks/use-ddl-options";

import { useSaveReceipt } from "./api";

const originalFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async () =>
    Response.json(
      { status: 201, message: "ok", data: { code: "GRN-2026-0009" } },
      { status: 201 },
    )) as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

test("simpan meng-invalidate ddl pesanan, persediaan, dan barang; ddl lain tetap", async () => {
  const queryClient = new QueryClient();
  const keys = [
    "pesanan-pembelian?terbuka=1",
    "barang-persediaan",
    "asset?limit=20",
    "room",
  ];

  for (const key of keys) queryClient.setQueryData(ddlKeys.list(key), []);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useSaveReceipt(), { wrapper });

  await act(() => result.current.mutateAsync(new FormData()));

  expect(
    keys.map(
      (key) => queryClient.getQueryState(ddlKeys.list(key))?.isInvalidated,
    ),
  ).toEqual([true, true, true, false]);
});
