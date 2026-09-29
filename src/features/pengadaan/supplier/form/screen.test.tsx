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

import { SUPPLIER_LIST_PATH } from "../model";
import type { Supplier } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pengadaan/supplier/baru",
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

const { SupplierFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: Supplier = {
  id: 5,
  publicId: "s5",
  code: "SUP-0005",
  name: "Toko Buku Agape",
  contactPerson: "Ibu Maria",
  phone: "081396207781",
  email: null,
  address: "Jl. Pemuda No. 5, Medan",
  npwp: null,
  bankName: "BRI",
  bankAccountNumber: "012301000456307",
  bankAccountName: "Maria Situmorang",
  isActive: true,
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (failure?: Failure) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method === "GET") {
      return url === "/api/v1/supplier/SUP-0005"
        ? Response.json({ status: 200, message: "OK", data: DETAIL })
        : Response.json(
            { status: 404, error: "Supplier Tidak Ditemukan" },
            { status: 404 },
          );
    }

    calls.push({ method, body: JSON.parse(String(init?.body)) });

    if (failure) return Response.json(failure, { status: failure.status });

    return Response.json(
      {
        status: method === "POST" ? 201 : 200,
        message:
          method === "POST"
            ? "Berhasil Membuat Supplier"
            : "Berhasil Memperbarui Supplier",
        data: method === "POST" ? { ...DETAIL, code: "SUP-0009" } : DETAIL,
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
        <SupplierFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async () => {
  onRenderForm(["VIEW", "UPDATE"], "SUP-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Toko Buku Agape",
    ),
  );
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE: /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah supplier")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat supplier."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: /ubah tidak memuat detail", () => {
    const calls = onMockApi();
    let isFetched = false;
    const fetchStub = globalThis.fetch;
    globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
      isFetched = true;
      return fetchStub(...args);
    }) as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "SUP-0005");

    expect(screen.getByText("Tidak bisa mengubah supplier")).toBeTruthy();
    expect(isFetched).toBe(false);
    expect(calls).toEqual([]);
  });
});

describe("tambah", () => {
  test("wajib kosong: dialog tidak muncul, fokus ke Nama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.getByText("No telepon wajib diisi")).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("telepon hanya menerima angka dengan nol depan; POST rapi lalu kembali + sorot", async () => {
    const listUrl = `${SUPPLIER_LIST_PATH}?status=aktif`;
    window.sessionStorage.setItem(`list-return:${SUPPLIER_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  toko   Baru " },
    });
    fireEvent.change(screen.getByLabelText("No telepon"), {
      target: { value: "0812-3456 789" },
    });
    expect(
      (screen.getByLabelText("No telepon") as HTMLInputElement).value,
    ).toBe("08123456789");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(
      await screen.findByText("Apakah Anda ingin menyimpan data supplier ini?"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "POST",
        body: {
          name: "toko Baru",
          contactPerson: null,
          phone: "08123456789",
          email: null,
          address: null,
          npwp: null,
          bankName: null,
          bankAccountNumber: null,
          bankAccountName: null,
          isActive: true,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${SUPPLIER_LIST_PATH}`),
    ).toBe("SUP-0009");
  });
});

describe("ubah", () => {
  test("nama ganda (409): galat di Nama dan fokus ke sana", async () => {
    onMockApi({
      status: 409,
      error: "Supplier Sudah Tersedia",
      issues: [{ path: "name", message: "Supplier Sudah Tersedia" }],
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Supplier dengan nama ini sudah ada. Pakai nama lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat 500: FormAlert, isian tetap, fokus ke Simpan", async () => {
    onMockApi({ status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Toko Buku Agape",
    );
  });

  test("Ya mengirim PUT dengan semua field; teks konfirmasi ubah", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(
      await screen.findByText(
        "Apakah Anda ingin menyimpan perubahan data supplier ini?",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([SUPPLIER_LIST_PATH]));
    expect(calls[0]).toMatchObject({
      method: "PUT",
      body: { bankAccountNumber: "012301000456307", isActive: true },
    });
  });

  test("kode tidak dikenal: layar tidak ditemukan", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "SUP-9999");

    expect(
      await screen.findByText("Data supplier tidak ditemukan"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});
