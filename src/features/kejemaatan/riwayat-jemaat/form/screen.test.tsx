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

import type { MenuAction } from "@/types/menu";

import { RIWAYAT_LIST_PATH } from "../model";
import type { RiwayatJemaat } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/riwayat-jemaat/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { RiwayatFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const ID = "0b5f3c2e-7d41-4c6a-9e2f-000000000001";

const DETAIL: RiwayatJemaat = {
  id: ID,
  type: "BAPTIS",
  typeLabel: "Baptis",
  date: "1990-06-17T00:00:00.000Z",
  certificateNumber: "BPT/1990/014",
  place: "GKI Samanhudi",
  jemaat: { code: "JMT-0001", name: "Andreas Sitanggang" },
};

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <RiwayatFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

type Failure = { status: number; error: string };

const onMockApi = (failure?: { save?: Failure; delete?: Failure }) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === `/api/v1/riwayat-jemaat/${ID}` && method !== "GET") {
      calls.push(method);
      const rejected = method === "DELETE" ? failure?.delete : failure?.save;

      if (rejected) return Response.json(rejected, { status: rejected.status });

      return Response.json(
        method === "DELETE"
          ? { status: 200, message: "Berhasil Menghapus Riwayat Jemaat" }
          : {
              status: 200,
              message: "Berhasil Memperbarui Riwayat Jemaat",
              data: { ...DETAIL, publicId: ID },
            },
      );
    }
    if (url === `/api/v1/riwayat-jemaat/${ID}`) {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Data Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[]) => {
  onRenderForm(granted, ID);

  await waitFor(() =>
    expect(
      (screen.getByLabelText(/Nomor surat/) as HTMLInputElement).value,
    ).toBe("BPT/1990/014"),
  );
};

describe("gerbang izin", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa mencatat riwayat")).toBeTruthy();
    expect(screen.queryByLabelText(/Nomor surat/)).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"], ID);

    expect(screen.getByText("Tidak bisa mengubah riwayat")).toBeTruthy();
  });

  test("form tambah tidak pernah punya Hapus", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText(/Nomor surat/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah tanpa DELETE: Hapus tidak dirender", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("simpan", () => {
  test("form kosong: konfirmasi tidak muncul, fokus ke Jemaat", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("jemaatCode"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("409 sekali per jemaat: fokus ke Jenis", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Andreas Sitanggang Sudah Memiliki Riwayat Baptis",
      },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("type"));
    expect(
      screen.getByText(/Sudah Memiliki Riwayat Baptis\. Pilih jenis lain/),
    ).toBeTruthy();
  });

  test("kembali ke daftar membawa filter dan menandai baris", async () => {
    const listUrl = `${RIWAYAT_LIST_PATH}?jenis=BAPTIS&page=2`;
    window.sessionStorage.setItem(`list-return:${RIWAYAT_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["PUT"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${RIWAYAT_LIST_PATH}`),
    ).toBe(ID);
  });
});

describe("hapus", () => {
  test("Hapus bertanya dulu; Ya memanggil DELETE lalu kembali ke daftar", async () => {
    const listUrl = `${RIWAYAT_LIST_PATH}?search=andreas`;
    window.sessionStorage.setItem(`list-return:${RIWAYAT_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menghapus data riwayat jemaat ini?",
        ),
      ).toBeTruthy(),
    );
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["DELETE"]);
  });

  test("hapus gagal: galat tampil di form, tetap di layar", async () => {
    onMockApi({ delete: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(
        screen.getByText("Riwayat belum terhapus. Coba hapus lagi."),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Kesalahan server.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
