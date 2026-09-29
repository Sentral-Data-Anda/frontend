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

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { currencyKeys, useRateList, useSaveRate } from "./api";

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

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

describe("useRateList", () => {
  test("bulan jadi startDate/endDate, kode mata uang ikut, cari tidak dikirim", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;
      return Response.json({
        status: 200,
        totalData: 0,
        totalPage: 0,
        data: [],
      });
    });
    const queryClient = new QueryClient();

    renderHook(
      () =>
        useRateList(
          "USD",
          onParams({ search: "abc", filters: { bulan: "2026-09" } }),
        ),
      { wrapper: onWrapper(queryClient) },
    );

    await waitFor(() => expect(requested).not.toBe(""));
    const query = new URL(requested, "http://x").searchParams;

    expect(query.get("currencyCode")).toBe("USD");
    expect(query.get("startDate")).toBe("2026-09-01");
    expect(query.get("endDate")).toBe("2026-09-30");
    expect(query.get("filter")).toBeNull();
    onRestore();
  });
});

describe("useSaveRate", () => {
  test("invalidate daftar mata uang, ddl currency dan kurs, bukan ddl lain", async () => {
    const onRestore = onStubFetch(() =>
      Response.json({ status: 201, message: "ok", data: { id: 9 } }),
    );
    const queryClient = new QueryClient();
    const keys = [
      currencyKeys.lists(),
      ddlKeys.list("currency"),
      ddlKeys.list("kurs?currencyCode=USD&date=2026-09-29"),
      ddlKeys.list("supplier"),
    ];
    for (const key of keys) queryClient.setQueryData(key, { data: [] });

    const { result } = renderHook(() => useSaveRate(), {
      wrapper: onWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({
        currencyCode: "USD",
        rateDate: "2026-09-29",
        rate: "15900",
        source: "MANUAL",
      }),
    );

    const isStale = keys.map(
      (key) => queryClient.getQueryState(key)?.isInvalidated,
    );
    expect(isStale).toEqual([true, true, true, false]);
    onRestore();
  });
});
