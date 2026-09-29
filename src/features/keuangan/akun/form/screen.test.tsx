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

import { AKUN_LIST_PATH } from "../model";
import type { Account } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/akun/baru",
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

const { AccountFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: Account = {
  id: 2,
  publicId: "acc-2",
  code: "1-100",
  name: "Kas",
  type: "ASSET",
  parentAccountId: 1,
  parent: { code: "1", name: "Aset" },
  isActive: true,
  childCount: 0,
};

const DDL = [
  { id: 1, code: "1", name: "Aset", type: "ASSET", isActive: true },
  { id: 9, code: "1-900", name: "Kas Lama", type: "ASSET", isActive: false },
];

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (failure?: Failure) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method === "GET") {
      calls.push({ method, url });

      if (url.startsWith("/api/v1/ddl/account")) {
        return Response.json({
          status: 200,
          totalData: DDL.length,
          totalPage: 1,
          data: DDL,
        });
      }

      return url === "/api/v1/account/1-100"
        ? Response.json({ status: 200, message: "OK", data: DETAIL })
        : Response.json(
            { status: 404, error: "Akun Tidak Ditemukan" },
            { status: 404 },
          );
    }

    if (method === "DELETE") {
      calls.push({ method, url });

      return failure
        ? Response.json(failure, { status: failure.status })
        : Response.json({
            status: 200,
            message: "Berhasil Menghapus Akun",
            data: DETAIL,
          });
    }

    calls.push({ method, url, body: JSON.parse(String(init?.body)) });

    if (failure) return Response.json(failure, { status: failure.status });

    return Response.json(
      {
        status: method === "POST" ? 201 : 200,
        message:
          method === "POST"
            ? "Berhasil Membuat Akun"
            : "Berhasil Memperbarui Akun",
        data: method === "POST" ? { ...DETAIL, code: "1-200" } : DETAIL,
      },
      { status: method === "POST" ? 201 : 200 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <AccountFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "1-100");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Kas",
    ),
  );
};

const isChecked = (label: string) =>
  (screen.getByRole("radio", { name: label }) as HTMLInputElement).checked;

describe("gerbang izin", () => {
  test("tanpa CREATE: /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah akun")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: /ubah tidak memuat detail", () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"], "1-100");

    expect(screen.getByText("Tidak bisa mengubah akun")).toBeTruthy();
    expect(calls).toEqual([]);
  });
});

describe("tambah", () => {
  test("kode diketik jadi huruf besar dan POST rapi lalu kembali + sorot", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Kode"), {
      target: { value: "1-200 kas" },
    });
    expect((screen.getByLabelText("Kode") as HTMLInputElement).value).toBe(
      "1-200KAS",
    );

    fireEvent.change(screen.getByLabelText("Kode"), {
      target: { value: "1-200" },
    });
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  Bank   BCA " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual(["/keuangan/akun/1-200"]));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      code: "1-200",
      name: "Bank BCA",
      type: "ASSET",
      parentAccountId: null,
      isActive: true,
    });
    expect(window.sessionStorage.getItem(`list-focus:${AKUN_LIST_PATH}`)).toBe(
      "1-200",
    );
  });

  test("kode kosong: dialog tidak muncul, fokus ke Kode", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("code"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("kode ganda (409) jatuh ke field kode", async () => {
    onMockApi({
      status: 409,
      error: "Akun Sudah Tersedia",
      issues: [{ path: "code", message: "Akun Sudah Tersedia" }],
    });
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Kode"), {
      target: { value: "1-100" },
    });
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Kas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Kode ini sudah dipakai akun lain"),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("code"));
    expect(replaced).toEqual([]);
  });

  test("induk hanya menawarkan akun bertipe sama; nonaktif disembunyikan", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(
        calls.some((call) => call.url.includes("ddl/account?type=ASSET")),
      ).toBe(true),
    );

    fireEvent.click(screen.getByLabelText("Akun induk (opsional)"));

    expect(await screen.findByText("1 — Aset")).toBeTruthy();
    expect(screen.queryByText(/1-900/)).toBeNull();
  });

  test("ganti tipe mengosongkan induk dan menanyakan ddl tipe baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("radio", { name: "Beban" }));

    await waitFor(() =>
      expect(
        calls.some((call) => call.url.includes("ddl/account?type=EXPENSE")),
      ).toBe(true),
    );
  });
});

describe("ubah", () => {
  test("kode terkunci dengan alasannya", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const code = screen.getByLabelText("Kode") as HTMLInputElement;

    expect(code.disabled).toBe(true);
    expect(code.value).toBe("1-100");
    expect(
      screen.getByText("Kode tidak bisa diubah sesudah disimpan."),
    ).toBeTruthy();
  });

  test("tipe ditolak server (400) jatuh ke field tipe", async () => {
    const message = "Tipe Akun Tidak Dapat Diubah Karena Sudah Dipakai Jurnal";
    onMockApi({
      status: 400,
      error: message,
      issues: [{ path: "type", message }],
    });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("radio", { name: "Beban" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

const IN_USE =
  "Akun Tidak Dapat Dihapus Karena Sudah Dipakai Jurnal. Nonaktifkan Saja";

const HAS_CHILDREN = "Akun Tidak Dapat Dihapus Karena Masih Memiliki Sub Akun";

describe("hapus", () => {
  test("Hapus hanya di form ubah dengan DELETE", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("berjurnal (400): pesan server + Nonaktifkan mengisi status dan mengotori form", async () => {
    onMockApi({ status: 400, error: IN_USE });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(IN_USE)).toBeTruthy();
    expect(screen.getByText("Akun belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
    expect(isChecked("Aktif")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    await waitFor(() => expect(isChecked("Nonaktif")).toBe(true));
    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).toBeNull();
  });

  test("punya sub akun (400): Nonaktifkan tidak ditawarkan", async () => {
    onMockApi({ status: 400, error: HAS_CHILDREN });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(HAS_CHILDREN)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).toBeNull();
  });
});
