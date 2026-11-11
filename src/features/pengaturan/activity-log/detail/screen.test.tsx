import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({ isCanView: true }),
}));

const { ActivityLogDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const respond = (status: number, body: unknown) => {
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    )) as unknown as typeof fetch;
};

const onRender = (id: string) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActivityLogDetailScreen id={id} />
    </QueryClientProvider>,
  );

describe("detail log aktivitas", () => {
  test("404: keadaan tidak ditemukan dengan tautan kembali ke daftar", async () => {
    respond(404, { status: 404, error: "Activity Log Tidak Ditemukan" });
    onRender("999");

    expect(await screen.findByText("Catatan tidak ditemukan")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke log aktivitas" })
        .getAttribute("href"),
    ).toBe("/settings/activity-log");
  });

  test("judul aksi + data, dan hanya field yang berubah", async () => {
    respond(200, {
      status: 200,
      message: "Berhasil Mendapatkan Activity Log",
      data: {
        id: 12,
        action: "update",
        model: "Jemaat",
        recordId: "4",
        oldData: { id: 4, code: "JMT-0004", phone: "0812", name: "Debora" },
        newData: { phone: "0813", name: "Debora", updatedBy: 2 },
        createdAt: "2026-09-26T03:00:00.000Z",
        user: { name: "Admin Sistem", code: "U-0001" },
      },
    });
    onRender("12");

    expect(
      await screen.findByRole("heading", { name: "Ubah Jemaat" }),
    ).toBeTruthy();
    expect(screen.getByText("phone")).toBeTruthy();
    expect(screen.queryByText("name")).toBeNull();
    expect(screen.queryByText("updatedBy")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Jemaat" }).getAttribute("href"),
    ).toBe("/kejemaatan/daftar-jemaat?search=JMT-0004");
  });

  test("ringkasan menyebut alamat, perangkat, endpoint, dan permintaan", async () => {
    respond(200, {
      status: 200,
      message: "Berhasil Mendapatkan Activity Log",
      data: {
        id: 13,
        action: "create",
        model: "LoginAttempt",
        recordId: "9",
        oldData: null,
        newData: { username: "debora", success: true },
        createdAt: "2026-09-26T03:00:00.000Z",
        user: { name: "Debora", code: "U-0002" },
        ipAddress: "203.0.113.7",
        userAgent: "Mozilla/5.0 Test",
        method: "POST",
        path: "/api/v1/auth/login",
        requestId: "req-abc-123",
      },
    });
    onRender("13");

    expect(await screen.findByText("203.0.113.7")).toBeTruthy();
    expect(screen.getByText("Mozilla/5.0 Test")).toBeTruthy();
    expect(screen.getByText("POST /api/v1/auth/login")).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Semua catatan dari permintaan req-abc-123",
        })
        .getAttribute("href"),
    ).toBe("/settings/activity-log?permintaan=req-abc-123");
  });

  test("catatan Lihat: bukan perubahan data, dan menaut ke catatan yang dibuka", async () => {
    respond(200, {
      status: 200,
      message: "Berhasil Mendapatkan Activity Log",
      data: {
        id: 14,
        action: "view",
        model: "ActivityLog",
        recordId: "13",
        oldData: null,
        newData: null,
        createdAt: "2026-09-26T03:00:00.000Z",
        user: { name: "Admin Sistem", code: "U-0001" },
      },
    });
    onRender("14");

    expect(
      await screen.findByRole("heading", { name: "Lihat Log Aktivitas" }),
    ).toBeTruthy();
    expect(screen.getByText("Bukan perubahan data")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Log Aktivitas" }).getAttribute("href"),
    ).toBe("/settings/activity-log/13");
  });
});
