import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/pengaturan/activity-log",
  useSearchParams: () => new URLSearchParams(),
}));

const { ActivityLogListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("daftar log aktivitas", () => {
  test("hanya-baca: tanpa tombol tambah dan tanpa aksi ubah; baris membuka detail", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        Response.json({
          status: 200,
          message: "Berhasil Mendapatkan Semua Activity Log",
          totalData: 1,
          totalPage: 1,
          data: [
            {
              id: 80,
              action: "update",
              model: "Jemaat",
              recordId: "4",
              kind: "hapus",
              createdAt: "2026-09-26T03:00:00.000Z",
              user: null,
            },
          ],
        }),
      )) as unknown as typeof fetch;

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ActivityLogListScreen />
      </QueryClientProvider>,
    );

    const row = await screen.findByRole("link", {
      name: "Lihat Hapus Jemaat #4",
    });

    expect(row.getAttribute("href")).toBe("/pengaturan/activity-log/80");
    expect(screen.getByText(/Sistem/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Tambah/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();
  });
});
