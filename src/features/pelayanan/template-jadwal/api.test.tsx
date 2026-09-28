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
  templateJadwalKeys,
  useDeleteTemplateJadwal,
  useSaveTemplateJadwal,
  useTemplateJadwalList,
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
      message: "Berhasil Mendapatkan Semua Template Jadwal",
      totalData: 0,
      totalPage: 0,
      data: [],
    });
  });

  const { result } = renderHook(() => useTemplateJadwalList(params), {
    wrapper: onWrapper(onNewClient()),
  });

  await waitFor(() => expect(result.current.items).toBeDefined());
  onRestore();

  return requested;
};

describe("useTemplateJadwalList", () => {
  test("cari jadi filter, filter badan pelayanan jadi bapelId", async () => {
    expect(await onRequestedUrl(onParams({ search: "minggu" }))).toBe(
      "/api/v1/template-pelayan?page=1&limit=10&filter=minggu",
    );
    expect(
      await onRequestedUrl(
        onParams({ filters: { bapel: "2" }, apiFilters: { bapelId: "2" } }),
      ),
    ).toBe("/api/v1/template-pelayan?page=1&limit=10&bapelId=2");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Template Jadwal Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useTemplateJadwalList(onParams({ search: "zzz" })),
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
    templateJadwalKeys.lists(),
    templateJadwalKeys.detail("TMP_JDL_0001-0001"),
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
        data: { code: "TMP_JDL_0001-0001", name: "Ibadah Minggu Pagi" },
      }),
    );

    const { result } = renderHook(() => run("TMP_JDL_0001-0001"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return invalidated;
  };

  test("simpan meng-invalidate daftar, detail, dan semua ddl", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveTemplateJadwal(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            bapelId: 1,
            name: "Ibadah Minggu Pagi",
            startTime: "07:30",
            endTime: "10:00",
            detail: [{ order: 1, rolePelayanId: 1 }],
          }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate ketiga kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteTemplateJadwal(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
