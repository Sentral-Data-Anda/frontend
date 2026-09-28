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
  daftarPelayanKeys,
  useDaftarPelayanList,
  useDeletePelayan,
  useSavePelayan,
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
      message: "Berhasil Mendapatkan Semua Pelayan",
      totalData: 0,
      totalPage: 1,
      data: [],
    });
  });

  const { result } = renderHook(() => useDaftarPelayanList(params), {
    wrapper: onWrapper(onNewClient()),
  });

  await waitFor(() => expect(result.current.items).toBeDefined());
  onRestore();

  return requested;
};

describe("useDaftarPelayanList", () => {
  test("cari jadi filter; tanpa status tidak mengirim status", async () => {
    expect(await onRequestedUrl(onParams({ search: "efrata" }))).toBe(
      "/api/v1/pelayan?page=1&limit=10&filter=efrata",
    );
  });

  test("status aktif/nonaktif jadi status=true/false", async () => {
    expect(await onRequestedUrl(onParams({ status: "aktif" }))).toBe(
      "/api/v1/pelayan?page=1&limit=10&status=true",
    );
    expect(await onRequestedUrl(onParams({ status: "nonaktif" }))).toBe(
      "/api/v1/pelayan?page=1&limit=10&status=false",
    );
  });

  test("filter badan pelayanan dan tugas jadi bapelId dan roleId", async () => {
    expect(
      await onRequestedUrl(
        onParams({ apiFilters: { bapelId: "2", roleId: "4" } }),
      ),
    ).toBe("/api/v1/pelayan?page=1&limit=10&bapelId=2&roleId=4");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Pelayan Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(() => useDaftarPelayanList(onParams({})), {
      wrapper: onWrapper(onNewClient()),
    });

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});

describe("invalidasi sesudah simpan dan hapus", () => {
  const EXPECTED = [
    daftarPelayanKeys.lists(),
    daftarPelayanKeys.detail("PLYN_0001-0002"),
    ["jadwal-pelayan"],
    ddlKeys.all,
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
        data: { code: "PLYN_0001-0002" },
        futureSlots: [],
      }),
    );

    const { result } = renderHook(() => run("PLYN_0001-0002"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return invalidated;
  };

  test("simpan meng-invalidate daftar, detail, jadwal pelayan, dan ddl", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSavePelayan(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            typePelayan: "INDIVIDUAL",
            bapelId: 1,
            jemaatId: 2,
            name: null,
            phone: null,
            members: [],
            rolePelayan: [2],
            isPemusik: false,
            musikSkill: [],
            status: false,
          }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate keempat kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeletePelayan(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
