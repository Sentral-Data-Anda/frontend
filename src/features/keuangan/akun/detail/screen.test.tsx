import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { Account } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/akun/1",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const actions = granted.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { AccountDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

const PARENT: Account = {
  id: 1,
  publicId: "acc-1",
  code: "1",
  name: "Aset",
  type: "ASSET",
  parentAccountId: null,
  parent: null,
  isActive: true,
  netAssetClass: null,
  cashFlowCategory: null,
  childCount: 1,
};

const CHILD: Account = {
  id: 2,
  publicId: "acc-2",
  code: "1-100",
  name: "Kas",
  type: "ASSET",
  parentAccountId: 1,
  parent: { id: 1, code: "1", name: "Aset", type: "ASSET" },
  isActive: false,
  netAssetClass: null,
  cashFlowCategory: null,
  childCount: 0,
};

const onRender = (
  access: Record<string, MenuAction[]>,
  account: Account = PARENT,
) => {
  granted.current = access;
  globalThis.fetch = (async (input: RequestInfo | URL) =>
    String(input).includes("parentAccountId")
      ? Response.json({
          status: 200,
          totalData: 1,
          totalPage: 1,
          data: [CHILD],
        })
      : Response.json({
          status: 200,
          message: "OK",
          data: account,
        })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AccountDetailScreen code={account.code} />
    </QueryClientProvider>,
  );
};

describe("halaman akun", () => {
  test("ringkasan: kode, nama, tipe, induk, status", async () => {
    onRender({ [MENU.AKUN]: ["VIEW"] }, CHILD);

    expect(await screen.findByText("Kode")).toBeTruthy();
    expect(screen.getByText("Tipe")).toBeTruthy();
    expect(screen.getAllByText("Aset").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "1 — Aset" })).toBeTruthy();
    expect(screen.getByText("Nonaktif")).toBeTruthy();
  });

  test("akun utama ditulis apa adanya, tanpa tautan induk", async () => {
    onRender({ [MENU.AKUN]: ["VIEW"] });

    expect(await screen.findByText("Akun utama")).toBeTruthy();
  });

  test("Ubah hanya dengan UPDATE; halaman baca tidak punya Hapus", async () => {
    onRender({ [MENU.AKUN]: ["VIEW", "DELETE"] });

    await screen.findByText("Kode");
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender({ [MENU.AKUN]: ["VIEW", "UPDATE", "DELETE"] });

    expect(await screen.findByRole("link", { name: "Ubah" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("buku besar hanya ditawarkan dengan izin Laporan Keuangan", async () => {
    onRender({ [MENU.AKUN]: ["VIEW"] });

    await screen.findByText("Kode");
    expect(screen.queryByRole("link", { name: "Lihat buku besar" })).toBeNull();

    cleanup();
    onRender({
      [MENU.AKUN]: ["VIEW"],
      [MENU.LAPORAN_KEUANGAN]: ["VIEW"],
    });

    expect(
      (
        await screen.findByRole("link", { name: "Lihat buku besar" })
      ).getAttribute("href"),
    ).toBe("/keuangan/laporan-keuangan?tab=buku-besar&code=1");
  });
});

describe("sub akun", () => {
  test("anaknya terdaftar di panel sendiri", async () => {
    onRender({ [MENU.AKUN]: ["VIEW"] });

    expect(await screen.findByLabelText("Lihat akun 1-100 Kas")).toBeTruthy();
  });

  test("tanpa anak: teks muted, tanpa permintaan daftar", async () => {
    let isListed = false;
    granted.current = { [MENU.AKUN]: ["VIEW"] };
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input).includes("parentAccountId")) isListed = true;

      return Response.json({ status: 200, message: "OK", data: CHILD });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AccountDetailScreen code="1-100" />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Akun ini belum punya sub akun."),
    ).toBeTruthy();
    expect(isListed).toBe(false);
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan ke server", () => {
    let isFetched = false;
    granted.current = {};
    globalThis.fetch = (async () => {
      isFetched = true;
      return Response.json({ status: 200, data: PARENT });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AccountDetailScreen code="1" />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Anda tidak memiliki akses ke Akun")).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});
