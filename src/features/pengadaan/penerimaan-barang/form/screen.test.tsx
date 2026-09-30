import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { MENU, type MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { inventarisMock } from "../../../../../scripts/mock/handlers/inventaris";
import { penerimaanBarangMock } from "../../../../../scripts/mock/handlers/penerimaan-barang";
import { pengadaanMock } from "../../../../../scripts/mock/handlers/pengadaan";
import { pesananPembelianMock } from "../../../../../scripts/mock/handlers/pesanan-pembelian";
import {
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
} from "../../../../../scripts/mock/inventaris-store";
import type { MockContext } from "../../../../../scripts/mock/kit";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
} from "../../../../../scripts/mock/pengadaan-store";

const PO_SISA = PURCHASE_ORDER.find(
  (row) => row.status === "PARTIALLY_RECEIVED",
)!;
const PO_USD = PURCHASE_ORDER.find((row) => row.currencyCode === "USD")!;

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/pengadaan/penerimaan-barang/baru",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { ReceiptFormScreen } = await import("./screen");

const snapshot = <T extends object>(rows: T[]) => {
  const copy = rows.map((row) => structuredClone(row));

  return () => {
    rows.splice(copy.length);
    copy.forEach((row, index) => Object.assign(rows[index] as T, row));
  };
};

const HANDLERS = [
  penerimaanBarangMock,
  pesananPembelianMock,
  pengadaanMock,
  inventarisMock,
];
const originalFetch = globalThis.fetch;
const restores = [
  PURCHASE_ORDER,
  GOODS_RECEIPT,
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
].map((rows) => snapshot<object>(rows));
const posts: FormData[] = [];
const orderFetches: string[] = [];
const serverMenus: { current: MenuSlug[] | null } = { current: null };

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";
    const request = new Request(url, { method });
    const orderMatch = /^\/pesanan-pembelian\/([^/]+)$/.exec(path);

    if (orderMatch) orderFetches.push(orderMatch[1] ?? "");

    if (init?.body instanceof FormData) {
      const body = init.body;

      posts.push(body);
      // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
      request.formData = async () => body;
    }

    const context: MockContext = {
      request,
      url,
      path,
      method,
      can: (slug) => serverMenus.current?.includes(slug) ?? true,
      isAdmin: serverMenus.current === null,
      sessionCode: "test",
    };

    for (const handler of HANDLERS) {
      const response = await handler(context);

      if (response) return response;
    }

    return Response.json(
      { status: 404, error: "Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  for (const restore of restores) restore();
  posts.length = 0;
  orderFetches.length = 0;
  serverMenus.current = null;
  replaced.length = 0;
  search.current = "";
  delete process.env.MOCK_RECEIPT_RACE;
});

const onRender = (granted: MenuAction[] = ["VIEW", "CREATE"]) => {
  actions.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <ReceiptFormScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const cards = () =>
  within(screen.getByRole("list", { name: "Barang yang datang" })).getAllByRole(
    "listitem",
  );

const cardOf = (index: number) => within(cards()[index] as HTMLElement);

const quantityOf = (index: number) =>
  document.getElementById(
    `items.${index}.quantityReceived`,
  ) as HTMLInputElement;

const onPickTarget = (index: number, label: "Barang" | "Barang persediaan") =>
  fireEvent.click(cardOf(index).getByRole("radio", { name: label }));

const onSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

const dialogText = async () =>
  (await screen.findByRole("alertdialog")).textContent;

const onAnswer = async (name: "Ya" | "Tidak") =>
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name,
    }),
  );

const onOpenPrefilled = async (code: string, count: number) => {
  search.current = `pesanan=${code}`;
  const queryClient = onRender();

  await waitFor(() => expect(cards()).toHaveLength(count));

  return queryClient;
};

describe("muat baris", () => {
  test("?pesanan= memuat baris bersisa sekali, jumlah bawaan = sisa", async () => {
    await onOpenPrefilled(PO_SISA.code, 2);

    expect(
      cardOf(0).getByText("Proyektor Epson EB-X51", { selector: "span[id]" }),
    ).toBeTruthy();
    expect(quantityOf(0).value).toBe("1");
    expect(quantityOf(1).value).toBe("20");
    expect(
      screen.getByText("2 baris · 0 barang baru · 0 baris persediaan"),
    ).toBeTruthy();
    expect(orderFetches).toEqual([PO_SISA.code]);
  });

  test("ganti pesanan sesudah baris diisi meminta konfirmasi", async () => {
    await onOpenPrefilled(PO_SISA.code, 2);
    onPickTarget(0, "Barang");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Buka pilihan" })[0] as HTMLElement,
    );
    fireEvent.click(
      await screen.findByRole("option", { name: new RegExp(PO_USD.code) }),
    );

    expect(await dialogText()).toContain(
      "Apakah Anda ingin mengganti pesanan? Baris yang sudah diisi akan diganti.",
    );
    await onAnswer("Tidak");
    expect(cards()).toHaveLength(2);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Buka pilihan" })[0] as HTMLElement,
    );
    fireEvent.click(
      await screen.findByRole("option", { name: new RegExp(PO_USD.code) }),
    );
    await onAnswer("Ya");

    await waitFor(() =>
      expect(
        cardOf(0).getByText("Mixer Behringer X32", { selector: "span[id]" }),
      ).toBeTruthy(),
    );
    expect(cards()).toHaveLength(1);
  });

  test("peran hanya penerimaan (tanpa PESANAN_PEMBELIAN) tetap memuat baris pesanan", async () => {
    serverMenus.current = [MENU.PENERIMAAN_BARANG];
    await onOpenPrefilled(PO_SISA.code, 2);

    expect(orderFetches).toEqual([PO_SISA.code]);
    expect(quantityOf(1).value).toBe("20");
  });

  test("tanpa CREATE: keadaan tidak bisa mencatat", () => {
    onRender(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa mencatat penerimaan barang"),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat penerimaan barang."),
    ).toBeTruthy();
  });
});

describe("kartu", () => {
  test("jenis wajib dipilih; fokus ke jenis pertama; tanpa POST", async () => {
    await onOpenPrefilled(PO_SISA.code, 2);
    onSave();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.0.target"),
    );
    expect(
      screen.getAllByText("Pilih jadi barang atau barang persediaan"),
    ).toHaveLength(2);
    expect(posts).toHaveLength(0);
  });

  test("pesanan USD: hint harga perolehan dalam Rupiah", async () => {
    await onOpenPrefilled(PO_USD.code, 1);
    onPickTarget(0, "Barang");

    expect(
      cardOf(0).getByText(/harga perolehan Rp\s16\.395\.750 per barang/),
    ).toBeTruthy();
  });

  test("persediaan: opsi pertama baru di ruang pesanan, satuan lain nonaktif", async () => {
    await onOpenPrefilled(PO_SISA.code, 2);
    onPickTarget(1, "Barang persediaan");

    fireEvent.click(cardOf(1).getByRole("button", { name: "Buka pilihan" }));

    expect(
      await screen.findByRole("option", {
        name: /Barang persediaan baru di Aula Serbaguna/,
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("option", { name: /Amplop Persembahan/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      screen
        .getByRole("option", { name: /Kertas HVS A4/ })
        .getAttribute("aria-disabled"),
    ).not.toBe("true");
  });
});

describe("simpan", () => {
  test("konfirmasi final, multipart, halaman penerimaan baru, invalidasi Inventaris", async () => {
    const queryClient = await onOpenPrefilled(PO_SISA.code, 2);
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);

    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    onPickTarget(0, "Barang");
    onPickTarget(1, "Barang persediaan");
    onSave();

    expect(await dialogText()).toContain(
      "Apakah Anda ingin menyimpan penerimaan ini? 1 barang baru dan stok 1 barang persediaan akan tercatat. Penerimaan tidak bisa diubah atau dihapus.",
    );
    await onAnswer("Ya");

    await waitFor(() =>
      expect(replaced[0]).toMatch(/^\/pengadaan\/penerimaan-barang\/GRN-/),
    );
    const [body] = posts;

    expect(body?.has("receivedBy")).toBe(false);
    expect(JSON.parse(String(body?.get("items")))).toEqual([
      {
        purchaseOrderItemId: PO_SISA.items[0]?.id,
        quantityReceived: 1,
        target: "ASSET",
      },
      {
        purchaseOrderItemId: PO_SISA.items[1]?.id,
        quantityReceived: 20,
        target: "STOCK",
        stockItemId: null,
      },
    ]);
    for (const key of [
      ["goods-receipt"],
      ["purchase-order"],
      ["asset"],
      ["stock-item"],
      ["stock-movement"],
    ]) {
      expect(invalidated).toContainEqual(key);
    }
  });

  test("galat server items.<i>.quantityReceived → kartu form yang benar + fokus", async () => {
    process.env.MOCK_RECEIPT_RACE = "1";
    await onOpenPrefilled(PO_SISA.code, 2);

    fireEvent.click(
      cardOf(0).getByRole("button", {
        name: "Tidak diterima sekarang: Proyektor Epson EB-X51",
      }),
    );
    onPickTarget(1, "Barang persediaan");
    onSave();
    await onAnswer("Ya");

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.1.quantityReceived"),
    );
    expect(cardOf(1).getByText(/Melebihi Jumlah Yang Dipesan/)).toBeTruthy();
    expect(JSON.parse(String(posts[0]?.get("items")))).toHaveLength(1);
    expect(replaced).toEqual([]);
  });
});
