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

import { TIPE_PERSEMBAHAN_LIST_PATH } from "../model";
import type { OfferingType } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/finance/tipe-persembahan/baru",
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

const { OfferingTypeFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: OfferingType = {
  id: 5,
  publicId: "tps-0005",
  code: "TPS-0005",
  name: "Dana Pembangunan",
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId: 19,
  account: {
    id: 19,
    code: "4-130",
    name: "Persembahan Dana Pembangunan",
    type: "INCOME",
    isActive: true,
  },
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
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
        <OfferingTypeFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onMockApi = (
  failure: { save?: Failure; remove?: Failure } = {},
  accounts: unknown[] = [
    {
      id: 19,
      code: "4-130",
      name: "Persembahan Dana Pembangunan",
      type: "INCOME",
      isActive: true,
    },
  ],
) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/ddl/account")) {
      calls.push({ method, url });

      if (accounts.length === 0) {
        return Response.json(
          { status: 404, error: "Akun Tidak Ditemukan" },
          { status: 404 },
        );
      }

      return Response.json({ status: 200, message: "OK", data: accounts });
    }

    if (url === "/api/v1/type-persembahan/TPS-0005" && method === "PUT") {
      calls.push({ method, url, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    if (url === "/api/v1/type-persembahan/TPS-0005" && method === "DELETE") {
      calls.push({ method, url });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    if (url === "/api/v1/type-persembahan/TPS-0005") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Tipe Persembahan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "TPS-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Dana Pembangunan",
    ),
  );
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah tipe persembahan"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", async () => {
    onMockApi();
    await onRenderLoadedEdit();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

describe("akun pendapatan", () => {
  test("ddl akun disaring type=INCOME", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(calls.some((call) => call.url.includes("/ddl/account"))).toBe(
        true,
      ),
    );

    for (const call of calls.filter((row) =>
      row.url.includes("/ddl/account"),
    )) {
      expect(call.url).toContain("type=INCOME");
    }
  });

  test("tanpa akun sama sekali: tautan Buat akun dulu", async () => {
    onMockApi({}, []);
    onRenderForm(["VIEW", "CREATE"]);

    const link = await screen.findByRole("link", { name: "Buat akun dulu" });

    expect(link.getAttribute("href")).toBe("/finance/chart-of-account");
  });
});

describe("simpan", () => {
  test("Ya mengirim PUT lengkap dan kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([TIPE_PERSEMBAHAN_LIST_PATH]));
    expect(calls.filter((call) => call.method === "PUT")).toEqual([
      {
        method: "PUT",
        url: "/api/v1/type-persembahan/TPS-0005",
        body: {
          name: "Dana Pembangunan",
          accountId: 19,
          hasPeriod: false,
          requiresJemaat: false,
          isActive: true,
        },
      },
    ]);
  });

  test("nama ganda (409): galat di field nama", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Tipe Persembahan Sudah Tersedia",
        issues: [{ path: "name", message: "Tipe Persembahan Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Nama ini sudah dipakai tipe persembahan lain"),
      ).toBeTruthy(),
    );
  });

  test("akun nonaktif (400): galat di field akun dan tautan perbaikan", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Akun Tidak Aktif",
        issues: [{ path: "accountId", message: "Akun Tidak Aktif" }],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(screen.getByText("Akun Tidak Aktif")).toBeTruthy(),
    );
    expect(
      screen
        .getByRole("link", { name: "Perbaiki di Akun" })
        .getAttribute("href"),
    ).toBe("/finance/chart-of-account");
  });
});

describe("hapus", () => {
  test("ditolak karena dipakai: FormAlert dan tombol Nonaktifkan", async () => {
    onMockApi({
      remove: {
        status: 400,
        error:
          "Tipe Persembahan Tidak Dapat Dihapus Karena Sudah Dipakai Persembahan",
      },
    });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Tipe persembahan belum terhapus.")).toBeTruthy(),
    );

    const deactivate = screen.getByRole("button", { name: "Nonaktifkan" });
    fireEvent.click(deactivate);

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Nonaktif") as HTMLInputElement).checked,
      ).toBe(true),
    );
  });
});

describe("flag", () => {
  test("form ubah menjelaskan bahwa perubahan berlaku untuk berikutnya", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const notes = screen.getAllByText(
      /Perubahan hanya berlaku untuk persembahan berikutnya\./,
    );

    expect(notes.length).toBe(2);
  });

  test("form tambah tidak memakai catatan itu", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(screen.getByLabelText("Nama")).toBeTruthy());
    expect(
      screen.queryByText(
        /Perubahan hanya berlaku untuk persembahan berikutnya/,
      ),
    ).toBeNull();
  });
});
