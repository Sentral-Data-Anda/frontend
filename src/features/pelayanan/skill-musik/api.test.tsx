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
  skillMusikKeys,
  useDeleteSkillMusik,
  useSaveSkillMusik,
  useSkillMusikList,
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

describe("useSkillMusikList", () => {
  test("cari jadi filter; status di URL tidak diteruskan", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Skill Musik",
        totalData: 1,
        totalPage: 1,
        data: [{ id: 2, name: "Gitar" }],
      });
    });

    const { result } = renderHook(
      () => useSkillMusikList(onParams({ search: "git", status: "aktif" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe("/api/v1/musik-skill?page=1&limit=10&filter=git");
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Skill Musik Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useSkillMusikList(onParams({ search: "zzz" })),
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
    skillMusikKeys.lists(),
    skillMusikKeys.detail("5"),
    ddlKeys.all,
    ["daftar-pelayan", "list"],
    ["jadwal-pelayan"],
  ];

  const onInvalidated = async (
    run: (id: string) => { mutateAsync: () => Promise<unknown> },
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
        data: { id: 5, name: "Biola" },
      }),
    );

    const { result } = renderHook(() => run("5"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return invalidated;
  };

  test("simpan meng-invalidate daftar, detail, semua ddl, pelayan, dan jadwal", async () => {
    const invalidated = await onInvalidated((id) => {
      const save = useSaveSkillMusik(id);

      return { mutateAsync: () => save.mutateAsync({ name: "Biola" }) };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate kunci yang sama", async () => {
    const invalidated = await onInvalidated((id) => {
      const remove = useDeleteSkillMusik(id);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});
