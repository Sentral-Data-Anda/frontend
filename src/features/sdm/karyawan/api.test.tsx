import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useDeleteKaryawan, useKaryawanDetail, useSaveKaryawan } from "./api";
import type { KaryawanPayload } from "./types";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onSpyFetch = () => {
  const calls: { url: string; method: string }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), method: init?.method ?? "GET" });

    return Response.json({ status: 200, message: "OK", data: null });
  }) as typeof fetch;

  return calls;
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const PAYLOAD: KaryawanPayload = {
  jemaatId: null,
  name: "Ruth Siahaan",
  phone: "081234567899",
  email: null,
  address: null,
  position: "Organis",
  joinDate: "2026-03-02",
  resignDate: null,
  status: "ACTIVE",
};

/**
 * `code` datang dari segmen rute, jadi siapa pun bisa mengetiknya di address
 * bar. Tanpa penyandian, `../` mengubah endpoint yang BENAR-BENAR dipanggil —
 * termasuk DELETE yang mendarat di sumber daya lain. Server tetap menegakkan
 * izinnya, jadi bukan eskalasi hak; tapi aplikasi mengirim permintaan yang
 * pemakainya tidak maksudkan.
 *
 * Penjaganya MENJALANKAN hook-nya dan melihat URL yang dikirim `fetch`, bukan
 * membaca `api.ts` (pedoman §7.1): satu helper yang dilewati di satu situs
 * tetap merah di sini.
 */
describe("kunci path disandikan di setiap situs", () => {
  const NASTY = "../payroll/PYR-0001";
  const ENCODED = encodeURIComponent(NASTY);

  test("GET detail menyandikan kodenya", async () => {
    const calls = onSpyFetch();

    renderHook(() => useKaryawanDetail(NASTY), { wrapper });

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].url).toBe(`/api/v1/karyawan/${ENCODED}`);
    // Nol garis miring sesudah segmen kodenya: tanpa `/`, `..` tidak menaik.
    expect(calls[0].url.slice("/api/v1/karyawan/".length)).not.toContain("/");
  });

  test("PUT menyandikan kodenya", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveKaryawan(NASTY), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/karyawan/${ENCODED}`,
      method: "PUT",
    });
  });

  test("DELETE menyandikan kodenya", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useDeleteKaryawan(NASTY), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/karyawan/${ENCODED}`,
      method: "DELETE",
    });
  });

  test("POST tanpa kode tetap menuju koleksi", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveKaryawan(), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({ url: "/api/v1/karyawan", method: "POST" });
  });
});
