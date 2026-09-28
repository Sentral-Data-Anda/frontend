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

import {
  useDeletePengumuman,
  usePengumumanList,
  useSavePengumuman,
} from "./api";

let viewport: ReturnType<typeof onStubViewport>;
const originalFetch = globalThis.fetch;
const requests: { url: string; method: string; body: unknown }[] = [];

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
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body,
    });

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

describe("usePengumumanList", () => {
  test("cari, kategori, status, dan badan pelayanan jadi query be-sada", async () => {
    onStubFetch(() =>
      Response.json({ status: 200, totalData: 0, totalPage: 0, data: [] }),
    );

    const { result } = renderHook(
      () =>
        usePengumumanList(
          onParams({
            search: "warta",
            status: "TERBIT",
            filters: { kategori: "WARTA", bapel: "2" },
            apiFilters: { category: "WARTA", bapelId: "2" },
          }),
        ),
      { wrapper: onWrapper(newClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    expect(requests[0].url).toBe(
      "/api/v1/pengumuman?page=1&limit=10&filter=warta&status=TERBIT&category=WARTA&bapelId=2",
    );
  });

  test("404 be-sada = daftar kosong", async () => {
    onStubFetch(() =>
      Response.json(
        { status: 404, error: "Pengumuman Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => usePengumumanList(onParams({})), {
      wrapper: onWrapper(newClient()),
    });

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(result.current.error).toBeNull();
  });
});

describe("simpan dan hapus", () => {
  const onSeedFeed = (queryClient: QueryClient) => {
    queryClient.setQueryData(["pengumuman", "feed", 4], []);
    queryClient.setQueryData(["pengumuman", "list"], []);
  };

  const isStale = (queryClient: QueryClient, key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;

  test("POST multipart, lalu daftar dan feed Beranda di-invalidate", async () => {
    const queryClient = newClient();
    onSeedFeed(queryClient);
    onStubFetch(() =>
      Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Pengumuman",
          data: { code: "PGM-2026-0010" },
        },
        { status: 201 },
      ),
    );

    const { result } = renderHook(() => useSavePengumuman(), {
      wrapper: onWrapper(queryClient),
    });
    const body = new FormData();

    await act(() => result.current.mutateAsync(body));

    expect(requests[0]).toMatchObject({
      url: "/api/v1/pengumuman",
      method: "POST",
      body,
    });
    expect(isStale(queryClient, ["pengumuman", "feed", 4])).toBe(true);
    expect(isStale(queryClient, ["pengumuman", "list"])).toBe(true);
  });

  test("PUT dan DELETE memakai kode", async () => {
    const queryClient = newClient();
    onSeedFeed(queryClient);
    onStubFetch(() =>
      Response.json({
        status: 200,
        message: "OK",
        data: { code: "PGM-2026-0001" },
      }),
    );

    const save = renderHook(() => useSavePengumuman("PGM-2026-0001"), {
      wrapper: onWrapper(queryClient),
    });
    await act(() => save.result.current.mutateAsync(new FormData()));

    const remove = renderHook(() => useDeletePengumuman("PGM-2026-0001"), {
      wrapper: onWrapper(queryClient),
    });
    await act(() => remove.result.current.mutateAsync());

    expect(requests.map(({ url, method }) => `${method} ${url}`)).toEqual([
      "PUT /api/v1/pengumuman/PGM-2026-0001",
      "DELETE /api/v1/pengumuman/PGM-2026-0001",
    ]);
    expect(isStale(queryClient, ["pengumuman", "feed", 4])).toBe(true);
  });
});
