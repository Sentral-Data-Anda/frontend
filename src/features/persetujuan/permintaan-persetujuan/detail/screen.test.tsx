import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { DETAIL_ID, approvalDetail } from "../fixtures";
import { PERMINTAAN_LIST_PATH } from "../model";
import type { ApprovalDetail } from "../types";

const access = { isCanUpdate: true };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => `${PERMINTAAN_LIST_PATH}/${DETAIL_ID}`,
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: true,
    isCanCreate: false,
    isCanUpdate: access.isCanUpdate,
    isCanDelete: false,
  }),
}));

const { PermintaanDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
  access.isCanUpdate = true;
  window.sessionStorage.clear();
});

type Call = { method: string; url: string };

const onMockApi = (
  detail: ApprovalDetail | null,
  action?: { status: number; body: Record<string, unknown> },
) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ method, url });

    if (method === "PUT") {
      return Response.json(action?.body ?? {}, {
        status: action?.status ?? 200,
      });
    }

    return detail
      ? Response.json({ status: 200, message: "ok", data: detail })
      : Response.json(
          { status: 404, error: "Permintaan Persetujuan Tidak Ditemukan" },
          { status: 404 },
        );
  }) as typeof fetch;

  return calls;
};

const onRender = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PermintaanDetailScreen id={DETAIL_ID} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

const onLoaded = () => screen.findByText("PST-2026-0002");

describe("gerbang aksi", () => {
  test("canSign + UPDATE: Setujui dan Tolak, tanpa Tarik", async () => {
    onMockApi(approvalDetail());
    onRender();
    await onLoaded();

    expect(screen.getByRole("button", { name: "Setujui" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Tolak" }).getAttribute("href"),
    ).toBe(`${PERMINTAAN_LIST_PATH}/${DETAIL_ID}/tolak`);
    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
    expect(
      document.querySelector('[aria-current="step"]')?.textContent,
    ).toContain("Ketua · Majelis Jemaat");
  });

  test("canSign tanpa UPDATE: tanpa panel aksi", async () => {
    access.isCanUpdate = false;
    onMockApi(approvalDetail());
    onRender();
    await onLoaded();

    expect(screen.queryByRole("region", { name: "Tindakan" })).toBeNull();
  });

  test("admin dengan canSign false: tidak ada tombol, tidak ada panel", async () => {
    onMockApi(approvalDetail({ canSign: false }));
    onRender();
    await onLoaded();

    expect(screen.queryByRole("button", { name: "Setujui" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Tindakan" })).toBeNull();
  });

  test("canWithdraw + UPDATE: hanya Tarik", async () => {
    onMockApi(approvalDetail({ canSign: false, canWithdraw: true }));
    onRender();
    await onLoaded();

    expect(
      screen.getByRole("button", { name: "Tarik pengajuan" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Setujui" })).toBeNull();
  });
});

describe("linimasa", () => {
  test("tahap berjalan ditandai aria-current, alasan tampil", async () => {
    onMockApi(
      approvalDetail({
        status: "REJECTED",
        currentOrder: 2,
        canSign: false,
        steps: approvalDetail().steps.map((step) =>
          step.order === 2
            ? { ...step, status: "REJECTED", note: "Nota belum lengkap" }
            : step,
        ),
      }),
    );
    onRender();
    await onLoaded();

    expect(screen.getByText("Nota belum lengkap")).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')).toBeNull();
  });
});

describe("setujui", () => {
  test("konfirmasi → PUT setujui → kembali ke daftar", async () => {
    const calls = onMockApi(approvalDetail(), {
      status: 200,
      body: { status: 200, message: "Berhasil Menyetujui Permintaan" },
    });
    onRender();
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Setujui" }));
    expect(
      screen.getByText(
        "Setujui Kas keluar · CAS-2026-0014 senilai Rp 4.500.000? Tanda tangan tidak bisa dibatalkan.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([PERMINTAAN_LIST_PATH]));
    expect(
      calls.some(
        (call) => call.method === "PUT" && call.url.endsWith("/setujui"),
      ),
    ).toBe(true);
  });

  test("gagal: pesan server di FormAlert dan detail diambil ulang", async () => {
    const calls = onMockApi(approvalDetail(), {
      status: 400,
      body: { status: 400, error: "Permintaan Persetujuan Ini Sudah Selesai" },
    });
    onRender();
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Setujui" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Permintaan Persetujuan Ini Sudah Selesai"),
    ).toBeTruthy();
    await waitFor(() =>
      expect(calls.filter((call) => call.method === "GET")).toHaveLength(2),
    );
    expect(replaced).toEqual([]);
  });
});

describe("tarik", () => {
  test("konfirmasi → PUT tarik → kembali ke daftar", async () => {
    const calls = onMockApi(
      approvalDetail({ canSign: false, canWithdraw: true }),
      {
        status: 200,
        body: { status: 200, message: "Berhasil Menarik Permintaan" },
      },
    );
    onRender();
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Tarik pengajuan" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([PERMINTAAN_LIST_PATH]));
    expect(calls.some((call) => call.url.endsWith("/tarik"))).toBe(true);
  });
});

test("404: keadaan tidak ditemukan", async () => {
  onMockApi(null);
  onRender();

  expect(await screen.findByText("Permintaan tidak ditemukan")).toBeTruthy();
});
