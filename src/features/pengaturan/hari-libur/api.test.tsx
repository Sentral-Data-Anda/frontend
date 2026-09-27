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

import { useHolidayList } from "./api";

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

  return renderHook(() => useHolidayList(params), {
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

describe("useHolidayList", () => {
  test("cari jadi filter, tahun jadi year, tipe jadi type", async () => {
    let requested = "";

    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Hari Libur",
        totalData: 1,
        totalPage: 1,
        data: [
          {
            id: 13,
            publicId: "a",
            date: "2026-09-27T00:00:00.000Z",
            originDate: "1985-09-27T00:00:00.000Z",
            name: "HUT Gereja",
            type: "GEREJA",
            isRecurring: true,
          },
        ],
      });
    });

    const { result } = onRenderQuery(
      onParams({
        search: "hut",
        filters: { tahun: "2026", tipe: "GEREJA" },
        apiFilters: { year: "2026", type: "GEREJA" },
      }),
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(requested).toBe(
      "/api/v1/hari-libur?page=1&limit=10&filter=hut&year=2026&type=GEREJA",
    );
    expect(result.current.items?.[0]?.name).toBe("HUT Gereja");

    onRestore();
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Hari Libur Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = onRenderQuery(onParams({}));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});
