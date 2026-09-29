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
  offeringTypeKeys,
  useDeleteOfferingType,
  useOfferingTypeList,
  useSaveOfferingType,
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

const ROW = {
  id: 1,
  publicId: "tps-0001",
  code: "TPS-0001",
  name: "Kolekte",
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId: 16,
  account: null,
};

describe("useOfferingTypeList", () => {
  test("status jadi isActive, kunci diawali offering-type", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "OK",
        totalData: 1,
        totalPage: 1,
        data: [ROW],
      });
    });

    const { result } = renderHook(
      () =>
        useOfferingTypeList(onParams({ search: "kol", status: "nonaktif" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe(
      "/api/v1/type-persembahan?page=1&limit=10&filter=kol&isActive=false",
    );
    expect(offeringTypeKeys.lists()[0]).toBe("offering-type");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Tipe Persembahan Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useOfferingTypeList(onParams({ search: "zzz" })),
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
      offeringTypeKeys.lists(),
      ddlKeys.list("tipe-persembahan"),
      ddlKeys.list("tipe-persembahan?limit=20"),
      ddlKeys.list("account"),
      ["persembahan", "list"],
    ];
    for (const key of seeded) queryClient.setQueryData(key, { data: [] });

    const onRestore = onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: ROW }),
    );

    const { result } = renderHook(() => run("TPS-0001"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return seeded
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => key.join(" "));
  };

  const EXPECTED = [
    "offering-type list",
    "ddl tipe-persembahan",
    "ddl tipe-persembahan?limit=20",
  ];

  test("simpan meng-invalidate daftar dan ddl tipe persembahan saja", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveOfferingType(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            name: "Kolekte",
            accountId: 16,
            hasPeriod: false,
            requiresJemaat: false,
            isActive: true,
          }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteOfferingType(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
