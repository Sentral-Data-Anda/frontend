import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import {
  useBirthdayReport,
  useIncompleteReport,
  useLastEducationReport,
} from "./api";

afterEach(cleanup);

const onRender = <T,>(hook: () => T) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;
  const requested: string[] = [];

  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));
    return Promise.resolve(handler(String(input)));
  }) as typeof fetch;

  return {
    requested,
    onRestore: () => {
      globalThis.fetch = original;
    },
  };
};

const ok = (data: unknown) =>
  Response.json({ status: 200, message: "Berhasil Mendapatkan Report", data });

describe("useLastEducationReport", () => {
  test("berlabel pendidikan dan urut jumlah terbesar", async () => {
    const stub = onStubFetch(() =>
      ok([
        { lastEducation: "SMA", Count: 3 },
        { lastEducation: "TIDAK_SEKOLAH", Count: 9 },
      ]),
    );

    const { result } = onRender(() => useLastEducationReport());

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(stub.requested).toEqual(["/api/v1/report/jemaat/last-education"]);
    expect(result.current.data?.map((share) => share.label)).toEqual([
      "Tidak sekolah",
      "SMA",
    ]);

    stub.onRestore();
  });
});

describe("useIncompleteReport", () => {
  test("objek, bukan daftar", async () => {
    const stub = onStubFetch(() =>
      ok({ total: 10, birthDate: 2, lastEducation: 1, profession: 0 }),
    );

    const { result } = onRender(() => useIncompleteReport());

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.birthDate).toBe(2);

    stub.onRestore();
  });

  test("500 menjadi galat dengan pesan be-sada", async () => {
    const stub = onStubFetch(() =>
      Response.json(
        { status: 500, error: "Kesalahan server." },
        { status: 500 },
      ),
    );

    const { result } = onRender(() => useIncompleteReport());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("Kesalahan server.");

    stub.onRestore();
  });
});

describe("useBirthdayReport", () => {
  test("menembak bulan terpilih; 404 be-sada menjadi daftar kosong", async () => {
    const stub = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Report Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = onRender(() => useBirthdayReport(2));

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(stub.requested).toEqual(["/api/v1/report/jemaat/birth/2"]);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([]);

    stub.onRestore();
  });
});
