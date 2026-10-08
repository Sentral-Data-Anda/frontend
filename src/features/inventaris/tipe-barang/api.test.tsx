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

import { onStubViewport } from "../../../../tests/viewport";

import {
  tipeBarangKeys,
  useDeleteTipeBarang,
  useSaveTipeBarang,
  useTipeBarangList,
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

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const ROW = { publicId: "p-4", code: "TYP_ITM-0004", name: "Kendaraan" };

describe("useTipeBarangList", () => {
  test("search jadi filter, kunci diawali type-item", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Tipe Barang",
        totalData: 1,
        totalPage: 1,
        data: [ROW],
      });
    });

    const { result } = renderHook(
      () => useTipeBarangList(onParams({ search: "kend" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe("/api/v1/type-item?page=1&limit=10&filter=kend");
    expect(tipeBarangKeys.lists()[0]).toBe("type-item");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Tipe Barang Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useTipeBarangList(onParams({ search: "zzz" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});

describe("invalidasi sesudah simpan dan hapus", () => {
  const onInvalidated = async (
    run: (code: string) => { mutateAsync: () => Promise<unknown> },
  ) => {
    const queryClient = onNewClient();
    const seeded = [
      tipeBarangKeys.lists(),
      ddlKeys.list("type-item"),
      ddlKeys.list("type-item?limit=20"),
      ddlKeys.list("unit"),
      ["asset", "list"],
    ];
    for (const key of seeded) queryClient.setQueryData(key, { data: [] });

    const onRestore = onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: ROW }),
    );

    const { result } = renderHook(() => run("TYP_ITM-0004"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return seeded
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => key.join(" "));
  };

  const EXPECTED = [
    "type-item list",
    "ddl type-item",
    "ddl type-item?limit=20",
  ];

  test("simpan meng-invalidate daftar dan semua ddl type-item saja", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveTipeBarang(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            name: "Kendaraan",
            assetAccountId: null,
            depreciationExpenseAccountId: null,
            accumulatedDepreciationAccountId: null,
            inventoryExpenseAccountId: null,
          }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteTipeBarang(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
