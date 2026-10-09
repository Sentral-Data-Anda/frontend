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

import { ACCOUNTING_SETTING_KEYS } from "@/types/keuangan";
import type { MenuAction } from "@/types/menu";

import { SETELAN_AKUNTANSI_LIST_PATH } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/finance/accounting-setting/PERSEMBAHAN_KAS/ubah",
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

const { SettingFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const ACCOUNT = {
  id: 2,
  code: "1-100",
  name: "Kas",
  type: "ASSET" as const,
  isActive: true,
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const LABEL: Record<string, string> = {
  PERSEMBAHAN_KAS: "Kas persembahan tunai",
};

const onRows = (accountId: number | null) =>
  ACCOUNTING_SETTING_KEYS.map((key) => ({
    key,
    label: LABEL[key] ?? `Label ${key}`,
    description: `Keterangan ${key}`,
    account: key === "PERSEMBAHAN_KAS" && accountId ? ACCOUNT : null,
    updatedBy: null,
  }));

const onMockApi = (
  options: { accountId?: number | null; save?: Failure } = {},
) => {
  const { accountId = 2, save } = options;
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/ddl/account")) {
      return Response.json({ status: 200, message: "OK", data: [ACCOUNT] });
    }

    if (method === "PUT") {
      calls.push({ method, url, body: JSON.parse(String(init?.body)) });

      if (save) return Response.json(save, { status: save.status });

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Setelan Akuntansi",
        data: onRows(accountId)[0],
      });
    }

    return Response.json({
      status: 200,
      message: "OK",
      data: onRows(accountId),
    });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[], key = "PERSEMBAHAN_KAS") => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <SettingFormScreen settingKey={key} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin", () => {
  test("tanpa UPDATE: form tidak dirender", () => {
    onMockApi();
    onRender(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa mengubah setelan akuntansi"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Kosongkan setelan" }),
    ).toBeNull();
  });

  test("kunci yang tidak dideklarasikan: tidak ditemukan", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KUNCI_ASING");

    await waitFor(() =>
      expect(screen.getByText(/tidak ditemukan|Tidak ditemukan/)).toBeTruthy(),
    );
  });
});

describe("kosongkan setelan", () => {
  test("setelan kosong tidak menawarkan Kosongkan", async () => {
    onMockApi({ accountId: null });
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("Kas persembahan tunai")).toBeTruthy(),
    );

    expect(
      screen.queryByRole("button", { name: "Kosongkan setelan" }),
    ).toBeNull();
  });

  test("Ya mengirim PUT accountId null sesudah konfirmasi yang menyebut akibatnya", async () => {
    const calls = onMockApi();
    onRender(["VIEW", "UPDATE"]);

    const clear = await screen.findByRole("button", {
      name: "Kosongkan setelan",
    });
    fireEvent.click(clear);

    expect(
      await screen.findByText(
        "Setelan Kas persembahan tunai akan dikosongkan. Posting yang memakainya akan ditolak sampai diisi lagi.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(replaced).toEqual([SETELAN_AKUNTANSI_LIST_PATH]),
    );
    expect(calls).toEqual([
      {
        method: "PUT",
        url: "/api/v1/setelan-akuntansi/PERSEMBAHAN_KAS",
        body: { accountId: null },
      },
    ]);
  });
});

describe("simpan", () => {
  test("akun nonaktif (400): galat di field akun dan tautan perbaikan", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Akun Tidak Aktif",
        issues: [{ path: "accountId", message: "Akun Tidak Aktif" }],
      },
    });
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByLabelText("Akun")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Akun Tidak Aktif")).toBeTruthy(),
    );
    expect(
      screen
        .getByRole("link", { name: "Perbaiki di Akun" })
        .getAttribute("href"),
    ).toBe("/finance/chart-of-account");
  });

  test("keterangan kunci jadi catatan bagian, kunci bukan field", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("Keterangan PERSEMBAHAN_KAS")).toBeTruthy(),
    );

    expect(screen.queryByLabelText("Kunci")).toBeNull();
  });
});
