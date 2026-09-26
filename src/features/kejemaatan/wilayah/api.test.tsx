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

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { useWilayahList } from "./api";

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

const onRenderQuery = (params: ListState) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderHook(() => useWilayahList(params), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

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
      message: "Berhasil Mendapatkan Semua Wilayah",
      totalData: 1,
      totalPage: 1,
      data: [{ id: 1, code: "ZC-0001", name: "Wilayah I", isActive: true }],
    });
  });

  const { result } = onRenderQuery(params);

  await waitFor(() => expect(result.current.items).toBeDefined());
  onRestore();

  return requested;
};

describe("useWilayahList", () => {
  test("search jadi filter; tanpa status tidak mengirim isActive", async () => {
    expect(await onRequestedUrl(onParams({ search: "timur" }))).toBe(
      "/api/v1/zone-church?page=1&limit=10&filter=timur",
    );
  });

  test("status URL aktif/nonaktif diteruskan sebagai isActive=true/false", async () => {
    expect(await onRequestedUrl(onParams({ status: "aktif" }))).toBe(
      "/api/v1/zone-church?page=1&limit=10&isActive=true",
    );
    expect(await onRequestedUrl(onParams({ status: "nonaktif" }))).toBe(
      "/api/v1/zone-church?page=1&limit=10&isActive=false",
    );
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Wilayah Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = onRenderQuery(onParams({ search: "zzz" }));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});
