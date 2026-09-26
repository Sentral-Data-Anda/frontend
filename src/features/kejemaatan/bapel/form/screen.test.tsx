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

import { BAPEL_LIST_PATH } from "../model";
import type { BapelDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/bapel/baru",
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

const { BapelFormScreen } = await import("./screen");

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
        <BapelFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah badan pelayanan"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "BPL-0001");

    expect(
      screen.getByText("Tidak bisa mengubah badan pelayanan"),
    ).toBeTruthy();
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "BPL-0001");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "BPL-0001");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: BapelDetail = {
  id: 1,
  publicId: "a",
  code: "BPL-0001",
  name: "Komisi Pemuda",
  rules: [
    {
      id: 1,
      publicId: "r",
      type: "NO_DAY",
      dayOfWeek: 0,
      date: null,
      startTime: null,
      endTime: null,
      weekOfMonth: null,
    },
  ],
};

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/bapel/BPL-0001" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Bapel",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/bapel/BPL-0001" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Bapel",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/bapel/BPL-0001") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({ status: 404, error: "?" }, { status: 404 });
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "BPL-0001");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Komisi Pemuda",
    ),
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

  test("aturan tanpa jenis: fokus ke jenis aturan itu", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Tambah aturan" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("rules.1.type"),
    );
  });

  test("Ya mengirim aturan lengkap, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${BAPEL_LIST_PATH}?search=komisi&page=2`;
    window.sessionStorage.setItem(`list-return:${BAPEL_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data badan pelayanan ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          name: "Komisi Pemuda",
          rules: [{ type: "NO_DAY", dayOfWeek: 0 }],
        },
      },
    ]);
    expect(window.sessionStorage.getItem(`list-focus:${BAPEL_LIST_PATH}`)).toBe(
      "BPL-0001",
    );
  });

  test("nama ganda (404 be-sada): galat di field nama", async () => {
    onMockApi({ save: { status: 404, error: "Bapel Sudah Tersedia" } });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Nama ini sudah dipakai badan pelayanan lain."),
    ).toBeTruthy();
  });
});

describe("hapus", () => {
  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menghapus data badan pelayanan ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([BAPEL_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih terhubung: pesan be-sada tampil, tetap di form", async () => {
    const message =
      "Bapel Tidak Dapat Dihapus Karena Masih Terhubung dengan Pelayan";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(replaced).toEqual([]);
  });
});
