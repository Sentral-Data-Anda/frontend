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

import {
  accountKeys,
  useAccountChildren,
  useAccountList,
  useSaveAccount,
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

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

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

describe("useAccountList", () => {
  test("filter tipe dan status jadi type/isActive, status bawaan tidak dikirim", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;
      return EMPTY_LIST;
    });

    renderHook(
      () =>
        useAccountList(
          onParams({
            search: "kas",
            status: "aktif",
            filters: { tipe: "ASSET", aktif: "false" },
            apiFilters: { type: "ASSET", isActive: "false" },
          }),
        ),
      { wrapper: onWrapper(new QueryClient()) },
    );

    await waitFor(() => expect(requested).not.toBe(""));
    const query = new URL(requested, "http://x").searchParams;

    expect(query.get("filter")).toBe("kas");
    expect(query.get("type")).toBe("ASSET");
    expect(query.get("isActive")).toBe("false");
    expect(query.get("status")).toBeNull();
    onRestore();
  });
});

describe("useAccountChildren", () => {
  test("menanyakan anak dari induknya; tanpa induk tidak menembak server", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;
      return EMPTY_LIST;
    });

    const { rerender } = renderHook(
      ({ id }: { id?: number }) => useAccountChildren(id),
      { wrapper: onWrapper(new QueryClient()), initialProps: {} },
    );

    expect(requested).toBe("");

    rerender({ id: 4 });

    await waitFor(() => expect(requested).not.toBe(""));
    expect(requested).toContain("parentAccountId=4");
    onRestore();
  });
});

describe("useSaveAccount", () => {
  test("invalidate daftar akun dan ddl account, bukan ddl lain", async () => {
    const onRestore = onStubFetch(() =>
      Response.json({ status: 201, message: "ok", data: { code: "1-100" } }),
    );
    const queryClient = new QueryClient();
    const keys = [
      accountKeys.lists(),
      accountKeys.children(1),
      ddlKeys.list("account"),
      ddlKeys.list("account?type=ASSET"),
      ddlKeys.list("supplier"),
    ];
    for (const key of keys) queryClient.setQueryData(key, { data: [] });

    const { result } = renderHook(() => useSaveAccount(), {
      wrapper: onWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({
        code: "1-100",
        name: "Kas",
        type: "ASSET",
        parentAccountId: null,
        isActive: true,
      }),
    );

    expect(
      keys.map((key) => queryClient.getQueryState(key)?.isInvalidated),
    ).toEqual([true, true, true, true, false]);
    onRestore();
  });
});
