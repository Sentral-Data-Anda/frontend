import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
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

import { useDeleteRun, useRunAction, useRunList } from "./api";

afterEach(cleanup);

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

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

const onWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onStubFetch = (handler: (url: string, method: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(
      handler(String(input), init?.method ?? "GET"),
    )) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const onRequestedUrl = async (params: ListState) => {
  let requested = "";

  const onRestore = onStubFetch((url) => {
    requested = url;

    return Response.json({
      status: 200,
      message: "Berhasil Mendapatkan Penyusutan",
      totalData: 0,
      totalPage: 0,
      data: [],
    });
  });

  const { result } = renderHook(() => useRunList(params), {
    wrapper: onWrapper(onNewClient()),
  });

  await waitFor(() => expect(result.current.items).toBeDefined());
  onRestore();

  return requested;
};

describe("useRunList", () => {
  test("filter tahun → year, status URL draf/diposting → DRAFT/POSTED", async () => {
    expect(
      await onRequestedUrl(
        onParams({ status: "draf", apiFilters: { year: "2026" } }),
      ),
    ).toBe("/api/v1/penyusutan?page=1&limit=10&year=2026&status=DRAFT");
    expect(await onRequestedUrl(onParams({ status: "diposting" }))).toBe(
      "/api/v1/penyusutan?page=1&limit=10&status=POSTED",
    );
  });

  test("404 dari be-sada menjadi daftar kosong", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Penyusutan Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => useRunList(onParams({})), {
      wrapper: onWrapper(onNewClient()),
    });

    await waitFor(() => expect(result.current.items).toBeDefined());
    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});

describe("invalidasi", () => {
  const onInvalidated = async (
    run: () => { mutateAsync: () => Promise<unknown> },
  ) => {
    const queryClient = onNewClient();
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    const requested: string[] = [];
    const onRestore = onStubFetch((url, method) => {
      requested.push(`${method} ${url}`);

      return Response.json({ status: 200, message: "OK", data: {} });
    });

    const { result } = renderHook(run, { wrapper: onWrapper(queryClient) });
    await result.current.mutateAsync();
    onRestore();

    return { invalidated, requested };
  };

  test("hitung dan posting meng-invalidate depreciation dan asset", async () => {
    const calculated = await onInvalidated(() => {
      const action = useRunAction("PNY-2026-0003");

      return { mutateAsync: () => action.mutateAsync("calculate") };
    });
    expect(calculated.requested).toEqual([
      "PUT /api/v1/penyusutan/PNY-2026-0003/hitung",
    ]);
    expect(calculated.invalidated).toEqual([["depreciation"], ["asset"]]);

    const posted = await onInvalidated(() => {
      const action = useRunAction("PNY-2026-0003");

      return { mutateAsync: () => action.mutateAsync("post") };
    });
    expect(posted.requested).toEqual([
      "PUT /api/v1/penyusutan/PNY-2026-0003/posting",
    ]);
    expect(posted.invalidated).toEqual([["depreciation"], ["asset"]]);
  });

  test("hapus meng-invalidate depreciation saja", async () => {
    const removed = await onInvalidated(() => {
      const remove = useDeleteRun("PNY-2026-0003");

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(removed.requested).toEqual([
      "DELETE /api/v1/penyusutan/PNY-2026-0003",
    ]);
    expect(removed.invalidated).toEqual([["depreciation"]]);
  });
});
