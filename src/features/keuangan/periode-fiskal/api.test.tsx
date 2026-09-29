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

import {
  useClosePeriod,
  useFiscalPeriodList,
  useOpenYear,
  useReopenPeriod,
} from "./api";

afterEach(cleanup);

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const onParams = (next: Partial<ListState>): ListState => ({
  page: 1,
  limit: 12,
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

describe("useFiscalPeriodList", () => {
  test("filter tahun dikirim sebagai year", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "OK",
        totalData: 0,
        totalPage: 0,
        data: [],
      });
    });

    const { result } = renderHook(
      () => useFiscalPeriodList(onParams({ apiFilters: { year: "2026" } })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe("/api/v1/periode-fiskal?page=1&limit=12&year=2026");
  });

  test("404 dari be-sada menjadi daftar kosong", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Periode Fiskal Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => useFiscalPeriodList(onParams({})), {
      wrapper: onWrapper(onNewClient()),
    });

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
  });
});

describe("tulis dan invalidasi", () => {
  const onCall = async (run: () => { mutateAsync: () => Promise<unknown> }) => {
    const queryClient = onNewClient();
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);

      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    const requested: string[] = [];
    const onRestore = onStubFetch((url, init) => {
      requested.push(`${init?.method ?? "GET"} ${url} ${init?.body ?? ""}`);

      return Response.json({ status: 200, message: "OK", data: {} });
    });

    const { result } = renderHook(run, { wrapper: onWrapper(queryClient) });
    await result.current.mutateAsync();
    onRestore();

    return { invalidated, requested };
  };

  test("buka tahun mengirim { year } dan menyegarkan periode dan jurnal", async () => {
    const opened = await onCall(() => {
      const openYear = useOpenYear();

      return { mutateAsync: () => openYear.mutateAsync({ year: 2027 }) };
    });

    expect(opened.requested).toEqual([
      'POST /api/v1/periode-fiskal {"year":2027}',
    ]);
    expect(opened.invalidated).toEqual([["fiscal-period"], ["journal"]]);
  });

  test("tutup buku menyegarkan jurnal juga", async () => {
    const closed = await onCall(() => {
      const close = useClosePeriod("3");

      return { mutateAsync: () => close.mutateAsync() };
    });

    expect(closed.requested).toEqual(["PUT /api/v1/periode-fiskal/3/tutup "]);
    expect(closed.invalidated).toEqual([["fiscal-period"], ["journal"]]);
  });

  test("buka kembali mengirim alasan", async () => {
    const reopened = await onCall(() => {
      const reopen = useReopenPeriod("3");

      return {
        mutateAsync: () => reopen.mutateAsync({ reopenReason: "Koreksi" }),
      };
    });

    expect(reopened.requested).toEqual([
      'PUT /api/v1/periode-fiskal/3/buka {"reopenReason":"Koreksi"}',
    ]);
    expect(reopened.invalidated).toEqual([["fiscal-period"], ["journal"]]);
  });
});
