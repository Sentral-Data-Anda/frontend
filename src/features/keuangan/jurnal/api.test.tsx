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
import { todayJakarta } from "@/lib/date";

import { onStubViewport } from "../../../../tests/viewport";

import { useJournalList, usePostPersembahan } from "./api";

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

type Call = { url: string; method: string; body: unknown };

const onStubFetch = (calls: Call[], response: Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    return Promise.resolve(response.clone());
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const RESULT = Response.json({
  status: 200,
  message: "Berhasil Memeriksa Posting Persembahan",
  data: { posted: 3, skipped: 1, refused: [] },
});

const onQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("useJournalList", () => {
  test("tanpa filter bulan, daftar meminta tahun berjalan dan tidak mengirim month", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(
      calls,
      Response.json({ status: 200, totalData: 0, totalPage: 0, data: [] }),
    );

    renderHook(() => useJournalList(onParams({})), {
      wrapper: onWrapper(onQueryClient()),
    });

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    onRestore();

    const query = new URL(calls[0].url, "http://localhost").searchParams;

    expect(query.get("year")).toBe(todayJakarta().slice(0, 4));
    expect(query.get("month")).toBeNull();
    expect(query.get("accountId")).toBeNull();
  });

  test("filter bulan dan akun ikut sebagai year, month, accountId", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(
      calls,
      Response.json({ status: 200, totalData: 0, totalPage: 0, data: [] }),
    );

    renderHook(
      () =>
        useJournalList(onParams({ filters: { bulan: "2026-03", akun: "4" } })),
      { wrapper: onWrapper(onQueryClient()) },
    );

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    onRestore();

    const query = new URL(calls[0].url, "http://localhost").searchParams;

    expect(query.get("year")).toBe("2026");
    expect(query.get("month")).toBe("3");
    expect(query.get("accountId")).toBe("4");
  });
});

describe("usePostPersembahan", () => {
  test("pratinjau mengirim dryRun=1 tepat, dan hanya from/to di body", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls, RESULT);
    const { result } = renderHook(() => usePostPersembahan(), {
      wrapper: onWrapper(onQueryClient()),
    });

    await act(async () => {
      await result.current.mutateAsync({
        from: "2026-03-01",
        to: "2026-03-31",
        isDryRun: true,
      });
    });
    onRestore();

    const url = new URL(calls[0].url, "http://localhost");

    expect(url.pathname).toBe("/api/v1/jurnal/posting-persembahan");
    expect(url.searchParams.get("dryRun")).toBe("1");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });

  test("posting sungguhan tidak pernah membawa dryRun", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls, RESULT);
    const { result } = renderHook(() => usePostPersembahan(), {
      wrapper: onWrapper(onQueryClient()),
    });

    await act(async () => {
      await result.current.mutateAsync({
        from: "2026-03-01",
        to: "2026-03-31",
        isDryRun: false,
      });
    });
    onRestore();

    const url = new URL(calls[0].url, "http://localhost");

    expect(url.search).toBe("");
    expect(url.searchParams.has("dryRun")).toBe(false);
  });

  test("pratinjau tidak menginvalidasi cache apa pun", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls, RESULT);
    const queryClient = onQueryClient();
    const invalidated: unknown[] = [];

    queryClient.invalidateQueries = ((filters: unknown) => {
      invalidated.push(filters);

      return Promise.resolve();
    }) as typeof queryClient.invalidateQueries;

    const { result } = renderHook(() => usePostPersembahan(), {
      wrapper: onWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        from: "2026-03-01",
        to: "2026-03-31",
        isDryRun: true,
      });
    });
    onRestore();

    expect(invalidated).toHaveLength(0);
  });

  test("posting sungguhan menginvalidasi journal, fiscal-period, dan persembahan", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls, RESULT);
    const queryClient = onQueryClient();
    const keys: string[] = [];

    queryClient.invalidateQueries = ((filters: {
      queryKey?: readonly unknown[];
    }) => {
      keys.push(String(filters.queryKey?.[0]));

      return Promise.resolve();
    }) as typeof queryClient.invalidateQueries;

    const { result } = renderHook(() => usePostPersembahan(), {
      wrapper: onWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        from: "2026-03-01",
        to: "2026-03-31",
        isDryRun: false,
      });
    });
    onRestore();

    expect(keys).toContain("journal");
    expect(keys).toContain("fiscal-period");
    expect(keys).toContain("persembahan");
  });
});
