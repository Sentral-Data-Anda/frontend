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
  pendaftaranKeys,
  useCancelPendaftaran,
  useCreatePendaftaran,
  usePendaftaranList,
  useReissueInvoice,
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

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

describe("usePendaftaranList", () => {
  test("cari → filter, event → eventId, status diteruskan", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "OK",
        totalData: 0,
        totalPage: 0,
        data: [],
      });
    });

    const { result } = renderHook(
      () =>
        usePendaftaranList(
          onParams({
            search: "0812",
            status: "EXPIRED",
            apiFilters: { eventId: "2" },
          }),
        ),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe(
      "/api/v1/pendaftaran-event?page=1&limit=10&filter=0812&status=EXPIRED&eventId=2",
    );
  });
});

describe("invalidasi sesudah daftar, batal, buat ulang tagihan", () => {
  const EXPECTED = [
    pendaftaranKeys.all,
    ddlKeys.list("event"),
    ddlKeys.list("event?isOpen=1"),
    ["event", "list"],
  ];

  const onInvalidated = async (
    run: () => { mutateAsync: () => Promise<unknown> },
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
        data: { code: "REG-2026-0015" },
      }),
    );
    const { result } = renderHook(run, { wrapper: onWrapper(queryClient) });

    await result.current.mutateAsync();
    onRestore();

    return invalidated;
  };

  test("ketiga mutasi meng-invalidate pendaftaran, ddl event, dan daftar Event", async () => {
    expect(
      await onInvalidated(() => {
        const create = useCreatePendaftaran();

        return {
          mutateAsync: () => create.mutateAsync({ eventId: 4, jemaatId: 2 }),
        };
      }),
    ).toEqual(EXPECTED);
    expect(
      await onInvalidated(() => useCancelPendaftaran("REG-2026-0008")),
    ).toEqual(EXPECTED);
    expect(
      await onInvalidated(() => useReissueInvoice("REG-2026-0001")),
    ).toEqual(EXPECTED);
  });
});
