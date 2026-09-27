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

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { ibadahKeys, useIbadahList, useSaveIbadah } from "./api";
import { EMPTY_IBADAH_FORM, toIbadahPayload } from "./model";

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

const onStubFetch = (
  handler: (url: string, init?: RequestInit) => Response,
) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const EMPTY_LIST = () =>
  Response.json(
    { status: 404, error: "Ibadah Tidak Ditemukan" },
    { status: 404 },
  );

describe("useIbadahList", () => {
  test("cari → filter, tipe → typeIbadahId, wilayah → zoneChurchId, bulan → startDate + endDate tanpa bulan", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return EMPTY_LIST();
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useIbadahList(
          onParams({
            search: "minggu",
            filters: { tipe: "2", wilayah: "1", bulan: "2026-02" },
            apiFilters: {
              typeIbadahId: "2",
              zoneChurchId: "1",
              bulan: "2026-02",
            },
          }),
        ),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await waitFor(() => expect(result.current.items).toEqual([]));

    expect(requested).toBe(
      "/api/v1/ibadah?page=1&limit=10&filter=minggu&typeIbadahId=2&zoneChurchId=1&startDate=2026-02-01&endDate=2026-02-28",
    );
    expect(result.current.error).toBeNull();
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .every(
          (query) =>
            query.queryKey[0] === "ibadah" && query.queryKey[1] === "list",
        ),
    ).toBe(true);

    onRestore();
  });
});

describe("useSaveIbadah", () => {
  test("simpan meng-invalidate semua daftar ibadah (termasuk Beranda) dan saran tuan rumah", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        {
          status: 200,
          message: "Berhasil Memperbarui Data Ibadah",
          data: { code: "IBD_0001-2026-0001" },
        },
        { status: 200 },
      ),
    );
    const queryClient = new QueryClient();
    const beranda = ["ibadah", "list", "date=2026-09-27&limit=100"];
    const hosts = ["ibadah", "saran", "6", "1"];
    queryClient.setQueryData(beranda, { data: [] });
    queryClient.setQueryData(hosts, { data: [] });

    const { result } = renderHook(() => useSaveIbadah("IBD_0001-2026-0001"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await act(() =>
      result.current.mutateAsync(
        toIbadahPayload({
          ...EMPTY_IBADAH_FORM,
          typeIbadahId: "1",
          date: "2026-09-27",
          startTime: "08:00",
        }),
      ),
    );

    expect(ibadahKeys.lists()).toEqual(["ibadah", "list"]);
    expect(queryClient.getQueryState(beranda)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(hosts)?.isInvalidated).toBe(true);

    onRestore();
  });
});
