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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { Transfer } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/bank-deposit",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { TransferListScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  query.current = "";
});

const account = (id: number, code: string, name: string) => ({
  id,
  code,
  name,
  type: "ASSET" as const,
});

const transfer = (
  id: number,
  from: ReturnType<typeof account>,
  to: ReturnType<typeof account>,
  extra: Partial<Transfer> = {},
): Transfer => ({
  id,
  publicId: `str-${id}`,
  code: `STR-2026-000${id}`,
  transferDate: "2026-09-28T00:00:00.000Z",
  fromAccountId: from.id,
  toAccountId: to.id,
  fromAccount: from,
  toAccount: to,
  amount: "6420000",
  description: "Setoran kolekte Minggu",
  reference: "SLIP-0098",
  bapel: null,
  status: "DRAFT",
  method: null,
  journal: null,
  ...extra,
});

const KAS = account(2, "1-100", "Kas");
const BANK = account(4, "1-200", "Bank BCA");
const PETTY = account(3, "1-110", "Kas Kecil");

const ROWS: Transfer[] = [
  transfer(1, KAS, BANK),
  transfer(2, BANK, PETTY, { status: "PAID", amount: "1500000" }),
];

const onRender = (granted: MenuAction[], rows: Transfer[] = ROWS) => {
  actions.current = granted;
  globalThis.fetch = (async () =>
    rows.length === 0
      ? Response.json(
          { status: 404, error: "Setoran Tidak Ditemukan" },
          { status: 404 },
        )
      : Response.json({
          status: 200,
          totalData: rows.length,
          totalPage: 1,
          data: rows,
        })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TransferListScreen />
    </QueryClientProvider>,
  );
};

describe("baris daftar", () => {
  test("judulnya arah sebagai panah, bukan kata Setoran atau Penarikan", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Kas → Bank BCA")).toBeTruthy();
    expect(screen.getByText("Bank BCA → Kas Kecil")).toBeTruthy();
  });

  test("jumlah dan status ikut di baris", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Rp 6.420.000")).toBeTruthy();
    expect(screen.getByText("Rp 1.500.000")).toBeTruthy();
    expect(
      document.querySelectorAll('[data-slot="badge"][data-variant="draft"]')
        .length,
    ).toBe(1);
    expect(
      document.querySelectorAll('[data-slot="badge"][data-variant="success"]')
        .length,
    ).toBe(1);
  });

  test("tanpa kata Debit atau Kredit", async () => {
    onRender(["VIEW"]);

    await screen.findByText("Kas → Bank BCA");
    expect(document.body.textContent).not.toMatch(/debit|kredit/i);
  });
});

describe("tombol tambah", () => {
  test("dua pintasan mengisi awal field yang berbeda, plus pemindahan lain", async () => {
    onRender(["VIEW", "CREATE"]);

    await screen.findByText("Kas → Bank BCA");
    screen.getByRole("button", { name: "Catat setoran" }).click();

    expect(
      (
        (await screen.findByRole("menuitem", {
          name: "Setor ke bank",
        })) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe("/finance/bank-deposit/baru?dari=kas");
    expect(
      (
        screen.getByRole("menuitem", {
          name: "Isi kas kecil",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe("/finance/bank-deposit/baru?ke=kas-kecil");
    expect(
      (
        screen.getByRole("menuitem", {
          name: "Pemindahan lain",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe("/finance/bank-deposit/baru");
  });

  test("tanpa CREATE tombolnya tidak ada", async () => {
    onRender(["VIEW"]);

    await screen.findByText("Kas → Bank BCA");
    expect(screen.queryByRole("button", { name: "Catat setoran" })).toBeNull();
  });
});

describe("keadaan daftar", () => {
  test("kosong di bulan berjalan menawarkan melepas saringan", async () => {
    onRender(["VIEW"], []);

    expect(await screen.findByText("Tidak ada setoran")).toBeTruthy();
  });

  test("semua bulan dan kosong: kalimat 'belum ada'", async () => {
    query.current = "bulan=semua";
    onRender(["VIEW"], []);

    expect(await screen.findByText("Belum ada setoran")).toBeTruthy();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan ke server", () => {
    let isFetched = false;
    actions.current = [];
    globalThis.fetch = (async () => {
      isFetched = true;
      return Response.json({ status: 200, data: [] });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <TransferListScreen />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Setoran"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});

describe("indikator bawaan bulan berjalan", () => {
  test("bawaan berbadge, bulan=semua tidak", async () => {
    onRender(["VIEW"]);
    await screen.findByText("Kas → Bank BCA");

    expect(
      screen.getByRole("button", { name: "Filter, 1 aktif" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hapus filter Bulan: Bulan ini" }),
    ).toBeTruthy();

    cleanup();
    query.current = "bulan=semua";
    onRender(["VIEW"]);
    await screen.findByText("Kas → Bank BCA");

    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Filter aktif" })).toBeNull();
  });
});
