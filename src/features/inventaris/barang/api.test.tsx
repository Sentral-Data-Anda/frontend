import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import type { ReactNode } from "react";

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { useAssetList, useDeleteAsset, useSaveAsset } from "./api";

let viewport: ReturnType<typeof onStubViewport>;
const originalFetch = globalThis.fetch;
const requests: string[] = [];

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
    requests.push(`${init?.method ?? "GET"} ${String(input)}`);

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

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

test("filter daftar → query be-sada; 404 = kosong", async () => {
  onStubFetch(() =>
    Response.json(
      { status: 404, error: "Barang Tidak Ditemukan" },
      { status: 404 },
    ),
  );

  const { result } = renderHook(
    () =>
      useAssetList(
        onParams({
          search: "epson",
          status: "menunggu",
          apiFilters: {
            condition: "RUSAK_RINGAN",
            acquisitionSource: "DONATION",
            typeId: "1",
            roomId: "2",
            bapelId: "5",
          },
        }),
      ),
    { wrapper: onWrapper(newClient()) },
  );

  await waitFor(() => expect(result.current.items).toEqual([]));
  expect(result.current.error).toBeNull();
  expect(requests[0]).toBe(
    "GET /api/v1/asset?page=1&limit=10&filter=epson&status=menunggu&condition=RUSAK_RINGAN&acquisitionSource=DONATION&typeId=1&roomId=2&bapelId=5",
  );
});

test("simpan meng-invalidate kueri barang, riwayat tidak, dan ddl asset", async () => {
  const queryClient = newClient();
  const isStale = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;

  queryClient.setQueryData(["asset", "list"], []);
  queryClient.setQueryData(["asset", "detail", "AST_1"], {});
  queryClient.setQueryData(["ddl", "asset?limit=20"], []);
  queryClient.setQueryData(["ddl", "room"], []);
  onStubFetch(() =>
    Response.json({ status: 200, message: "OK", data: { code: "AST_1" } }),
  );

  const save = renderHook(() => useSaveAsset("AST_1"), {
    wrapper: onWrapper(queryClient),
  });
  await act(() => save.result.current.mutateAsync(new FormData()));

  expect(isStale(["asset", "list"])).toBe(true);
  expect(isStale(["asset", "detail", "AST_1"])).toBe(true);
  expect(isStale(["ddl", "asset?limit=20"])).toBe(true);
  expect(isStale(["ddl", "room"])).toBe(false);

  const create = renderHook(() => useSaveAsset(), {
    wrapper: onWrapper(queryClient),
  });
  await act(() => create.result.current.mutateAsync(new FormData()));

  const remove = renderHook(() => useDeleteAsset("AST_1"), {
    wrapper: onWrapper(queryClient),
  });
  await act(() => remove.result.current.mutateAsync());

  expect(requests).toEqual([
    "PUT /api/v1/asset/AST_1",
    "POST /api/v1/asset",
    "DELETE /api/v1/asset/AST_1",
  ]);
});
