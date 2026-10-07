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

import { KATALOG_LIST_PATH } from "../model";
import type { KomponenPayroll } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const sent: { method: string; body: unknown }[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/sdm/komponen-payroll/baru",
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

const { KatalogFormScreen } = await import("./katalog-screen");

const originalFetch = globalThis.fetch;

const DETAIL: KomponenPayroll = {
  id: 1,
  code: "KPY-0001",
  name: "Tunjangan Transport",
  type: "EARNING",
  calculationType: "FIXED",
  defaultValue: "350000.00",
  isTaxable: true,
  isActive: true,
  accountId: null,
};

const MANAGED: KomponenPayroll = {
  ...DETAIL,
  id: 6,
  code: "PPH21",
  name: "PPh21",
  type: "DEDUCTION",
  defaultValue: null,
};

const onMockApi = (detail: KomponenPayroll = DETAIL) => {
  globalThis.fetch = ((input: string | URL, init?: RequestInit) => {
    const href = String(input);
    const method = init?.method ?? "GET";

    if (href.includes("/ddl/account")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: [] }),
      );
    }

    if (method !== "GET") {
      sent.push({
        method,
        body: JSON.parse(String(init?.body ?? "{}")) as unknown,
      });

      return Promise.resolve(
        Response.json({
          status: 200,
          message: "Berhasil Membuat Komponen Payroll",
          data: detail,
        }),
      );
    }

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: detail }),
    );
  }) as unknown as typeof fetch;
};

const onRender = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <KatalogFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  sent.length = 0;
});

describe("gerbang izin form katalog", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah komponen")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Komponen Payroll" })
        .getAttribute("href"),
    ).toBe(KATALOG_LIST_PATH);
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender(["VIEW", "CREATE"], "KPY-0001");

    expect(screen.getByText("Tidak bisa mengubah komponen")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("Hapus hanya pada ubah, dan hanya dengan DELETE", async () => {
    onMockApi();
    onRender(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE"], "KPY-0001");
    await waitFor(() => expect(screen.getByLabelText("Kode")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE", "DELETE"], "KPY-0001");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy(),
    );
  });
});

describe("komponen yang dikelola sistem", () => {
  test("PPH21: form diganti keadaan terkunci, tanpa Simpan dan tanpa Hapus", async () => {
    onMockApi(MANAGED);
    onRender(["VIEW", "UPDATE", "DELETE"], "PPH21");

    await waitFor(() =>
      expect(screen.getByText("Komponen ini dikelola sistem")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByLabelText("Nama")).toBeNull();
    expect(screen.queryByText(/Hubungi administrator/)).toBeNull();
  });
});

describe("nominal per orang", () => {
  test("memilih Berbeda per orang menyembunyikan field nilai dan mengirim null", async () => {
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Tunjangan Jabatan" },
    });
    fireEvent.change(screen.getByLabelText("Nilai (Rp)"), {
      target: { value: "350000" },
    });

    fireEvent.click(screen.getByText("Berbeda per orang"));

    await waitFor(() =>
      expect(screen.queryByLabelText("Nilai (Rp)")).toBeNull(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(sent.length).toBe(1));
    expect(sent[0].method).toBe("POST");
    expect(sent[0].body).toMatchObject({
      name: "Tunjangan Jabatan",
      defaultValue: null,
      accountId: null,
    });
  });

  test("cara hitung persentase mengganti label field nilai", () => {
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    expect(screen.getByLabelText("Nilai (Rp)")).toBeTruthy();

    fireEvent.click(screen.getByText("Persentase"));

    expect(screen.getByLabelText("Persentase (%)")).toBeTruthy();
  });
});
