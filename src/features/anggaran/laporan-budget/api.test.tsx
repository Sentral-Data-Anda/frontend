import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import {
  reportKeys,
  useCompliance,
  usePrefill,
  useReportAction,
  useSaveReport,
} from "./api";
import type { ReportAction } from "./types";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onMockApi = () => {
  const calls: { url: string; method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body,
    });

    return Response.json({ status: 200, message: "ok", data: {} });
  }) as typeof fetch;

  return calls;
};

const onWrap = (client: QueryClient) => {
  const Wrapper = (props: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );

  return Wrapper;
};

const onClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("api laporan budget", () => {
  test("queryKey daftar dan detail berada di bawah budget-report", () => {
    expect(reportKeys.all).toEqual(["budget-report"]);
    expect(reportKeys.detail("lpb-0001")).toEqual([
      "budget-report",
      "detail",
      "lpb-0001",
    ]);
  });

  test("simpan memakai multipart apa adanya, tanpa content-type JSON", async () => {
    const calls = onMockApi();
    const client = onClient();
    const body = new FormData();

    body.append("bapelId", "2");

    const create = renderHook(() => useSaveReport(), {
      wrapper: onWrap(client),
    });
    await act(() => create.result.current.mutateAsync(body));

    const update = renderHook(() => useSaveReport("lpb-0001"), {
      wrapper: onWrap(client),
    });
    await act(() => update.result.current.mutateAsync(body));

    expect(calls[0]).toMatchObject({
      url: "/api/v1/laporan-budget",
      method: "POST",
    });
    expect(calls[0]?.body).toBeInstanceOf(FormData);
    expect(calls[1]).toMatchObject({
      url: "/api/v1/laporan-budget/lpb-0001",
      method: "PUT",
    });
  });

  test("aksi memakai jalur dan metode yang dipakai be-sada", async () => {
    const calls = onMockApi();
    const client = onClient();
    const action = renderHook(() => useReportAction("lpb-0001"), {
      wrapper: onWrap(client),
    });

    for (const next of ["pengajuan", "tarik", "hapus"] as ReportAction[]) {
      await act(() => action.result.current.mutateAsync(next));
    }

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/v1/laporan-budget/lpb-0001/pengajuan",
      "PUT /api/v1/laporan-budget/lpb-0001/tarik",
      "DELETE /api/v1/laporan-budget/lpb-0001",
    ]);
  });

  test("setiap tulisan ikut menyegarkan Kas Keluar, karena laporan membuka pencairan", async () => {
    onMockApi();

    const client = onClient();
    const invalidated: unknown[][] = [];

    client.invalidateQueries = (async (filters?: { queryKey?: unknown[] }) => {
      invalidated.push(filters?.queryKey ?? []);
    }) as QueryClient["invalidateQueries"];

    const action = renderHook(() => useReportAction("lpb-0001"), {
      wrapper: onWrap(client),
    });

    await act(() => action.result.current.mutateAsync("pengajuan"));

    expect(invalidated).toContainEqual(["budget-report"]);
    expect(invalidated).toContainEqual(["cash-expense"]);
    expect(invalidated).toContainEqual(["persetujuan"]);
  });

  test("menghapus tidak menyegarkan antrean persetujuan", async () => {
    onMockApi();

    const client = onClient();
    const invalidated: unknown[][] = [];

    client.invalidateQueries = (async (filters?: { queryKey?: unknown[] }) => {
      invalidated.push(filters?.queryKey ?? []);
    }) as QueryClient["invalidateQueries"];

    const action = renderHook(() => useReportAction("lpb-0001"), {
      wrapper: onWrap(client),
    });

    await act(() => action.result.current.mutateAsync("hapus"));

    expect(invalidated).toContainEqual(["cash-expense"]);
    expect(invalidated).not.toContainEqual(["persetujuan"]);
  });

  test("belum lapor dan prefill memakai bulan kalender di query", async () => {
    const calls = onMockApi();
    const client = onClient();

    renderHook(() => useCompliance("2026-09"), { wrapper: onWrap(client) });
    renderHook(() => usePrefill("2", "2026-09", true), {
      wrapper: onWrap(client),
    });

    await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(2));

    expect(calls.map((call) => call.url)).toContain(
      "/api/v1/laporan-budget/belum-lapor?year=2026&month=9",
    );
    expect(calls.map((call) => call.url)).toContain(
      "/api/v1/laporan-budget/prefill?bapelId=2&year=2026&month=9",
    );
  });

  test("prefill tidak diminta sebelum komisi dan bulan terisi", async () => {
    const calls = onMockApi();
    const client = onClient();

    renderHook(() => usePrefill("", "2026-09", true), {
      wrapper: onWrap(client),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(calls).toHaveLength(0);
  });
});
