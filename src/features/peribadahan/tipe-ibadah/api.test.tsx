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
  tipeIbadahKeys,
  useDeleteTipeIbadah,
  useSaveTipeIbadah,
  useTipeIbadahList,
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

const onRequestedUrl = async (params: ListState) => {
  let requested = "";

  const onRestore = onStubFetch((url) => {
    requested = url;

    return Response.json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Tipe Ibadah",
      totalData: 1,
      totalPage: 1,
      data: [{ code: "TYP_IBD-0001", name: "Ibadah Minggu I", isActive: true }],
    });
  });

  const { result } = renderHook(() => useTipeIbadahList(params), {
    wrapper: onWrapper(onNewClient()),
  });

  await waitFor(() => expect(result.current.items).toBeDefined());
  onRestore();

  return requested;
};

describe("useTipeIbadahList", () => {
  test("search jadi filter; tanpa status tidak mengirim isActive", async () => {
    expect(await onRequestedUrl(onParams({ search: "doa" }))).toBe(
      "/api/v1/type-ibadah?page=1&limit=10&filter=doa",
    );
  });

  test("status URL aktif/nonaktif diteruskan sebagai isActive=true/false", async () => {
    expect(await onRequestedUrl(onParams({ status: "aktif" }))).toBe(
      "/api/v1/type-ibadah?page=1&limit=10&isActive=true",
    );
    expect(await onRequestedUrl(onParams({ status: "nonaktif" }))).toBe(
      "/api/v1/type-ibadah?page=1&limit=10&isActive=false",
    );
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Tipe Ibadah Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useTipeIbadahList(onParams({ search: "zzz" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});

describe("invalidasi sesudah simpan dan hapus", () => {
  const EXPECTED = [
    tipeIbadahKeys.lists(),
    tipeIbadahKeys.detail("TYP_IBD-0004"),
    ddlKeys.list("type-ibadah"),
    ["ibadah", "list"],
  ];

  const onInvalidated = async (
    run: (code: string) => { mutateAsync: () => Promise<unknown> },
  ) => {
    const queryClient = onNewClient();
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    const onRestore = onStubFetch(() =>
      Response.json({
        status: 200,
        message: "OK",
        data: { code: "TYP_IBD-0004", name: "Ibadah Pemuda", isActive: false },
      }),
    );

    const { result } = renderHook(() => run("TYP_IBD-0004"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return invalidated;
  };

  test("simpan meng-invalidate daftar, detail, ddl, dan daftar ibadah", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveTipeIbadah(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({ name: "Ibadah Pemuda", isActive: false }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate keempat kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteTipeIbadah(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
