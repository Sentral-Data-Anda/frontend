import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { ListState } from "@/hooks/use-list-params";
import type { ApiListResponse } from "@/types/api";

import { useListExport } from "./use-list-export";

afterEach(cleanup);

type Row = { code: string };

const onParams = (next: Partial<ListState> = {}): ListState => ({
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

/** Server dengan `total` baris, membalas 100 baris per halaman. */
const onServer = (total: number) => {
  const requests: string[] = [];
  const totalPage = Math.max(1, Math.ceil(total / 100));

  const fetchPage = async (apiQuery: string): Promise<ApiListResponse<Row>> => {
    requests.push(apiQuery);

    const page = Number(new URLSearchParams(apiQuery).get("page"));
    const start = (page - 1) * 100;

    return {
      status: 200,
      message: "ok",
      totalData: total,
      totalPage,
      data: Array.from(
        { length: Math.min(100, total - start) },
        (_, index) => ({
          code: `K-${start + index + 1}`,
        }),
      ),
    };
  };

  return { fetchPage, requests };
};

/** `window.print` tidak ada di DOM uji, dan memanggilnya akan melempar. */
const onStubPrint = () => {
  const calls = { count: 0 };

  Object.defineProperty(window, "print", {
    configurable: true,
    writable: true,
    value: () => {
      calls.count += 1;
    },
  });

  return calls;
};

describe("useListExport", () => {
  test("mengambil setiap halaman, bukan hanya yang terlihat di layar", async () => {
    const print = onStubPrint();
    const server = onServer(250);
    const { result } = renderHook(() =>
      useListExport<Row>({ fetchPage: server.fetchPage, params: onParams() }),
    );

    await act(() => result.current.onPrint());

    await waitFor(() => expect(result.current.rows).not.toBeNull());

    expect(result.current.rows).toHaveLength(250);
    expect(server.requests).toHaveLength(3);
    // Halaman penuh, bukan `limit` yang sedang dipakai layar.
    expect(server.requests[0]).toContain("limit=100");
    expect(print.count).toBe(1);
  });

  test("membawa pencarian dan filter yang sedang aktif", async () => {
    onStubPrint();
    const server = onServer(1);
    const { result } = renderHook(() =>
      useListExport<Row>({
        fetchPage: server.fetchPage,
        params: onParams({
          search: "toko",
          status: "PAID",
          apiFilters: { startDate: "2026-03-01" },
        }),
      }),
    );

    await act(() => result.current.onPrint());

    await waitFor(() => expect(result.current.rows).not.toBeNull());

    expect(server.requests[0]).toContain("filter=toko");
    expect(server.requests[0]).toContain("status=PAID");
    expect(server.requests[0]).toContain("startDate=2026-03-01");
  });

  test("kegagalan dilaporkan dan tidak membuka dialog cetak", async () => {
    const print = onStubPrint();
    const { result } = renderHook(() =>
      useListExport<Row>({
        fetchPage: () => Promise.reject(new Error("putus")),
        params: onParams(),
      }),
    );

    await act(() => result.current.onPrint());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.rows).toBeNull();
    expect(print.count).toBe(0);
  });
});
