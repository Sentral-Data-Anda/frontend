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
import type { CashReceipt } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/kas-masuk",
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

const { ReceiptListScreen } = await import("./screen");

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

const row = (
  id: number,
  payer: string,
  extra: Partial<CashReceipt> = {},
): CashReceipt => ({
  id,
  publicId: `bkm-000${id}`,
  code: `BKM-2026-000${id}`,
  receiptDate: "2026-09-29T00:00:00.000Z",
  description: "Sewa gedung",
  payer,
  intoAccountId: 2,
  intoAccount: { id: 2, code: "1-100", name: "Kas" },
  bapel: null,
  method: "Tunai",
  reference: "BA-07/IX/2026",
  totalAmount: "3500000",
  status: "DRAFT",
  ...extra,
});

const ROWS: CashReceipt[] = [
  row(1, "Keluarga Santoso"),
  row(2, "Payment gateway", { status: "PAID", totalAmount: "4777250" }),
];

const onRender = (grants: MenuAction[], rows: CashReceipt[] = ROWS) => {
  actions.current = grants;
  globalThis.fetch = (() =>
    Promise.resolve(
      Response.json({
        status: 200,
        totalData: rows.length,
        totalPage: 1,
        data: rows,
      }),
    )) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReceiptListScreen />
    </QueryClientProvider>,
  );
};

describe("ReceiptListScreen", () => {
  test("tanpa VIEW menampilkan keadaan tanpa akses", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kas Masuk"),
    ).toBeTruthy();
  });

  test("menampilkan baris beserta total dan statusnya", async () => {
    onRender(["VIEW"]);

    expect(await screen.findByText("Keluarga Santoso")).toBeTruthy();
    expect(screen.getByText("Rp 4.777.250")).toBeTruthy();
    expect(screen.getAllByText("Diterima").length).toBeGreaterThan(1);
  });

  test("tidak pernah mengucapkan Debit atau Kredit", async () => {
    const { container } = onRender(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await screen.findByText("Keluarga Santoso");

    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
  });

  test("pintasan pencairan hanya muncul bila boleh menambah", async () => {
    onRender(["VIEW"]);
    await screen.findByText("Keluarga Santoso");

    expect(
      screen.queryByLabelText("Catat pencairan payment gateway"),
    ).toBeNull();

    cleanup();
    onRender(["VIEW", "CREATE"]);
    await screen.findByText("Keluarga Santoso");

    const shortcut = screen.getByLabelText("Catat pencairan payment gateway");

    expect(shortcut.getAttribute("href")).toBe(
      "/keuangan/kas-masuk/baru?pencairan=1",
    );
  });

  test("tautan ubah hanya untuk draf", async () => {
    onRender(["VIEW", "UPDATE"]);
    await screen.findByText("Keluarga Santoso");

    expect(screen.getByLabelText("Ubah kas masuk BKM-2026-0001")).toBeTruthy();
    expect(screen.queryByLabelText("Ubah kas masuk BKM-2026-0002")).toBeNull();
  });

  test("kosong menyebut persembahan yang sudah diposting", async () => {
    onRender(["VIEW"], []);

    expect(await screen.findByText("Belum ada kas masuk")).toBeTruthy();
    expect(
      screen.getByText(/Persembahan yang sudah diposting tidak dicatat lagi/),
    ).toBeTruthy();
  });
});
