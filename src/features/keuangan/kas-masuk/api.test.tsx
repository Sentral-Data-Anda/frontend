import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
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

import { receiptKeys, useReceiptAction, useReceiptList } from "./api";

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

const onStubFetch = (
  handler: (url: string, init?: RequestInit) => Response,
) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const EMPTY_LIST = Response.json({
  status: 200,
  totalData: 0,
  totalPage: 0,
  data: [],
});

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("useReceiptList", () => {
  test("pencarian dikirim sebagai filter dan bulan jadi rentang tanggal", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return EMPTY_LIST;
    });

    renderHook(
      () =>
        useReceiptList(
          onParams({
            search: "BA-07/IX/2026",
            status: "PAID",
            filters: { bulan: "2026-07" },
          }),
        ),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(requested).not.toBe(""));
    onRestore();

    expect(requested).toContain("filter=BA-07%2FIX%2F2026");
    expect(requested).toContain("status=PAID");
    expect(requested).toContain("startDate=2026-07-01");
    expect(requested).toContain("endDate=2026-07-31");
  });
});

describe("useReceiptAction", () => {
  const onRunAction = async (
    action: "terima" | "batal" | "hapus",
    cancelReason?: string,
  ) => {
    const queryClient = onNewClient();
    const invalidated: string[] = [];

    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "invalidate") {
        invalidated.push(String(event.query.queryKey[0]));
      }
    });
    await queryClient.prefetchQuery({
      queryKey: ["journal"],
      queryFn: () => ({ data: [] }),
    });
    await queryClient.prefetchQuery({
      queryKey: receiptKeys.all,
      queryFn: () => ({ data: [] }),
    });

    const calls: { url: string; init?: RequestInit }[] = [];
    const onRestore = onStubFetch((url, init) => {
      calls.push({ url, init });

      return Response.json({ status: 200, message: "ok", data: {} });
    });
    const hook = renderHook(() => useReceiptAction("bkm-0001"), {
      wrapper: onWrapper(queryClient),
    });

    await act(async () => {
      await hook.result.current.mutateAsync({ action, cancelReason });
    });
    onRestore();

    return { calls, invalidated };
  };

  test("terima memanggil /terima dan meng-invalidate jurnal", async () => {
    const { calls, invalidated } = await onRunAction("terima");

    expect(calls[0]?.url).toContain("/kas-masuk/bkm-0001/terima");
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(invalidated).toContain("journal");
    expect(invalidated).toContain("cash-receipt");
  });

  test("batalkan mengirim alasannya", async () => {
    const { calls, invalidated } = await onRunAction("batal", "Salah akun");

    expect(calls[0]?.url).toContain("/kas-masuk/bkm-0001/batal");
    expect(String(calls[0]?.init?.body)).toContain("Salah akun");
    expect(invalidated).toContain("journal");
  });

  test("hapus tidak menyentuh jurnal", async () => {
    const { calls, invalidated } = await onRunAction("hapus");

    expect(calls[0]?.init?.method).toBe("DELETE");
    expect(invalidated).not.toContain("journal");
    expect(invalidated).toContain("cash-receipt");
  });
});
