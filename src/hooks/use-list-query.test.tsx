import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { ListState } from "@/hooks/use-list-params";
import type { ApiListResponse } from "@/types/api";

import { onStubViewport } from "../../tests/viewport";

import { getNextPageParam, useListQuery } from "./use-list-query";

let onRestoreViewport = () => {};

afterEach(() => {
  cleanup();
  onRestoreViewport();
});

type Row = { code: string };

const onParams = (next: Partial<ListState> = {}): ListState => ({
  page: 1,
  limit: 2,
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

const onServer = (total: number, failPage?: number) => {
  const requests: string[] = [];

  const fetchPage = async (apiQuery: string): Promise<ApiListResponse<Row>> => {
    requests.push(apiQuery);

    const query = new URLSearchParams(apiQuery);
    const page = Number(query.get("page"));
    const limit = Number(query.get("limit"));
    const prefix = query.get("filter") ?? "row";

    if (page === failPage) throw new Error("Kesalahan server.");

    const data = Array.from({ length: total }, (_, index) => ({
      code: `${prefix}-${index + 1}`,
    })).slice((page - 1) * limit, page * limit);

    if (data.length === 0) {
      return { status: 404, message: "", data: [], totalData: 0, totalPage: 0 };
    }

    return {
      status: 200,
      message: "",
      data,
      totalData: total,
      totalPage: Math.ceil(total / limit),
    };
  };

  return { fetchPage, requests };
};

const onRender = (
  isDesktop: boolean,
  server: ReturnType<typeof onServer>,
  params = onParams(),
  refetchInterval?: number,
  enabled?: boolean,
) => {
  const viewport = onStubViewport(isDesktop);
  onRestoreViewport = viewport.onRestore;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });

  const hook = renderHook(
    (props: ListState) =>
      useListQuery({
        queryKey: ["uji"],
        fetchPage: server.fetchPage,
        params: props,
        refetchInterval,
        enabled,
      }),
    {
      initialProps: params,
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    },
  );

  return { ...hook, viewport };
};

const codes = (items: Row[] | undefined) => items?.map((row) => row.code);

const onLoadMore = async (
  result: ReturnType<typeof onRender>["result"],
  expected: number,
) => {
  act(() => {
    const { pagination } = result.current;
    if (pagination.mode === "more") pagination.onLoadMore();
  });

  await waitFor(() => expect(result.current.items).toHaveLength(expected));
};

describe("getNextPageParam", () => {
  test("berhenti tepat di totalPage", () => {
    expect(getNextPageParam({ totalPage: 3 }, [], 2)).toBe(3);
    expect(getNextPageParam({ totalPage: 3 }, [], 3)).toBeUndefined();
  });

  test("halaman 404 (totalPage 0) menghentikan akumulasi", () => {
    expect(getNextPageParam({ totalPage: 0 }, [], 4)).toBeUndefined();
  });
});

describe("useListQuery — enabled", () => {
  test.each([
    ["desktop", true],
    ["mobile", false],
  ])(
    "enabled=false di %s: nol permintaan; true: berjalan",
    async (_name, isDesktop) => {
      const off = onServer(3);
      const offRender = onRender(isDesktop, off, onParams(), undefined, false);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(off.requests).toEqual([]);
      expect(offRender.result.current.items).toBeUndefined();
      offRender.unmount();
      onRestoreViewport();

      const on = onServer(3);
      const onRendered = onRender(isDesktop, on, onParams(), undefined, true);

      await waitFor(() =>
        expect(onRendered.result.current.items).toBeDefined(),
      );
      expect(on.requests.length).toBeGreaterThan(0);
    },
  );

  test("enabled berbalik false -> true menembak permintaan pertama", async () => {
    const server = onServer(3);
    const flag = { value: false };
    const viewport = onStubViewport(true);
    onRestoreViewport = viewport.onRestore;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const hook = renderHook(
      (enabled: boolean) =>
        useListQuery({
          queryKey: ["uji-balik"],
          fetchPage: server.fetchPage,
          params: onParams(),
          enabled,
        }),
      {
        initialProps: flag.value,
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.requests).toEqual([]);

    hook.rerender(true);

    await waitFor(() => expect(hook.result.current.items).toBeDefined());
    expect(server.requests.length).toBeGreaterThan(0);
  });
});

describe("useListQuery — mobile/tablet (infinite)", () => {
  test("menumpuk halaman dan berhenti di totalPage", async () => {
    const server = onServer(5);
    const { result } = onRender(false, server);

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await onLoadMore(result, 4);
    await onLoadMore(result, 5);

    expect(codes(result.current.items)).toEqual([
      "row-1",
      "row-2",
      "row-3",
      "row-4",
      "row-5",
    ]);
    expect(result.current.pagination).toMatchObject({
      mode: "more",
      isMoreAvailable: false,
      totalData: 5,
    });

    act(() => {
      const { pagination } = result.current;
      if (pagination.mode === "more") pagination.onLoadMore();
    });
    expect(server.requests).toHaveLength(3);
  });

  test("mengabaikan ?page= dari URL dan selalu mulai dari halaman 1", async () => {
    const server = onServer(5);
    const { result } = onRender(false, server, onParams({ page: 3 }));

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    expect(server.requests).toEqual(["page=1&limit=2"]);
  });

  test("ganti filter mengulang dari halaman 1, tanpa sisa daftar lama", async () => {
    const server = onServer(5);
    const { result, rerender } = onRender(false, server);

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await onLoadMore(result, 4);

    rerender(onParams({ search: "budi" }));

    await waitFor(() =>
      expect(codes(result.current.items)).toEqual(["budi-1", "budi-2"]),
    );
    expect(server.requests.at(-1)).toBe("page=1&limit=2&filter=budi");
  });

  test("galat halaman berikutnya tidak menelan daftar yang sudah ada", async () => {
    const server = onServer(5, 2);
    const { result } = onRender(false, server);

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => {
      const { pagination } = result.current;
      if (pagination.mode === "more") pagination.onLoadMore();
    });

    await waitFor(() =>
      expect(result.current.pagination).toMatchObject({
        isLoadMoreError: true,
      }),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(2);
  });
});

describe("useListQuery — desktop (berhalaman)", () => {
  test("mengambil halaman dari URL, tanpa permintaan infinite", async () => {
    const server = onServer(5);
    const { result } = onRender(true, server, onParams({ page: 2 }));

    await waitFor(() =>
      expect(codes(result.current.items)).toEqual(["row-3", "row-4"]),
    );
    expect(server.requests).toEqual(["page=2&limit=2"]);
    expect(result.current.pagination).toMatchObject({
      mode: "pages",
      page: 2,
      totalPage: 3,
    });
  });

  test("resize melewati lg berpindah mode tanpa mencampur data", async () => {
    const server = onServer(5);
    const { result, viewport } = onRender(true, server, onParams({ page: 2 }));

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => viewport.onResize(false));

    await waitFor(() =>
      expect(codes(result.current.items)).toEqual(["row-1", "row-2"]),
    );
    expect(result.current.pagination.mode).toBe("more");

    act(() => viewport.onResize(true));

    expect(codes(result.current.items)).toEqual(["row-3", "row-4"]);
    expect(result.current.pagination.mode).toBe("pages");
    expect(server.requests).toEqual(["page=2&limit=2", "page=1&limit=2"]);
  });
});

describe("useListQuery — refetchInterval", () => {
  test("membaca ulang halaman berkala di desktop", async () => {
    const server = onServer(5);
    onRender(true, server, onParams(), 40);

    await waitFor(() => expect(server.requests.length).toBeGreaterThan(2));
    expect(new Set(server.requests)).toEqual(new Set(["page=1&limit=2"]));
  });

  test("membaca ulang halaman yang sudah dimuat di HP", async () => {
    const server = onServer(5);
    onRender(false, server, onParams(), 40);

    await waitFor(() => expect(server.requests.length).toBeGreaterThan(2));
  });

  test("tanpa refetchInterval tidak membaca ulang", async () => {
    const server = onServer(5);
    onRender(true, server);

    await waitFor(() => expect(server.requests).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(server.requests).toHaveLength(1);
  });
});
