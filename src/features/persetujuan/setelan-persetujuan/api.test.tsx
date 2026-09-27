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

import { useJabatanOptions, useSetelanList } from "./api";

let viewport: ReturnType<typeof onStubViewport>;
const originalFetch = globalThis.fetch;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

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

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const onStubFetch = (handler: (url: string) => Response) => {
  const requested: string[] = [];

  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));
    return Promise.resolve(handler(String(input)));
  }) as typeof fetch;

  return requested;
};

const notFound = (error: string) => () =>
  Response.json({ status: 404, error }, { status: 404 });

describe("useSetelanList", () => {
  test("jenis jadi documentType, status jadi isActive", async () => {
    const requested = onStubFetch(notFound("Alur Persetujuan Tidak Ditemukan"));

    const { result } = renderHook(
      () =>
        useSetelanList(
          onParams({
            status: "false",
            filters: { jenis: "CASH_EXPENSE" },
            apiFilters: { documentType: "CASH_EXPENSE" },
          }),
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(requested[0]).toBe(
      "/api/v1/setelan-persetujuan?page=1&limit=10&documentType=CASH_EXPENSE&isActive=false",
    );
  });

  test("404 dari be-sada menjadi daftar kosong yang sukses", async () => {
    onStubFetch(notFound("Alur Persetujuan Tidak Ditemukan"));

    const { result } = renderHook(() => useSetelanList(onParams({})), {
      wrapper,
    });

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
  });
});

describe("useJabatanOptions", () => {
  test("BP terisi dikirim sebagai bapelId; value = label = nama", async () => {
    const requested = onStubFetch(() =>
      Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Jabatan",
        data: [{ name: "Ketua" }, { name: "Sekretaris" }],
      }),
    );

    const { result } = renderHook(() => useJabatanOptions("2"), { wrapper });

    await waitFor(() => expect(result.current.options).toHaveLength(2));

    expect(requested[0]).toBe("/api/v1/ddl/jabatan-jemaat?bapelId=2");
    expect(result.current.options[0]).toEqual({
      value: "Ketua",
      label: "Ketua",
    });
  });

  test("BP pengaju: tanpa bapelId; 404 jadi opsi kosong", async () => {
    const requested = onStubFetch(notFound("Jabatan Tidak Ditemukan"));

    const { result } = renderHook(() => useJabatanOptions(""), { wrapper });

    await waitFor(() => expect(requested).toHaveLength(1));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requested[0]).toBe("/api/v1/ddl/jabatan-jemaat");
    expect(result.current.options).toEqual([]);
  });

  test("tahap role tidak mengambil jabatan", () => {
    const requested = onStubFetch(notFound("Jabatan Tidak Ditemukan"));

    renderHook(() => useJabatanOptions("", false), { wrapper });

    expect(requested).toHaveLength(0);
  });
});
