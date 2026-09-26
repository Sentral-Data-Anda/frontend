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

import { ROLE_JEMAAT_LIST_PATH } from "../model";
import type { RoleJemaatItem } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/role-jemaat/baru",
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

const { RoleJemaatFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <RoleJemaatFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const DETAIL: RoleJemaatItem = {
  id: 42,
  publicId: "abc",
  name: "Sekretaris",
  startPeriode: "2025-01-01T00:00:00.000Z",
  endPeriode: "2026-12-31T00:00:00.000Z",
  status: true,
  jemaat: { id: 4, code: "JMT-0004", name: "Debora Manurung" },
  bapel: { id: 2, code: "BPL-0002", name: "Komisi Pemuda" },
};

type Failure = { status: number; error: string };

const onMockApi = (failure?: { save?: Failure; remove?: Failure }) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/role-jemaat/42" && method !== "GET") {
      calls.push(method);
      const planned = method === "DELETE" ? failure?.remove : failure?.save;

      if (planned) return Response.json(planned, { status: planned.status });

      return Response.json({
        status: 200,
        message:
          method === "DELETE"
            ? "Berhasil Menghapus Role Jemaat"
            : "Berhasil Memperbarui Role Jemaat",
        data: { id: 42 },
      });
    }
    if (url === "/api/v1/role-jemaat/42") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({ status: 200, message: "OK", data: [] });
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[]) => {
  onRenderForm(granted, "42");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama jabatan") as HTMLInputElement).value,
    ).toBe("Sekretaris"),
  );
};

const onConfirmYes = async (trigger: string) => {
  fireEvent.click(screen.getByRole("button", { name: trigger }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah jabatan")).toBeTruthy();
    expect(screen.queryByLabelText("Nama jabatan")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"], "42");

    expect(screen.getByText("Tidak bisa mengubah jabatan")).toBeTruthy();
  });

  test("form tambah tidak pernah punya Hapus", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    expect(screen.getByLabelText("Nama jabatan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah tanpa DELETE: Hapus tidak dirender", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("simpan", () => {
  test("kembali ke daftar membawa filter dan menandai baris", async () => {
    const listUrl = `${ROLE_JEMAAT_LIST_PATH}?tahun=2025&page=2`;
    window.sessionStorage.setItem(
      `list-return:${ROLE_JEMAAT_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    await onConfirmYes("Simpan");

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["PUT"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${ROLE_JEMAAT_LIST_PATH}`),
    ).toBe("42");
  });

  test("409 tumpang tindih: fokus ke tanggal mulai, tetap di form", async () => {
    onMockApi({
      save: {
        status: 409,
        error:
          "Jemaat tersebut sudah menjabat peran yang sama di Bapel ini pada periode yang bertumpang tindih",
      },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    await onConfirmYes("Simpan");

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("startPeriode"),
    );
    expect(replaced).toEqual([]);
  });
});

describe("hapus", () => {
  test("Ya memanggil DELETE lalu kembali ke daftar", async () => {
    const listUrl = `${ROLE_JEMAAT_LIST_PATH}?search=ketua`;
    window.sessionStorage.setItem(
      `list-return:${ROLE_JEMAAT_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    await onConfirmYes("Hapus");

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["DELETE"]);
  });

  test("hapus ditolak: galat di form, fokus ke Hapus", async () => {
    onMockApi({
      remove: { status: 404, error: "Role Jemaat Tidak Ditemukan" },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    await onConfirmYes("Hapus");

    expect(
      await screen.findByText("Jabatan belum terhapus. Coba hapus lagi."),
    ).toBeTruthy();
    expect(screen.getByText("Role Jemaat Tidak Ditemukan")).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Hapus"),
    );
    expect(replaced).toEqual([]);
  });
});
