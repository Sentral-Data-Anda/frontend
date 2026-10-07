import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import {
  useDeleteHoliday,
  useHolidayDetail,
  useSaveHoliday,
} from "./hari-libur/api";
import type { HolidayPayload } from "./hari-libur/types";
import {
  useDeactivateUser,
  useResetUser,
  useRestoreUser,
  useSaveUser,
  useUserDetail,
} from "./user/api";
import type { UserPayload } from "./user/types";

/**
 * Pasangan perilaku untuk `tests/path-encoding.test.ts`: yang di sana pin
 * TEKS, yang di sini MENJALANKAN hook-nya dan melihat URL yang benar-benar
 * dikirim `fetch` (pedoman §7.1). Satu helper yang dilewati di satu situs
 * tetap merah di sini.
 *
 * Instance tersulitnya, bukan yang pertama: `reset` dan `restore` menaruh
 * kuncinya di segmen TERAKHIR sesudah dua segmen tetap, jadi `../../` dari
 * sana mendarat di koleksi lain — dan `useDeactivateUser` adalah DELETE.
 */

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

const USER_PAYLOAD: UserPayload = { jemaatId: 1, roleUserId: 1 };

const HOLIDAY_PAYLOAD: HolidayPayload = {
  date: "2026-12-25",
  name: "Natal",
  type: "NASIONAL",
  isRecurring: true,
};

/** Keluarga kunci jahat, dan ketiganya kunci yang bisa DIKETIK di address bar. */
const NASTY = [
  "../bapel/BPL-0001",
  "..%2Fbapel%2FBPL-0001",
  "../../user/reset/USR-0001",
];

const expectOneSegment = (url: string, base: string) => {
  expect(url.startsWith(`${base}/`)).toBe(true);
  // Nol garis miring sesudah basisnya: tanpa `/`, `..` tidak bisa menaik.
  expect(url.slice(`${base}/`.length)).not.toContain("/");
};

describe.each(NASTY)("kunci %p disandikan", (key) => {
  const encoded = encodeURIComponent(key);

  test("GET detail user", async () => {
    const calls = onSpyFetch();

    renderHook(() => useUserDetail(key), { wrapper });

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].url).toBe(`/api/v1/user/${encoded}`);
    expectOneSegment(calls[0].url, "/api/v1/user");
  });

  test("PUT user", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveUser(key), { wrapper });

    result.current.mutate(USER_PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({ url: `/api/v1/user/${encoded}`, method: "PUT" });
  });

  test("DELETE user", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useDeactivateUser(key), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/user/${encoded}`,
      method: "DELETE",
    });
  });

  test("PUT reset user", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useResetUser(key), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/user/reset/${encoded}`,
      method: "PUT",
    });
    expectOneSegment(calls[0].url, "/api/v1/user/reset");
  });

  test("PUT restore user", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useRestoreUser(key), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/user/restore/${encoded}`,
      method: "PUT",
    });
    expectOneSegment(calls[0].url, "/api/v1/user/restore");
  });

  test("GET detail hari libur", async () => {
    const calls = onSpyFetch();

    renderHook(() => useHolidayDetail(key), { wrapper });

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].url).toBe(`/api/v1/hari-libur/${encoded}`);
    expectOneSegment(calls[0].url, "/api/v1/hari-libur");
  });

  test("PUT hari libur", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveHoliday(key), { wrapper });

    result.current.mutate(HOLIDAY_PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/hari-libur/${encoded}`,
      method: "PUT",
    });
  });

  test("DELETE hari libur", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useDeleteHoliday(key), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      url: `/api/v1/hari-libur/${encoded}`,
      method: "DELETE",
    });
  });
});

describe("tanpa kunci tetap menuju koleksi", () => {
  test("POST user", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveUser(), { wrapper });

    result.current.mutate(USER_PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({ url: "/api/v1/user", method: "POST" });
  });

  test("POST hari libur", async () => {
    const calls = onSpyFetch();
    const { result } = renderHook(() => useSaveHoliday(), { wrapper });

    result.current.mutate(HOLIDAY_PAYLOAD);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({ url: "/api/v1/hari-libur", method: "POST" });
  });
});
