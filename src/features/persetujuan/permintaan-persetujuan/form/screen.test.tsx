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
  usePathname: () => `${PERMINTAAN_LIST_PATH}/${DETAIL_ID}/tolak`,
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

const { PermintaanRejectScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
  access.isCanUpdate = true;
  window.sessionStorage.clear();
});

const onMockApi = (
  detail: ApprovalDetail | null,
  reject?: { status: number; body: Record<string, unknown> },
) => {
  const bodies: unknown[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PUT") {
      bodies.push(JSON.parse(String(init.body)));

      return Response.json(reject?.body ?? {}, {
        status: reject?.status ?? 200,
      });
    }

    return detail
      ? Response.json({ status: 200, message: "ok", data: detail })
      : Response.json(
          { status: 404, error: "Permintaan Persetujuan Tidak Ditemukan" },
          { status: 404 },
        );
  }) as typeof fetch;

  return bodies;
};

const onRender = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PermintaanRejectScreen id={DETAIL_ID} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

const onSubmit = async (note: string) => {
  fireEvent.change(await screen.findByLabelText("Alasan penolakan"), {
    target: { value: note },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tolak permintaan" }));
};

describe("gerbang", () => {
  test("canSign false: NoFormAccess", async () => {
    onMockApi(approvalDetail({ canSign: false }));
    onRender();

    expect(
      await screen.findByText(
        "Permintaan ini tidak sedang menunggu tanda tangan Anda.",
      ),
    ).toBeTruthy();
  });

  test("tanpa UPDATE: NoFormAccess tanpa memuat detail", () => {
    access.isCanUpdate = false;
    onMockApi(approvalDetail());
    onRender();

    expect(screen.getByText("Tidak bisa menolak permintaan ini")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat permintaan persetujuan."),
    ).toBeTruthy();
  });

  test("404: FormNotFound", async () => {
    onMockApi(null);
    onRender();

    expect(
      await screen.findByText("Data permintaan persetujuan tidak ditemukan"),
    ).toBeTruthy();
  });
});

describe("tolak", () => {
  test("alasan kosong: galat di field, tanpa dialog", async () => {
    const bodies = onMockApi(approvalDetail());
    onRender();

    await onSubmit("   ");

    expect(
      await screen.findByText(
        "Isi alasan penolakan supaya pengaju tahu apa yang harus diperbaiki.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Konfirmasi Tindakan")).toBeNull();
    expect(bodies).toEqual([]);
  });

  test("konfirmasi preset → PUT dengan alasan ter-trim → ke daftar", async () => {
    const bodies = onMockApi(approvalDetail(), {
      status: 200,
      body: { status: 200, message: "Berhasil Menolak Permintaan" },
    });
    onRender();

    await onSubmit("  Nota belum dilampirkan.  ");
    expect(
      await screen.findByText(
        "Tolak Kas keluar · CAS-2026-0014? Permintaan berakhir di tahap ini dan pengaju perlu mengajukan ulang.",
      ),
    ).toBeTruthy();
    const yes = screen.getByRole("button", { name: "Ya" });

    expect(yes.className).toContain("text-destructive");
    fireEvent.click(yes);

    await waitFor(() => expect(replaced).toEqual([PERMINTAAN_LIST_PATH]));
    expect(bodies).toEqual([{ note: "Nota belum dilampirkan." }]);
  });

  test("issues note dari server mendarat di field", async () => {
    onMockApi(approvalDetail(), {
      status: 400,
      body: {
        status: 400,
        error: "Alasan Penolakan tidak boleh lebih dari 250 karakter",
        issues: [
          {
            path: "note",
            message: "Alasan Penolakan tidak boleh lebih dari 250 karakter",
          },
        ],
      },
    });
    onRender();

    await onSubmit("Alasan");
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    const field = await screen.findByLabelText("Alasan penolakan");
    await waitFor(() =>
      expect(field.getAttribute("aria-invalid")).toBe("true"),
    );
    expect(replaced).toEqual([]);
  });

  test("400 teks: FormAlert, isian tetap", async () => {
    onMockApi(approvalDetail(), {
      status: 400,
      body: { status: 400, error: "Tahapan Persetujuan Ini Sudah Diproses" },
    });
    onRender();

    await onSubmit("Alasan tetap");
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Tahapan Persetujuan Ini Sudah Diproses"),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Alasan penolakan") as HTMLTextAreaElement).value,
    ).toBe("Alasan tetap");
  });
});
