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

import { TIPE_IBADAH_LIST_PATH } from "../model";
import type { TipeIbadah } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/peribadahan/tipe-ibadah/baru",
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

const { TipeIbadahFormScreen } = await import("./screen");

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
        <TipeIbadahFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah tipe ibadah")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data tipe ibadah."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Tipe Ibadah" })
        .getAttribute("href"),
    ).toBe(TIPE_IBADAH_LIST_PATH);
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "TYP_IBD-0005");

    expect(screen.getByText("Tidak bisa mengubah tipe ibadah")).toBeTruthy();
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "TYP_IBD-0005");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "TYP_IBD-0005");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: TipeIbadah = {
  code: "TYP_IBD-0005",
  name: "Ibadah Padang",
  isActive: false,
};

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/type-ibadah/TYP_IBD-0005" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Tipe Ibadah",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/type-ibadah/TYP_IBD-0005" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Tipe Ibadah",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/type-ibadah" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Tipe Ibadah",
          data: { ...DETAIL, code: "TYP_IBD-0006", name: "Ibadah Syukur" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/type-ibadah/TYP_IBD-0005") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Tipe Ibadah Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "TYP_IBD-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Ibadah Padang",
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
    const listUrl = `${TIPE_IBADAH_LIST_PATH}?status=nonaktif&page=2`;
    window.sessionStorage.setItem(
      `list-return:${TIPE_IBADAH_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data tipe ibadah ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      { method: "PUT", body: { name: "Ibadah Padang", isActive: false } },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_IBADAH_LIST_PATH}`),
    ).toBe("TYP_IBD-0005");
  });

  test("nama ganda (409 be-sada): galat di field nama", async () => {
    onMockApi({ save: { status: 409, error: "Tipe Ibadah Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText(
        "Tipe ibadah dengan nama ini sudah ada. Pakai nama lain.",
      ),
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
    const listUrl = `${TIPE_IBADAH_LIST_PATH}?search=syukur`;
    window.sessionStorage.setItem(
      `list-return:${TIPE_IBADAH_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  Ibadah   Syukur " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menyimpan data tipe ibadah ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      { method: "POST", body: { name: "Ibadah Syukur", isActive: true } },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_IBADAH_LIST_PATH}`),
    ).toBe("TYP_IBD-0006");
  });
});

describe("kode tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "TYP_IBD-9999");

    await waitFor(() =>
      expect(screen.getByText("Data tipe ibadah tidak ditemukan")).toBeTruthy(),
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
        screen.getByText("Apakah Anda ingin menghapus data tipe ibadah ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([TIPE_IBADAH_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada di FormAlert, tetap di form", async () => {
    const message =
      "Tipe Ibadah Tidak Dapat Dihapus Karena Masih Digunakan oleh Data Ibadah. Nonaktifkan Tipe Ibadah Ini Jika Tidak Ingin Dipakai Lagi";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Tipe ibadah belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
