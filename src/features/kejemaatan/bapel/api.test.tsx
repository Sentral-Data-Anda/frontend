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

import { useBapelList } from "./api";

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
  onPickStatus: () => {},
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

  return renderHook(() => useBapelList(params), {
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

describe("useBapelList", () => {
  test("menembak /api/v1/bapel dengan search diterjemahkan jadi filter", async () => {
    let requested = "";

    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Bapel",
        totalData: 1,
        totalPage: 1,
        data: [
          {
            id: 1,
            publicId: "a",
            code: "BPL-0001",
            name: "Komisi Pemuda",
            rules: [],
          },
        ],
      });
    });

    const { result } = onRenderQuery(onParams({ search: "pemuda" }));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(requested).toBe("/api/v1/bapel?page=1&limit=10&filter=pemuda");
    expect(result.current.items?.[0]?.name).toBe("Komisi Pemuda");
    expect(result.current.totalData).toBe(1);

    onRestore();
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Bapel Tidak Ditemukan" },
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
