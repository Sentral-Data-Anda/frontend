import { cleanup, fireEvent, screen } from "@testing-library/react";
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

import { PURCHASE_ORDER } from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";
import {
  ALL,
  accessOf,
  grants,
  onStubOrderFetch,
  orderAt,
  renderWithQuery,
  type Call,
} from "../fixtures";

const replaced: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pengadaan/pesanan-pembelian",
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: accessOf,
}));

const { OrderListScreen } = await import("./screen");

const calls: Call[] = [];
const override: { current: ((call: Call) => Response | null) | null } = {
  current: null,
};
let restoreFetch: () => void;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  restoreFetch = onStubOrderFetch(calls, override);
});

afterAll(() => {
  viewport.onRestore();
  restoreFetch();
});

afterEach(() => {
  cleanup();
  calls.length = 0;
  replaced.length = 0;
  override.current = null;
  search.current = new URLSearchParams();
  window.sessionStorage.clear();
});

const onRender = (actions: typeof ALL, query = "") => {
  grants.current = { [MENU.PESANAN_PEMBELIAN]: actions };
  search.current = new URLSearchParams(query);
  renderWithQuery(<OrderListScreen />);
};

const listCalls = () =>
  calls
    .map((call) => call.path)
    .filter((path) => path.startsWith("/pesanan-pembelian?"));

describe("daftar", () => {
  test("baris HP: supplier, meta dengan total asing, Total (Rp) + status", async () => {
    onRender(["VIEW"]);

    const usd = orderAt(3);

    expect(
      await screen.findByText(
        `${PURCHASE_ORDER.filter((row) => !row.deletedAt).length} pesanan`,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        (content) =>
          content.startsWith(`${usd.code} · `) &&
          content.endsWith("· 1 barang · USD 1.041,00"),
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Tambah pesanan pembelian" }),
    ).toBeNull();
  });

  test("tab dan filter di URL → query be-sada", async () => {
    const cancelled = orderAt(4);
    const month = cancelled.orderDate.slice(0, 7);

    onRender(
      ["VIEW", "CREATE"],
      `status=CANCELLED&supplier=${cancelled.supplierId}&bulan=${month}`,
    );

    expect(await screen.findByText("1 pesanan")).toBeTruthy();
    expect(listCalls()[0]).toContain("status=CANCELLED");
    expect(listCalls()[0]).toContain(`supplierId=${cancelled.supplierId}`);
    expect(listCalls()[0]).toContain(`startDate=${month}-01`);
    expect(
      screen.getByRole("link", { name: "Tambah pesanan pembelian" }),
    ).toBeTruthy();
  });

  test("klik tab menulis status ke URL", async () => {
    onRender(["VIEW"]);

    fireEvent.click(await screen.findByRole("tab", { name: "Sebagian" }));

    expect(replaced.at(-1)).toContain("status=PARTIALLY_RECEIVED");
  });

  test("kosong vs kosong karena filter", async () => {
    override.current = (call) =>
      call.path.startsWith("/pesanan-pembelian?")
        ? Response.json(
            { status: 404, error: "Pesanan Pembelian Tidak Ditemukan" },
            { status: 404 },
          )
        : null;
    onRender(["VIEW"]);

    expect(await screen.findByText("Belum ada pesanan pembelian")).toBeTruthy();

    cleanup();
    onRender(["VIEW"], "status=RECEIVED");

    expect(
      await screen.findByText(
        "Tidak ada pesanan pembelian yang cocok dengan filter ini.",
      ),
    ).toBeTruthy();
  });

  test("tanpa VIEW: keadaan akses", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pesanan Pembelian"),
    ).toBeTruthy();
  });
});
