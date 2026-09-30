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
  expenseKeys,
  useExpenseAction,
  useExpenseList,
  useSaveExpense,
} from "./api";

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

const EMPTY_LIST = Response.json({
  status: 200,
  totalData: 0,
  totalPage: 0,
  data: [],
});

const OK = () => Response.json({ status: 200, message: "ok", data: {} });

describe("useExpenseList", () => {
  test("pencarian jadi filter dan tab Menunggu jadi isPendingApproval", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return EMPTY_LIST;
    });

    renderHook(
      () =>
        useExpenseList(
          onParams({
            search: "PSN-2026-0012",
            status: "PENDING_APPROVAL",
            filters: { bulan: "semua", badan: "2" },
          }),
        ),
      { wrapper: onWrapper(new QueryClient()) },
    );

    await waitFor(() => expect(requested).not.toBe(""));
    const query = new URL(requested, "http://x").searchParams;

    expect(query.get("filter")).toBe("PSN-2026-0012");
    expect(query.get("status")).toBe("DRAFT");
    expect(query.get("isPendingApproval")).toBe("1");
    expect(query.get("bapelId")).toBe("2");
    onRestore();
  });
});

describe("useSaveExpense", () => {
  test("tambah memakai POST, ubah memakai PUT ke publicId", async () => {
    const calls: { url: string; method?: string }[] = [];
    const onRestore = onStubFetch((url, init) => {
      calls.push({ url, method: init?.method });

      return Response.json({
        status: 200,
        message: "ok",
        data: { publicId: "doc-7" },
      });
    });

    const created = renderHook(() => useSaveExpense(), {
      wrapper: onWrapper(new QueryClient()),
    });
    await act(() => created.result.current.mutateAsync(new FormData()));

    const updated = renderHook(() => useSaveExpense("doc-7"), {
      wrapper: onWrapper(new QueryClient()),
    });
    await act(() => updated.result.current.mutateAsync(new FormData()));

    expect(calls).toEqual([
      { url: "/api/v1/kas-keluar", method: "POST" },
      { url: "/api/v1/kas-keluar/doc-7", method: "PUT" },
    ]);
    onRestore();
  });
});

describe("useExpenseAction", () => {
  const onInvalidated = async (
    action: "pengajuan" | "tarik" | "bayar" | "batal",
  ) => {
    const onRestore = onStubFetch(OK);
    const queryClient = new QueryClient();
    const keys = [expenseKeys.lists(), ["persetujuan"], ["journal"]];
    for (const key of keys) queryClient.setQueryData(key, { data: [] });

    const { result } = renderHook(() => useExpenseAction("doc-7"), {
      wrapper: onWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({ action, cancelReason: "alasan" }),
    );
    onRestore();

    return keys.map((key) => queryClient.getQueryState(key)?.isInvalidated);
  };

  test("ajukan menyegarkan persetujuan, bukan jurnal", async () => {
    expect(await onInvalidated("pengajuan")).toEqual([true, true, false]);
  });

  test("bayar menyegarkan jurnal, bukan persetujuan", async () => {
    expect(await onInvalidated("bayar")).toEqual([true, false, true]);
  });

  test("batalkan menyegarkan jurnal", async () => {
    expect(await onInvalidated("batal")).toEqual([true, false, true]);
  });

  test("alasan pembatalan dikirim di badan, aksi lain tanpa badan", async () => {
    const calls: { url: string; method?: string; body?: unknown }[] = [];
    const onRestore = onStubFetch((url, init) => {
      calls.push({ url, method: init?.method, body: init?.body });

      return OK();
    });

    const { result } = renderHook(() => useExpenseAction("doc-7"), {
      wrapper: onWrapper(new QueryClient()),
    });

    await act(() =>
      result.current.mutateAsync({
        action: "batal",
        cancelReason: "nota ganda",
      }),
    );
    await act(() => result.current.mutateAsync({ action: "bayar" }));

    expect(calls[0]).toEqual({
      url: "/api/v1/kas-keluar/doc-7/batal",
      method: "PUT",
      body: JSON.stringify({ cancelReason: "nota ganda" }),
    });
    expect(calls[1]).toEqual({
      url: "/api/v1/kas-keluar/doc-7/bayar",
      method: "PUT",
      body: undefined,
    });
    onRestore();
  });
});
