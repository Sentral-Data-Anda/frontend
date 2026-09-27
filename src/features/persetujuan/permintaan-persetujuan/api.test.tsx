import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { persetujuanKeys, useApprove, usePermintaanDetail } from "./api";
import { DETAIL_ID, approvalDetail } from "./fixtures";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("aksi meng-invalidate ['persetujuan']", () => {
  test("antrean Beranda dan daftar basi; detail yang terbuka tidak diambil ulang, lalu dibuang saat ditinggal", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const beranda = ["persetujuan", "menunggu-saya"];
    const list = [...persetujuanKeys.list("menunggu"), "page=1"];
    const calls: string[] = [];

    for (const key of [beranda, list]) {
      queryClient.setQueryData(key, { data: [] });
    }

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      calls.push(`${init?.method ?? "GET"} ${String(input)}`);

      return Response.json({
        status: 200,
        message: "ok",
        data: approvalDetail(),
      });
    }) as unknown as typeof fetch;

    const { result, unmount } = renderHook(
      () => ({
        detail: usePermintaanDetail(DETAIL_ID),
        approve: useApprove(DETAIL_ID),
      }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await waitFor(() => expect(result.current.detail.data).toBeDefined());
    calls.length = 0;

    await act(() => result.current.approve.mutateAsync());
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calls).toEqual([`PUT /api/v1/persetujuan/${DETAIL_ID}/setujui`]);
    expect(queryClient.getQueryState(beranda)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(list)?.isInvalidated).toBe(true);

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(
      queryClient.getQueryData(persetujuanKeys.detail(DETAIL_ID)),
    ).toBeUndefined();
  });
});
