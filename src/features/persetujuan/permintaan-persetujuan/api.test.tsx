import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { persetujuanKeys, useApprove } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("aksi meng-invalidate ['persetujuan']", () => {
  test("antrean Beranda dan daftar basi, detail yang terbuka tidak diambil ulang", async () => {
    const queryClient = new QueryClient();
    const beranda = ["persetujuan", "menunggu-saya"];
    const list = [...persetujuanKeys.list("menunggu"), "page=1"];
    const detail = persetujuanKeys.detail("abc");

    for (const key of [beranda, list, detail]) {
      queryClient.setQueryData(key, { data: [] });
    }

    globalThis.fetch = (async () =>
      Response.json({
        status: 200,
        message: "ok",
        data: {},
      })) as unknown as typeof fetch;

    const { result } = renderHook(() => useApprove("abc"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await act(() => result.current.mutateAsync());

    const isStale = (key: readonly unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;

    expect(isStale(beranda)).toBe(true);
    expect(isStale(list)).toBe(true);
    expect(isStale(detail)).toBe(true);
  });
});
