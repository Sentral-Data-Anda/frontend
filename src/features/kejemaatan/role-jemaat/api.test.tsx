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

import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import { useRoleJemaatList } from "./api";

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

const onRenderQuery = (params: ListState) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderHook(() => useRoleJemaatList(params), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

describe("useRoleJemaatList", () => {
  test("cari jadi filter, tahun jadi year", async () => {
    let requested = "";

    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Role Jemaat",
        totalData: 1,
        totalPage: 1,
        data: [
          {
            id: 1,
            publicId: "a",
            name: "Ketua",
            startPeriode: "2025-01-01T00:00:00.000Z",
            endPeriode: "2026-12-31T00:00:00.000Z",
            status: true,
            jemaat: { id: 1, code: "JMT-0001", name: "Andreas" },
            bapel: null,
          },
        ],
      });
    });

    const { result } = onRenderQuery(
      onParams({
        search: "ket",
        filters: { tahun: "2025" },
        apiFilters: { year: "2025" },
      }),
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(requested).toBe(
      "/api/v1/role-jemaat?page=1&limit=10&filter=ket&year=2025",
    );
    expect(result.current.items?.[0]?.name).toBe("Ketua");

    onRestore();
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Role Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = onRenderQuery(onParams({}));

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});
