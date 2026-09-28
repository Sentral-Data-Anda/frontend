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
  satuanKeys,
  useDeleteSatuan,
  useSaveSatuan,
  useSatuanList,
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

const ROW = { publicId: "p-4", code: "UNT-0004", name: "Botol" };

describe("useSatuanList", () => {
  test("search jadi filter, kunci diawali unit", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Satuan",
        totalData: 1,
        totalPage: 1,
        data: [ROW],
      });
    });

    const { result } = renderHook(
      () => useSatuanList(onParams({ search: "bot" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe("/api/v1/unit?page=1&limit=10&filter=bot");
    expect(satuanKeys.lists()[0]).toBe("unit");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Satuan Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useSatuanList(onParams({ search: "zzz" })),
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
      satuanKeys.lists(),
      ddlKeys.list("unit"),
      ddlKeys.list("unit?limit=20"),
      ddlKeys.list("type-item"),
      ["asset", "list"],
    ];
    for (const key of seeded) queryClient.setQueryData(key, { data: [] });

    const onRestore = onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: ROW }),
    );

    const { result } = renderHook(() => run("UNT-0004"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return seeded
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => key.join(" "));
  };

  const EXPECTED = ["unit list", "ddl unit", "ddl unit?limit=20"];

  test("simpan meng-invalidate daftar dan semua ddl unit saja", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveSatuan(code);

      return { mutateAsync: () => save.mutateAsync({ name: "Botol" }) };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteSatuan(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
