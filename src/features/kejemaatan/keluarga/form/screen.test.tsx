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

import { KELUARGA_LIST_PATH } from "../model";
import type { Keluarga } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/keluarga/baru",
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

const { KeluargaFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <KeluargaFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah keluarga")).toBeTruthy();
    expect(screen.queryByLabelText("Nama keluarga")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "KK-0007");

    expect(screen.getByText("Tidak bisa mengubah keluarga")).toBeTruthy();
    expect(screen.queryByLabelText("Nama keluarga")).toBeNull();
  });

  test("form tambah tidak punya Hapus walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama keluarga")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah tanpa DELETE: tidak ada Hapus", () => {
    onRenderForm(["VIEW", "UPDATE"], "KK-0007");

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

const DETAIL: Keluarga = {
  id: 7,
  publicId: "10000000-0000-4000-8000-000000000007",
  code: "KK-0007",
  name: "Keluarga Saragih",
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Cijerah 12",
  zoneChurchId: null,
  worshipsHere: true,
  zoneChurch: null,
  _count: { members: 0 },
};

const onMockApi = (failure?: {
  method: "PUT" | "DELETE";
  status: number;
  error: string;
}) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/keluarga/KK-0007" && method !== "GET") {
      calls.push(method);

      if (failure?.method === method) {
        return Response.json(failure, { status: failure.status });
      }

      return Response.json({ status: 200, message: "Beres", data: DETAIL });
    }
    if (url === "/api/v1/keluarga/KK-0007") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({ status: 200, message: "OK", data: [] });
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "KK-0007");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama keluarga") as HTMLInputElement).value,
    ).toBe("Keluarga Saragih"),
  );
};

describe("simpan", () => {
  test("form tidak valid: konfirmasi tidak muncul, fokus ke field galat pertama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("kembali ke daftar membawa filter dan menandai baris", async () => {
    const listUrl = `${KELUARGA_LIST_PATH}?search=sar&page=2`;
    window.sessionStorage.setItem(`list-return:${KELUARGA_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText(
      "Apakah Anda ingin menyimpan perubahan data keluarga ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["PUT"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${KELUARGA_LIST_PATH}`),
    ).toBe("KK-0007");
  });

  test("wilayah ditolak server: galat dan fokus mendarat di field wilayah", async () => {
    onMockApi({
      method: "PUT",
      status: 404,
      error: "Wilayah Gereja Tidak Ditemukan",
    });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await screen.findByText(
      "Wilayah ini sudah tidak ada; pilih ulang dari daftar.",
    );
    expect(
      document.getElementById("zoneChurchId")?.getAttribute("aria-invalid"),
    ).toBe("true");
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("zoneChurchId"),
    );
    expect(replaced).toEqual([]);
  });

  test("galat 500: FormAlert tampil, fokus ke Simpan, tetap di form", async () => {
    onMockApi({ method: "PUT", status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Kesalahan server.")).toBeTruthy();
    expect(
      screen.getByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
    expect(replaced).toEqual([]);
  });
});

describe("hapus", () => {
  test("Hapus bertanya dulu; Ya memanggil DELETE lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    const buttons = screen.getAllByRole("button");
    expect(buttons.at(-3)?.textContent).toBe("Hapus");

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await screen.findByText("Apakah Anda ingin menghapus data keluarga ini?");
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([KELUARGA_LIST_PATH]));
    expect(calls).toEqual(["DELETE"]);
  });

  test("masih punya anggota: pesan be-sada tampil, tetap di form", async () => {
    const error =
      "Keluarga Tidak Dapat Dihapus Karena Masih Memiliki 3 Anggota Aktif";
    onMockApi({ method: "DELETE", status: 400, error });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(error)).toBeTruthy();
    expect(screen.getByText("Keluarga belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
