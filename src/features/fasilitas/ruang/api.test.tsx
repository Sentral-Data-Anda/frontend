import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import type { ReactNode } from "react";

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { useDeleteRuang, useRuangList, useSaveRuang } from "./api";

let viewport: ReturnType<typeof onStubViewport>;
const originalFetch = globalThis.fetch;
const requests: { url: string; method: string }[] = [];

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requests.length = 0;
});

const onStubFetch = (response: () => Response) => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), method: init?.method ?? "GET" });

    return Promise.resolve(response());
  }) as typeof fetch;
};

const onParams = (next: Partial<ListState>): ListState => ({
  page: 1,
  limit: 10,
  search: "",
  status: "",
  onSearch: () => {},
  isFiltered: false,
  onApplyFilters: () => {},
  onClearFilters: () => {},
  onPickPage: () => {},
  onPickLimit: () => {},
  onPickFilter: () => {},
  filters: {},
  apiFilters: {},
  ...next,
});

const onWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("useRuangList", () => {
  test.each([
    ["aktif", "&isActive=1"],
    ["nonaktif", "&isActive=0"],
    ["", ""],
  ])("status %p → isActive be-sada", async (status, query) => {
    onStubFetch(() =>
      Response.json({ status: 200, totalData: 0, totalPage: 0, data: [] }),
    );

    const { result } = renderHook(
      () => useRuangList(onParams({ search: "aula", status })),
      { wrapper: onWrapper(newClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    expect(requests[0].url).toBe(
      `/api/v1/room?page=1&limit=10&filter=aula${query}`,
    );
  });

  test("404 be-sada = daftar kosong", async () => {
    onStubFetch(() =>
      Response.json(
        { status: 404, error: "Ruang Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => useRuangList(onParams({})), {
      wrapper: onWrapper(newClient()),
    });

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(result.current.error).toBeNull();
  });
});

describe("simpan dan hapus", () => {
  const isStale = (queryClient: QueryClient, key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;

  const onSeed = (queryClient: QueryClient) => {
    queryClient.setQueryData(["room", "list"], []);
    queryClient.setQueryData(["room", "usage", "RM-0002"], []);
    queryClient.setQueryData(["room", "detail", "RM-0002"], {});
    queryClient.setQueryData(["ddl", "room"], []);
  };

  test("simpan meng-invalidate semua kueri ruang dan pilihan ruang", async () => {
    const queryClient = newClient();
    onSeed(queryClient);
    onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: { code: "RM-0002" } }),
    );

    const { result } = renderHook(() => useSaveRuang("RM-0002"), {
      wrapper: onWrapper(queryClient),
    });
    await act(() => result.current.mutateAsync(new FormData()));

    expect(requests[0]).toEqual({
      url: "/api/v1/room/RM-0002",
      method: "PUT",
    });
    for (const key of [
      ["room", "list"],
      ["room", "usage", "RM-0002"],
      ["room", "detail", "RM-0002"],
      ["ddl", "room"],
    ]) {
      expect(isStale(queryClient, key)).toBe(true);
    }
  });

  test("tambah POST ke /room; hapus DELETE ke kode", async () => {
    const queryClient = newClient();
    onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: { code: "RM-0007" } }),
    );

    const save = renderHook(() => useSaveRuang(), {
      wrapper: onWrapper(queryClient),
    });
    await act(() => save.result.current.mutateAsync(new FormData()));

    const remove = renderHook(() => useDeleteRuang("RM-0007"), {
      wrapper: onWrapper(queryClient),
    });
    await act(() => remove.result.current.mutateAsync());

    expect(requests.map(({ url, method }) => `${method} ${url}`)).toEqual([
      "POST /api/v1/room",
      "DELETE /api/v1/room/RM-0007",
    ]);
  });
});
