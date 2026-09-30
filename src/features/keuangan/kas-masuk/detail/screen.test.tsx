import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
import type { CashReceiptDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/kas-masuk/bkm-0001",
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

const { ReceiptDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const detail = (next: Partial<CashReceiptDetail> = {}): CashReceiptDetail => ({
  id: 1,
  publicId: "bkm-0001",
  code: "BKM-2026-0001",
  receiptDate: "2026-09-29T00:00:00.000Z",
  description: "Sewa gedung untuk resepsi",
  payer: "Keluarga Santoso",
  intoAccountId: 2,
  intoAccount: { id: 2, code: "1-100", name: "Kas" },
  bapel: null,
  method: "Tunai",
  reference: "BA-07/IX/2026",
  totalAmount: "3500000",
  status: "DRAFT",
  lines: [
    {
      publicId: "bkml-1",
      accountId: 20,
      account: { code: "4-200", name: "Sewa Gedung" },
      amount: "3500000",
      description: "Sewa aula",
    },
  ],
  journal: null,
  ...next,
});

const onRender = (
  grants: MenuAction[],
  row: CashReceiptDetail,
  onAction?: (url: string, init?: RequestInit) => Response,
) => {
  actions.current = grants;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (init?.method && onAction) return Promise.resolve(onAction(url, init));

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: row }),
    );
  }) as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ReceiptDetailScreen publicId="bkm-0001" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("ReceiptDetailScreen", () => {
  test("tidak pernah mengucapkan Debit atau Kredit", async () => {
    const { container } = onRender(
      ["VIEW", "UPDATE", "DELETE"],
      detail({
        status: "PAID",
        journal: {
          publicId: "jrn-0101",
          code: "JRN-2026-0101",
          status: "POSTED",
        },
      }),
    );

    await screen.findByText("Rincian");

    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
  });

  test("menulis kalimat persembahan dan menautkan entri jurnalnya", async () => {
    onRender(
      ["VIEW"],
      detail({
        status: "PAID",
        journal: {
          publicId: "jrn-0101",
          code: "JRN-2026-0101",
          status: "POSTED",
        },
      }),
    );

    expect(
      await screen.findByText(
        "Persembahan yang sudah diposting tidak dicatat lagi di sini.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "JRN-2026-0101" })).toBeTruthy();
  });

  test("draf menawarkan Terima, Ubah, dan Hapus", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], detail());

    expect(await screen.findByRole("button", { name: "Terima" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Batalkan" })).toBeNull();
  });

  test("tanpa DELETE draf tidak menawarkan Hapus", async () => {
    onRender(["VIEW", "UPDATE"], detail());

    await screen.findByRole("button", { name: "Terima" });

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("Batalkan menunggu alasan diisi", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], detail({ status: "PAID" }));

    const cancel = await screen.findByRole("button", { name: "Batalkan" });

    expect(cancel.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Alasan pembatalan"), {
      target: { value: "Uang dikembalikan" },
    });

    expect(
      screen.getByRole("button", { name: "Batalkan" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  test("galat periode tertutup menautkan Periode Fiskal", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], detail(), () =>
      Response.json(
        {
          status: 400,
          error: "Periode Fiskal September 2026 Sudah Ditutup",
          code: "PERIOD_CLOSED",
        },
        { status: 400 },
      ),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Terima" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Periode Fiskal September 2026 Sudah Ditutup"),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Buka bulannya di Periode Fiskal" }),
    ).toBeTruthy();
  });

  test("tanpa VIEW menampilkan keadaan tanpa akses", () => {
    onRender([], detail());

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kas Masuk"),
    ).toBeTruthy();
  });
});
