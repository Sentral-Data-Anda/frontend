import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import type { MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { penerimaanBarangMock } from "../../../../../scripts/mock/handlers/penerimaan-barang";
import {
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
} from "../../../../../scripts/mock/inventaris-store";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
  TODAY,
  receiveGoods,
} from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";

const KERTAS_RECEIPT = GOODS_RECEIPT.find(
  (row) => row.note === "Dus kertas agak basah di satu sisi.",
)!;
const KERTAS_ORDER = PURCHASE_ORDER.find(
  (row) => row.id === KERTAS_RECEIPT.purchaseOrderId,
)!;
const KURSI_ORDER = PURCHASE_ORDER.find(
  (row) => row.status === "ISSUED" && row.items[0]?.name.startsWith("Kursi"),
);

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => `/procurement/goods-receipt/${KERTAS_RECEIPT.code}`,
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: MenuSlug) => {
    const actions = grants.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { ReceiptDetailScreen } = await import("./screen");

const snapshot = <T extends object>(rows: T[]) => {
  const copy = rows.map((row) => structuredClone(row));

  return () => {
    rows.splice(copy.length);
    copy.forEach((row, index) => Object.assign(rows[index] as T, row));
  };
};

const restores = [
  PURCHASE_ORDER,
  GOODS_RECEIPT,
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
].map((rows) => snapshot<object>(rows));
const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    return (
      (await penerimaanBarangMock({
        request: new Request(url),
        url,
        path,
        method: "GET",
        can: () => true,
        isAdmin: true,
        sessionCode: "test",
      })) ??
      Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 })
    );
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  viewport.onResize(true);
  for (const restore of restores) restore();
});

const onRender = (
  code: string,
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
) => {
  grants.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReceiptDetailScreen code={code} />
    </QueryClientProvider>,
  );
};

const receiveChairs = (quantity: number) => {
  const result = receiveGoods({
    purchaseOrderId: KURSI_ORDER?.id ?? 0,
    receivedDate: TODAY,
    note: null,
    attachments: [],
    items: [
      {
        purchaseOrderItemId: KURSI_ORDER?.items[0]?.id ?? 0,
        quantityReceived: quantity,
        target: "ASSET",
        stockItemId: null,
      },
    ],
  });
  if ("failure" in result) throw new Error(result.failure.message);

  return result.receipt.code;
};

describe("halaman penerimaan", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender(KERTAS_RECEIPT.code, {});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Penerimaan Barang"),
    ).toBeTruthy();
  });

  test("HP: N barang satu baris pesanan dikelompokkan, dilipat > 3, Lengkapi data barang", async () => {
    viewport.onResize(false);
    const code = receiveChairs(5);
    onRender(code, {
      GOODS_RECEIPT: ["VIEW"],
      ASSET_MASTER: ["VIEW", "UPDATE"],
    });

    expect(
      await screen.findByRole("heading", { name: "Toko Mebel Sentosa" }),
    ).toBeTruthy();
    const rows = within(
      screen.getByRole("list", { name: "Barang yang diterima" }),
    ).getAllByRole("listitem");

    expect(rows).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText("5 Buah")).toBeTruthy();
    expect(within(rows[0] as HTMLElement).getAllByRole("link")).toHaveLength(3);
    expect(
      within(rows[0] as HTMLElement).getByText(/dan 2 lainnya/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lengkapi data barang" })
        .getAttribute("href"),
    ).toMatch(/^\/fixed-asset\/asset-master\/AST_.+\/ubah$/);
  });

  test("tanpa VIEW Barang/Persediaan: kode tanpa tautan; lampiran tampil", async () => {
    onRender(KERTAS_RECEIPT.code, { GOODS_RECEIPT: ["VIEW"] });

    expect(
      await screen.findByText("Dus kertas agak basah di satu sisi."),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "BRP-0004" })).toBeNull();
    expect(screen.queryByRole("link", { name: KERTAS_ORDER.code })).toBeNull();
    expect(
      within(
        screen.getByRole("list", { name: "Nota dan surat jalan" }),
      ).getAllByRole("link"),
    ).toHaveLength(2);
    expect(screen.queryByText("Lengkapi data barang")).toBeNull();
  });

  test("tidak ada: keadaan tidak ditemukan", async () => {
    onRender("GRN-2026-9999", { GOODS_RECEIPT: ["VIEW"] });

    expect(
      await screen.findByText(/penerimaan barang tidak ditemukan/i),
    ).toBeTruthy();
  });
});
