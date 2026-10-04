import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import {
  programKeys,
  useCancelProgram,
  useProgramAction,
  useSaveProgram,
} from "./api";
import type { ProgramAction } from "./types";

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
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
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

describe("api program", () => {
  test("queryKey daftar dan detail berada di bawah program", () => {
    expect(programKeys.all).toEqual(["program"]);
    expect(programKeys.detail("prg-0001")).toEqual([
      "program",
      "detail",
      "prg-0001",
    ]);
  });

  test("tambah memakai POST tanpa id, ubah memakai PUT dengan publicId", async () => {
    const calls = onMockApi();
    const client = onClient();
    const payload = {
      name: "Usulan",
      year: 2026,
      bapelId: 2,
      startDate: null,
      endDate: null,
      isUnplanned: false,
      description: null,
      items: [],
    };

    const create = renderHook(() => useSaveProgram(), {
      wrapper: onWrap(client),
    });
    await act(() => create.result.current.mutateAsync(payload));

    const update = renderHook(() => useSaveProgram("prg-0001"), {
      wrapper: onWrap(client),
    });
    await act(() => update.result.current.mutateAsync(payload));

    expect(calls[0]).toMatchObject({ url: "/api/v1/program", method: "POST" });
    expect(calls[1]).toMatchObject({
      url: "/api/v1/program/prg-0001",
      method: "PUT",
    });
  });

  test("setiap aksi status memakai metode dan sufiks endpointnya", async () => {
    const expected: Record<ProgramAction, { url: string; method: string }> = {
      pengajuan: {
        url: "/api/v1/program/prg-0001/pengajuan",
        method: "POST",
      },
      tarik: { url: "/api/v1/program/prg-0001/tarik", method: "PUT" },
      hapus: { url: "/api/v1/program/prg-0001", method: "DELETE" },
    };

    for (const action of Object.keys(expected) as ProgramAction[]) {
      const calls = onMockApi();
      const hook = renderHook(() => useProgramAction("prg-0001"), {
        wrapper: onWrap(onClient()),
      });

      await act(() => hook.result.current.mutateAsync(action));

      expect(calls[0]).toMatchObject(expected[action]);
    }
  });

  test("ajukan meng-invalidate program, pagu, dan persetujuan", async () => {
    onMockApi();
    const client = onClient();
    const invalidated: unknown[] = [];

    client.invalidateQueries = (async (filters?: { queryKey?: unknown }) => {
      invalidated.push(filters?.queryKey);
    }) as QueryClient["invalidateQueries"];

    const hook = renderHook(() => useProgramAction("prg-0001"), {
      wrapper: onWrap(client),
    });

    await act(() => hook.result.current.mutateAsync("pengajuan"));

    await waitFor(() =>
      expect(invalidated).toEqual([
        ["program"],
        ["budget-allocation"],
        ["persetujuan"],
      ]),
    );
  });

  test("hapus tidak menyentuh antrean persetujuan", async () => {
    onMockApi();
    const client = onClient();
    const invalidated: unknown[] = [];

    client.invalidateQueries = (async (filters?: { queryKey?: unknown }) => {
      invalidated.push(filters?.queryKey);
    }) as QueryClient["invalidateQueries"];

    const hook = renderHook(() => useProgramAction("prg-0001"), {
      wrapper: onWrap(client),
    });

    await act(() => hook.result.current.mutateAsync("hapus"));

    await waitFor(() =>
      expect(invalidated).toEqual([["program"], ["budget-allocation"]]),
    );
  });

  test("batalkan mengirim alasannya ke endpoint batal", async () => {
    const calls = onMockApi();
    const hook = renderHook(() => useCancelProgram("prg-0001"), {
      wrapper: onWrap(onClient()),
    });

    await act(() =>
      hook.result.current.mutateAsync({ cancelReason: "Jadwal berbenturan" }),
    );

    expect(calls[0]).toMatchObject({
      url: "/api/v1/program/prg-0001/batal",
      method: "PUT",
      body: { cancelReason: "Jadwal berbenturan" },
    });
  });
});
