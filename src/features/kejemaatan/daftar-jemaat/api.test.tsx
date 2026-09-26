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

import { useJemaatList } from "./api";

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

  return renderHook(() => useJemaatList(params), {
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

describe("useJemaatList", () => {
  test("menembak /api/v1/jemaat dengan search diterjemahkan jadi filter", async () => {
    let requested = "";

    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Jemaat",
        totalData: 1,
        totalPage: 1,
        data: [
          {
            code: "JMT-0001",
            name: "Andreas",
            gender: "L",
            birthDate: null,
            type: "ANGGOTA",
            roleInFamily: null,
            keluarga: null,
            status: "AKTIF",
          },
        ],
      });
    });

    const { result } = onRenderQuery(onParams({ search: "and" }));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(requested).toBe("/api/v1/jemaat?page=1&limit=10&filter=and");
    expect(result.current.items?.[0]?.name).toBe("Andreas");
    expect(result.current.totalData).toBe(1);

    onRestore();
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = onRenderQuery(onParams({ search: "zzz" }));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.totalData).toBe(0);

    onRestore();
  });

  test("500 tetap menjadi galat, dengan pesan dari be-sada", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 500, error: "Kesalahan server." },
        { status: 500 },
      ),
    );

    const { result } = onRenderQuery(onParams({}));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("Kesalahan server.");

    onRestore();
  });
});
