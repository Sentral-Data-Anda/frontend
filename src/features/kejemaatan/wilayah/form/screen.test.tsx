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

import { WILAYAH_LIST_PATH } from "../model";
import type { Wilayah } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/wilayah/baru",
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

const { WilayahFormScreen } = await import("./screen");

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
        <WilayahFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah wilayah")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "ZC-0005");

    expect(screen.getByText("Tidak bisa mengubah wilayah")).toBeTruthy();
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "ZC-0005");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "ZC-0005");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: Wilayah = {
  id: 5,
  publicId: "a",
  code: "ZC-0005",
  name: "Wilayah V",
  isActive: false,
  createdBy: "Admin",
  createdAt: "2026-01-05T02:00:00.000Z",
  updatedBy: null,
  updatedAt: "2026-01-05T02:00:00.000Z",
};

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/zone-church/ZC-0005" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Wilayah",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/zone-church/ZC-0005" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Wilayah",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/zone-church" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Wilayah",
          data: { ...DETAIL, id: 6, code: "ZC-0006", name: "Wilayah Timur" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/zone-church/ZC-0005") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Wilayah Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "ZC-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Wilayah V",
    ),
  );
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("simpan", () => {
  test("nama kosong: konfirmasi tidak muncul, fokus ke nama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT dengan status tersimpan, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${WILAYAH_LIST_PATH}?status=nonaktif&page=2`;
    window.sessionStorage.setItem(`list-return:${WILAYAH_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data wilayah ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      { method: "PUT", body: { name: "Wilayah V", isActive: false } },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${WILAYAH_LIST_PATH}`),
    ).toBe("ZC-0005");
  });

  test("nama ganda (409 be-sada): galat di field nama", async () => {
    onMockApi({ save: { status: 409, error: "Wilayah Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Nama ini sudah dipakai wilayah lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat 500: pesan di FormAlert, fokus ke Simpan", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
  });
});

describe("tambah", () => {
  test("Ya mengirim POST berstatus Aktif, kembali ke daftar dan sorot baris baru", async () => {
    const listUrl = `${WILAYAH_LIST_PATH}?search=timur`;
    window.sessionStorage.setItem(`list-return:${WILAYAH_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: " Wilayah  Timur " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menyimpan data wilayah ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      { method: "POST", body: { name: "Wilayah Timur", isActive: true } },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${WILAYAH_LIST_PATH}`),
    ).toBe("ZC-0006");
  });
});

describe("kode tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "ZC-9999");

    await waitFor(() =>
      expect(screen.getByText("Data wilayah tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});

describe("hapus", () => {
  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data wilayah ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([WILAYAH_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada di FormAlert, tetap di form", async () => {
    const message =
      "Wilayah Tidak Dapat Dihapus Karena Masih Digunakan oleh Keluarga. Nonaktifkan Wilayah Ini Jika Tidak Ingin Dipakai Lagi";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Wilayah belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
