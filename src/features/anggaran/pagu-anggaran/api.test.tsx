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

import { onStubViewport } from "../../../../tests/viewport";

import {
  allocationKeys,
  settingKeys,
  useAllocationList,
  useSaveAllocation,
  useSaveBudgetSetting,
} from "./api";

afterEach(cleanup);

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const PROGRAM_KEY = ["program"] as const;

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

describe("useAllocationList", () => {
  test("tahun dan komisi jadi year dan bapelId; cari jadi filter", async () => {
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

    renderHook(
      () =>
        useAllocationList(
          onParams({
            search: "pemuda",
            apiFilters: { year: "2027", bapelId: "3" },
          }),
        ),
      { wrapper: onWrapper(new QueryClient()) },
    );

    await waitFor(() => expect(requested).not.toBe(""));
    const query = new URL(requested, "http://x").searchParams;

    expect(query.get("year")).toBe("2027");
    expect(query.get("bapelId")).toBe("3");
    expect(query.get("filter")).toBe("pemuda");
    expect(query.get("status")).toBeNull();
    onRestore();
  });
});

describe("invalidasi", () => {
  test("simpan pagu meng-invalidate pagu dan program", async () => {
    const onRestore = onStubFetch(() =>
      Response.json({
        status: 201,
        message: "ok",
        data: { publicId: "pga-1" },
      }),
    );
    const queryClient = new QueryClient();
    const keys = [allocationKeys.lists(), PROGRAM_KEY, settingKeys.all];
    for (const key of keys) queryClient.setQueryData(key, { data: [] });

    const { result } = renderHook(() => useSaveAllocation(), {
      wrapper: onWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({
        bapelId: 2,
        year: 2027,
        amount: "1000000",
      }),
    );

    expect(
      keys.map((key) => queryClient.getQueryState(key)?.isInvalidated),
    ).toEqual([true, true, false]);
    onRestore();
  });

  test("simpan setelan meng-invalidate setelan, pagu, dan program", async () => {
    const onRestore = onStubFetch(() =>
      Response.json({ status: 200, message: "ok", data: { startMonth: 7 } }),
    );
    const queryClient = new QueryClient();
    const keys = [settingKeys.all, allocationKeys.lists(), PROGRAM_KEY];
    for (const key of keys) queryClient.setQueryData(key, { data: [] });

    const { result } = renderHook(() => useSaveBudgetSetting(), {
      wrapper: onWrapper(queryClient),
    });

    await act(() => result.current.mutateAsync({ startMonth: 7 }));

    expect(
      keys.map((key) => queryClient.getQueryState(key)?.isInvalidated),
    ).toEqual([true, true, true]);
    onRestore();
  });
});
