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

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import {
  galeriKeys,
  useDeleteGaleri,
  useGaleriList,
  useSaveGaleri,
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

type Call = { url: string; init?: RequestInit };

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;
  const calls: Call[] = [];

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });

    return Promise.resolve(handler(String(input)));
  }) as typeof fetch;

  return {
    calls,
    onRestore: () => {
      globalThis.fetch = original;
    },
  };
};

describe("useGaleriList", () => {
  test("cari jadi filter, filter badan pelayanan jadi bapelId", async () => {
    const stub = onStubFetch(() =>
      Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Album",
        totalData: 0,
        totalPage: 0,
        data: [],
      }),
    );

    const { result } = renderHook(
      () =>
        useGaleriList(
          onParams({ search: "retret", apiFilters: { bapelId: "2" } }),
        ),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    stub.onRestore();

    expect(stub.calls[0].url).toBe(
      "/api/v1/gallery?page=1&limit=10&filter=retret&bapelId=2",
    );
  });
});

describe("simpan dan hapus", () => {
  const onRun = async (
    run: () => { mutateAsync: () => Promise<unknown> },
    queryClient = onNewClient(),
  ) => {
    const stub = onStubFetch(() =>
      Response.json({
        status: 200,
        message: "OK",
        data: { code: "ALBM_0002-0001" },
      }),
    );
    const { result } = renderHook(run, { wrapper: onWrapper(queryClient) });

    await result.current.mutateAsync();
    stub.onRestore();

    return stub.calls;
  };

  test("tambah = POST multipart tanpa Content-Type JSON", async () => {
    const body = new FormData();
    const calls = await onRun(() => {
      const save = useSaveGaleri();

      return { mutateAsync: () => save.mutateAsync(body) };
    });

    expect(calls[0].url).toBe("/api/v1/gallery");
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[0].init?.body).toBe(body);
    expect(new Headers(calls[0].init?.headers).get("content-type")).toBeNull();
  });

  test("ubah = PUT ke kode album; simpan dan hapus meng-invalidate daftar + detail", async () => {
    const queryClient = onNewClient();
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    const calls = await onRun(() => {
      const save = useSaveGaleri("ALBM_0002-0001");

      return { mutateAsync: () => save.mutateAsync(new FormData()) };
    }, queryClient);

    expect(calls[0].url).toBe("/api/v1/gallery/ALBM_0002-0001");
    expect(calls[0].init?.method).toBe("PUT");

    await onRun(() => {
      const remove = useDeleteGaleri("ALBM_0002-0001");

      return { mutateAsync: () => remove.mutateAsync() };
    }, queryClient);

    const expected = [galeriKeys.lists(), galeriKeys.detail("ALBM_0002-0001")];

    expect(invalidated).toEqual([...expected, ...expected]);
  });
});
