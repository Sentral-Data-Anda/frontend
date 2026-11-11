import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ToastHost } from "@/components/common/feedback";

mock.module("@/hooks/use-app-router", () => ({
  useAppRouter: () => ({ replace: () => undefined }),
  useAppPathname: () => "/settings/activity-log",
  useAppSearchParams: () => new URLSearchParams(),
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
        <ToastHost>
          <ActivityLogListScreen />
        </ToastHost>
      </QueryClientProvider>,
    );

    const row = await screen.findByRole("link", {
      name: "Lihat Hapus Jemaat #4",
    });

    expect(row.getAttribute("href")).toBe("/settings/activity-log/80");
    expect(screen.getByText(/Sistem/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Tambah/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /^Ubah/ })).toBeNull();
  });

  const listBody = {
    status: 200,
    message: "Berhasil Mendapatkan Semua Activity Log",
    totalData: 0,
    totalPage: 0,
    data: [],
  };

  const onRender = () =>
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ToastHost>
          <ActivityLogListScreen />
        </ToastHost>
      </QueryClientProvider>,
    );

  test("ekspor meminta CSV dari server dengan filter daftar, bukan halaman", async () => {
    const calls: string[] = [];
    const saved: string[] = [];
    const originalCreate = URL.createObjectURL;

    URL.createObjectURL = (() => "blob:x") as typeof URL.createObjectURL;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = String(input);

      calls.push(url);

      return Promise.resolve(
        url.includes("/export")
          ? new Response("\uFEFFWaktu\r\n", {
              headers: {
                "content-type": "text/csv",
                "content-disposition": 'attachment; filename="log.csv"',
              },
            })
          : Response.json(listBody),
      );
    }) as unknown as typeof fetch;
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      saved.push(this.download);
    };

    try {
      onRender();
      fireEvent.click(
        await screen.findByRole("button", { name: /Ekspor CSV/ }),
      );

      await waitFor(() => expect(saved).toEqual(["log.csv"]));

      const exportCall = calls.find((url) => url.includes("/export")) ?? "";

      expect(exportCall.startsWith("/api/v1/activity-log/export")).toBe(true);
      expect(exportCall).not.toContain("page=");
      expect(exportCall).not.toContain("limit=");
    } finally {
      HTMLAnchorElement.prototype.click = click;
      URL.createObjectURL = originalCreate;
    }
  });

  test("ekspor yang ditolak server menampilkan alasannya", async () => {
    globalThis.fetch = ((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).includes("/export")
          ? Response.json(
              {
                status: 400,
                error:
                  "Hasil ekspor 61.204 baris melebihi batas 50.000. Persempit periode atau filter.",
              },
              { status: 400 },
            )
          : Response.json(listBody),
      )) as unknown as typeof fetch;

    onRender();
    fireEvent.click(await screen.findByRole("button", { name: /Ekspor CSV/ }));

    expect(await screen.findByText(/melebihi batas 50\.000/)).toBeTruthy();
  });
});
