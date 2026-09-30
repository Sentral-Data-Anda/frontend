import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ACCOUNTING_SETTING_KEYS } from "@/types/keuangan";
import type { MenuAction } from "@/types/menu";

import type { AccountingSetting } from "../types";

const actions: { current: MenuAction[] } = { current: ["VIEW"] };

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { SettingListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const account = (isActive = true) => ({
  id: 2,
  code: "1-100",
  name: "Kas",
  type: "ASSET" as const,
  isActive,
});

const onRows = (filled: number, inactive = 0): AccountingSetting[] =>
  ACCOUNTING_SETTING_KEYS.map((key, index) => ({
    key,
    label: `Label ${key}`,
    description: `Keterangan ${key}`,
    account: index < filled ? account(index >= inactive) : null,
    updatedBy: index < filled ? "7" : null,
  }));

const onRender = (rows: AccountingSetting[], granted: MenuAction[]) => {
  actions.current = granted;
  globalThis.fetch = (async () =>
    Response.json({
      status: 200,
      message: "OK",
      totalData: rows.length,
      totalPage: 1,
      data: rows,
    })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SettingListScreen />
    </QueryClientProvider>,
  );
};

describe("gerbang VIEW", () => {
  test("tanpa VIEW: keadaan tanpa akses dan tanpa permintaan", () => {
    actions.current = [];
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SettingListScreen />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Setelan Akuntansi"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});

describe("kesiapan hari pertama", () => {
  test("seluruh kunci tampil walau semuanya kosong, dengan peringatan", async () => {
    onRender(onRows(0), ["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("0 dari 6 setelan sudah diisi")).toBeTruthy(),
    );

    expect(screen.getAllByText("Belum diisi").length).toBe(
      ACCOUNTING_SETTING_KEYS.length,
    );
    expect(screen.getByText("6 dari 6 setelan belum diisi.")).toBeTruthy();
    expect(
      screen.getByText(
        "Posting jurnal akan ditolak selama setelan ini belum lengkap.",
      ),
    ).toBeTruthy();
  });

  test("satu terisi satu kosong: hitungan dan penanda campur", async () => {
    onRender(onRows(1), ["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("1 dari 6 setelan sudah diisi")).toBeTruthy(),
    );

    expect(screen.getAllByText("Belum diisi").length).toBe(5);
    expect(screen.getAllByText("1-100 — Kas").length).toBeGreaterThan(0);
  });

  test("semua terisi dan aktif: tanpa peringatan", async () => {
    onRender(onRows(6), ["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("6 dari 6 setelan sudah diisi")).toBeTruthy(),
    );

    expect(screen.queryByText(/belum diisi\./)).toBeNull();
    expect(screen.queryByText("Belum diisi")).toBeNull();
  });

  test("akun dinonaktifkan sesudah ditunjuk ditandai", async () => {
    onRender(onRows(6, 1), ["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getAllByText("Akun nonaktif").length).toBe(1),
    );

    expect(screen.getByText("1 setelan menunjuk akun nonaktif.")).toBeTruthy();
  });
});

describe("izin dan id mentah", () => {
  test("tanpa UPDATE: tidak ada tautan ubah", async () => {
    onRender(onRows(6), ["VIEW"]);

    await waitFor(() =>
      expect(screen.getByText("6 dari 6 setelan sudah diisi")).toBeTruthy(),
    );

    expect(screen.queryByRole("link", { name: /Pilih akun untuk/ })).toBeNull();
    expect(screen.getByText("Label PERSEMBAHAN_KAS")).toBeTruthy();
  });

  test("updatedBy berupa id tidak pernah dirender", async () => {
    onRender(onRows(6), ["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("6 dari 6 setelan sudah diisi")).toBeTruthy(),
    );

    expect(screen.queryByText(/Terakhir diubah oleh 7/)).toBeNull();
  });
});
