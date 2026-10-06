import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import {
  useDeleteKomponenPayroll,
  useDeletePenetapan,
  useKomponenPayrollDetail,
  usePenetapanDetail,
  useSaveKomponenPayroll,
  useSavePenetapan,
} from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onStubFetch = (urls: string[]) => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    urls.push(String(input));

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: {} }),
    );
  }) as unknown as typeof fetch;
};

// Kunci datang dari parameter rute, jadi bisa diketik di bilah alamat. Tanpa
// penyandian, `../` memindahkan permintaan ke sumber daya lain — termasuk
// DELETE.
const TRAVERSAL = "../../karyawan/kkp-1";

describe("kunci rute disandikan sebelum masuk URL", () => {
  test("katalog: baca, tulis, dan hapus", async () => {
    const urls: string[] = [];
    onStubFetch(urls);

    const { result } = renderHook(
      () => ({
        detail: useKomponenPayrollDetail(TRAVERSAL),
        save: useSaveKomponenPayroll(TRAVERSAL),
        remove: useDeleteKomponenPayroll(TRAVERSAL),
      }),
      { wrapper: onWrapper() },
    );

    await waitFor(() => expect(urls.length).toBe(1));

    await act(async () => {
      await result.current.save.mutateAsync({
        name: "x",
        type: "EARNING",
        calculationType: "FIXED",
        defaultValue: 1,
        isTaxable: true,
        isActive: true,
        accountId: null,
      });
    });
    await act(async () => {
      await result.current.remove.mutateAsync();
    });

    for (const url of urls) {
      expect(url).toContain("/komponen-payroll/..%2F..%2Fkaryawan%2Fkkp-1");
      expect(url).not.toContain("../");
    }
    expect(urls.length).toBe(3);
  });

  test("penetapan: baca, tulis, dan hapus", async () => {
    const urls: string[] = [];
    onStubFetch(urls);

    const { result } = renderHook(
      () => ({
        detail: usePenetapanDetail(TRAVERSAL),
        save: useSavePenetapan(TRAVERSAL),
        remove: useDeletePenetapan(TRAVERSAL),
      }),
      { wrapper: onWrapper() },
    );

    await waitFor(() => expect(urls.length).toBe(1));

    await act(async () => {
      await result.current.save.mutateAsync({
        karyawanId: 1,
        payrollComponentId: 1,
        value: null,
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      });
    });
    await act(async () => {
      await result.current.remove.mutateAsync();
    });

    for (const url of urls) {
      expect(url).toContain(
        "/komponen-payroll/karyawan/..%2F..%2Fkaryawan%2Fkkp-1",
      );
      expect(url).not.toContain("../");
    }
    expect(urls.length).toBe(3);
  });
});
