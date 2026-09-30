import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import { reportKeys, useLedger, useNeraca, useSurplusDefisit } from "./api";

afterEach(cleanup);

const originalFetch = globalThis.fetch;

const onRender = <T,>(hook: () => T, response: () => Response) => {
  const requested: string[] = [];

  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));

    return Promise.resolve(response());
  }) as typeof fetch;

  const view = renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        {children}
      </QueryClientProvider>
    ),
  });

  return {
    ...view,
    requested,
    onRestore: () => {
      globalThis.fetch = originalFetch;
    },
  };
};

const ok = (data: unknown) =>
  Response.json({ status: 200, message: "Berhasil", data });

const ZERO_NERACA = {
  date: "2026-03-31T00:00:00.000Z",
  assets: [],
  liabilities: [],
  equity: [],
  totals: { assets: "0", liabilities: "0", equity: "0", surplus: "0" },
  balanced: true,
  isOpeningEntered: false,
};

describe("kunci query", () => {
  test("ketiganya berakar di financial-report", () => {
    expect(reportKeys.neraca("2026-03-31")[0]).toBe("financial-report");
    expect(reportKeys.surplus("2026-03-01", "2026-03-31")[0]).toBe(
      "financial-report",
    );
    expect(reportKeys.ledger("code=1-100")[0]).toBe("financial-report");
  });
});

describe("useNeraca", () => {
  test("mengirim tanggal posisi dan membaca hasil nol sebagai data", async () => {
    const view = onRender(
      () => useNeraca("2026-03-31"),
      () => ok(ZERO_NERACA),
    );

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(view.requested).toEqual([
      "/api/v1/laporan-keuangan/neraca?date=2026-03-31",
    ]);
    expect(view.result.current.data?.totals.assets).toBe("0");
    expect(view.result.current.error).toBeNull();
    view.onRestore();
  });

  test("tanpa tanggal tidak memanggil server", async () => {
    const view = onRender(
      () => useNeraca(""),
      () => ok(ZERO_NERACA),
    );

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(view.requested).toEqual([]);
    view.onRestore();
  });
});

describe("useSurplusDefisit", () => {
  test("mengirim rentang from dan to", async () => {
    const view = onRender(
      () => useSurplusDefisit("2026-03-01", "2026-03-31"),
      () =>
        ok({
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-31T00:00:00.000Z",
          income: [],
          expense: [],
          totals: { income: "0", expense: "0", surplus: "0" },
        }),
    );

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(view.requested).toEqual([
      "/api/v1/laporan-keuangan/surplus-defisit?from=2026-03-01&to=2026-03-31",
    ]);
    view.onRestore();
  });
});

describe("useLedger", () => {
  test("berkunci kode akun, bukan id, dan membawa paginasi", async () => {
    const view = onRender(
      () =>
        useLedger({
          code: "1-100",
          from: "2026-03-01",
          to: "2026-03-31",
          page: 2,
          limit: 25,
        }),
      () =>
        ok({
          account: { code: "1-100", name: "Kas", type: "ASSET" },
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-31T00:00:00.000Z",
          openingBalance: "0",
          rows: [],
          closingBalance: "0",
          totalData: 0,
          totalPage: 0,
        }),
    );

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(view.requested[0]).toBe(
      "/api/v1/laporan-keuangan/buku-besar?code=1-100&from=2026-03-01&to=2026-03-31&page=2&limit=25",
    );
    view.onRestore();
  });

  test("akun yang tidak ada tetap galat 404, tidak diterjemahkan jadi kosong", async () => {
    const view = onRender(
      () =>
        useLedger({
          code: "9-999",
          from: "2026-03-01",
          to: "2026-03-31",
          page: 1,
          limit: 10,
        }),
      () =>
        Response.json(
          { status: 404, error: "Akun Tidak Ditemukan" },
          { status: 404 },
        ),
    );

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    const error = view.result.current.error;

    expect(error).toBeInstanceOf(FetchError);
    expect((error as FetchError).status).toBe(404);
    view.onRestore();
  });

  test("tanpa akun tidak memanggil server", async () => {
    const view = onRender(
      () =>
        useLedger({
          code: "",
          from: "2026-03-01",
          to: "2026-03-31",
          page: 1,
          limit: 10,
        }),
      () => ok({}),
    );

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(view.requested).toEqual([]);
    view.onRestore();
  });
});
