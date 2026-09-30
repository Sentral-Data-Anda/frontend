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

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { todayJakarta } from "@/lib/date";

import { onStubViewport } from "../../../../tests/viewport";

import {
  ASSET_ACCOUNT_DDL,
  useAssetAccounts,
  useTransferAction,
  useTransferList,
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

type Call = { url: string; method: string; body: string | null };

const onStubFetch = (calls: Call[]) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body === undefined ? null : String(init.body),
    });

    return Promise.resolve(
      Response.json({ status: 200, message: "OK", totalPage: 0, data: [] }),
    );
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

describe("useTransferList", () => {
  test("bawaan menyaring bulan berjalan; status dan cari diteruskan", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls);

    renderHook(
      () =>
        useTransferList(
          onParams({ search: "STR", status: "PAID", filters: {} }),
        ),
      { wrapper: onWrapper(new QueryClient()) },
    );

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    const query = new URL(calls[0].url, "http://x").searchParams;

    expect(calls[0].url.startsWith("/api/v1/setoran?")).toBe(true);
    expect(query.get("filter")).toBe("STR");
    expect(query.get("status")).toBe("PAID");
    expect(query.get("startDate")).toBe(`${todayJakarta().slice(0, 7)}-01`);
    onRestore();
  });
});

describe("useAssetAccounts", () => {
  test("ddl akun disaring type=ASSET, satu kunci dengan AccountField", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls);

    renderHook(() => useAssetAccounts(), {
      wrapper: onWrapper(new QueryClient()),
    });

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));

    expect(ASSET_ACCOUNT_DDL).toBe("account?type=ASSET");
    expect(calls[0].url).toBe("/api/v1/ddl/account?type=ASSET");
    onRestore();
  });
});

describe("useTransferAction", () => {
  test("setor: PUT tanpa badan, lalu jurnal ikut dibatalkan cache-nya", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls);
    const queryClient = new QueryClient();
    const invalidated: unknown[] = [];

    queryClient.setQueryData(["journal", "list"], { data: [] });
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "invalidate") {
        invalidated.push(event.query.queryKey);
      }
    });

    const { result } = renderHook(() => useTransferAction("STR-2026-0001"), {
      wrapper: onWrapper(queryClient),
    });

    await result.current.mutateAsync({ action: "setor" });

    expect(calls[0]).toEqual({
      url: "/api/v1/setoran/STR-2026-0001/setor",
      method: "PUT",
      body: null,
    });
    await waitFor(() =>
      expect(invalidated).toContainEqual(["journal", "list"]),
    );
    onRestore();
  });

  test("batal: alasan dikirim di badan", async () => {
    const calls: Call[] = [];
    const onRestore = onStubFetch(calls);

    const { result } = renderHook(() => useTransferAction("STR-2026-0001"), {
      wrapper: onWrapper(new QueryClient()),
    });

    await result.current.mutateAsync({
      action: "batal",
      reason: "Salah catat",
    });

    expect(calls[0].url).toBe("/api/v1/setoran/STR-2026-0001/batal");
    expect(JSON.parse(String(calls[0].body))).toEqual({
      reason: "Salah catat",
    });
    onRestore();
  });
});

describe("kunci ddl", () => {
  test("memakai kunci bersama, bukan kunci sendiri", () => {
    expect(ddlKeys.list(ASSET_ACCOUNT_DDL)).toEqual([
      "ddl",
      "account?type=ASSET",
    ]);
  });
});
