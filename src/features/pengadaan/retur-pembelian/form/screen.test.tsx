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

import type { MenuAction } from "@/types/menu";

import { penerimaanBarangMock } from "../../../../../scripts/mock/handlers/penerimaan-barang";
import { returPembelianMock } from "../../../../../scripts/mock/handlers/retur-pembelian";
import type { MockContext } from "../../../../../scripts/mock/kit";
import {
  PURCHASE_RETURN,
  type PurchaseReturnRow,
} from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";
import { RETURN_LIST_PATH, returnHref } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const calls: { method: string; path: string; body: unknown }[] = [];
let override: (() => Response) | null = null;

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/procurement/purchase-return/baru",
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

const { ReturnFormScreen } = await import("./screen");

const SNAPSHOT = structuredClone(PURCHASE_RETURN);
const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      calls.push({
        method,
        path,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });

      if (override) return override();
    }

    const context: MockContext = {
      request: new Request(url, {
        method,
        ...(init?.body ? { body: String(init.body) } : {}),
      }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    return (
      (await returPembelianMock(context)) ??
      (await penerimaanBarangMock(context)) ??
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
  PURCHASE_RETURN.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  calls.length = 0;
  replaced.length = 0;
  override = null;
  window.sessionStorage.clear();
});

const onRender = (granted: MenuAction[], publicId?: string) => {
  actions.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <ReturnFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const rowOf = (status: PurchaseReturnRow["status"]) =>
  PURCHASE_RETURN.find((row) => row.status === status) as PurchaseReturnRow;

const field = (id: string) => document.getElementById(id) as HTMLInputElement;

const onType = (id: string, value: string) =>
  fireEvent.change(field(id), { target: { value } });

// DateField mengirim nilainya saat blur, bukan saat ketik.
const onTypeDate = (id: string, value: string) => {
  onType(id, value);
  fireEvent.blur(field(id));
};

const onSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

const onYes = async () =>
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ya",
    }),
  );

// Pemicunya disabled selama pilihan penerimaan masih dimuat, dan klik pada
// tombol disabled tidak membuka apa pun — tunggu placeholder-nya berganti dulu.
const onPickReceipt = async (label: RegExp) => {
  await screen.findByPlaceholderText(
    "Cari kode penerimaan, pesanan, atau supplier",
  );
  fireEvent.click(
    screen.getAllByRole("button", { name: "Buka pilihan" })[0] as HTMLElement,
  );
  fireEvent.click(await screen.findByRole("option", { name: label }));
};

const onLoadLines = async () =>
  fireEvent.click(
    await screen.findByRole("button", { name: /^Muat baris GRN-/ }),
  );

const lineCount = () =>
  within(
    screen.getByRole("list", { name: "Barang yang dikembalikan" }),
  ).getAllByRole("listitem").length;

describe("izin dan status", () => {
  test("tanpa CREATE: keadaan tidak bisa menambah", () => {
    onRender(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah retur pembelian"),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat retur pembelian."),
    ).toBeTruthy();
  });

  test("ubah retur yang sudah diajukan: tidak bisa diubah", async () => {
    onRender(["VIEW", "UPDATE"], rowOf("SUBMITTED").publicId);

    expect(await screen.findByText("Retur tidak bisa diubah")).toBeTruthy();
    expect(
      screen.getByText("Hanya retur berstatus Draf yang bisa diubah."),
    ).toBeTruthy();
  });

  test("publicId tidak dikenal: keadaan tidak ditemukan", async () => {
    onRender(["VIEW", "UPDATE"], "ret-tidak-ada");

    expect(
      await screen.findByText(/retur pembelian.*tidak ditemukan/i),
    ).toBeTruthy();
  });
});

describe("baris penerimaan", () => {
  test("sebelum penerimaan dipilih: diminta memilih dulu", async () => {
    onRender(["VIEW", "CREATE"]);

    expect(
      await screen.findByText("Pilih penerimaan barang terlebih dahulu."),
    ).toBeTruthy();
  });

  test("memuat baris penerimaan mengisi daftarnya", async () => {
    onRender(["VIEW", "CREATE"]);

    await onPickReceipt(/^GRN-2026-0001/);
    await onLoadLines();

    await waitFor(() => expect(lineCount()).toBe(2));
    expect(screen.getByText(/^0 dari 2 baris dikembalikan/)).toBeTruthy();

    onType("items.0.quantity", "2");

    expect(
      await screen.findByText(/^1 dari 2 baris dikembalikan/),
    ).toBeTruthy();
  });

  // Baris milik penerimaan tertentu, jadi mengganti penerimaannya mengosongkannya.
  test("mengganti penerimaan mengosongkan barisnya", async () => {
    onRender(["VIEW", "CREATE"]);

    await onPickReceipt(/^GRN-2026-0001/);
    await onLoadLines();
    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));

    await onPickReceipt(/^GRN-2026-0002/);

    expect(
      await screen.findByText(
        "Belum ada baris. Muat baris penerimaan, lalu hapus yang tidak dikembalikan.",
      ),
    ).toBeTruthy();
  });
});

describe("validasi", () => {
  test("galat muncul saat Simpan, bukan saat blur", async () => {
    onRender(["VIEW", "CREATE"]);

    await screen.findByText("Pilih penerimaan barang terlebih dahulu.");
    expect(screen.queryByText("Pilih penerimaan barang")).toBeNull();

    onSave();

    expect(await screen.findByText("Pilih penerimaan barang")).toBeTruthy();
    expect(screen.getByText("Isi tanggal retur")).toBeTruthy();
    expect(screen.getByText("Isi alasan retur")).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  test("jumlah melebihi yang diterima ditolak sebelum dikirim", async () => {
    onRender(["VIEW", "CREATE"]);

    await onPickReceipt(/^GRN-2026-0001/);
    await onLoadLines();
    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));

    onTypeDate("returnDate", "14/10/2026");
    onType("reason", "Kertas basah");
    onType("items.0.quantity", "999");
    onSave();

    expect(
      await screen.findByText(/Jumlah retur melebihi jumlah diterima/),
    ).toBeTruthy();
    expect(calls).toHaveLength(0);
  });
});

describe("simpan", () => {
  test("POST JSON, lalu halaman retur + sorotan daftar", async () => {
    const queryClient = onRender(["VIEW", "CREATE"]);
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);

    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    await onPickReceipt(/^GRN-2026-0001/);
    await onLoadLines();
    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));

    onTypeDate("returnDate", "14/10/2026");
    onType("reason", "Kertas   tiba   basah");
    onType("items.0.quantity", "2");
    onType("items.0.reason", "Sudut lecek");
    onSave();
    await onYes();

    await waitFor(() => expect(replaced).toHaveLength(1));
    const [call] = calls;
    const body = call?.body as {
      goodsReceiptId: number;
      returnDate: string;
      reason: string;
      items: { goodsReceiptItemId: number; quantity: number }[];
    };

    expect(call?.method).toBe("POST");
    expect(body.returnDate).toBe("2026-10-14");
    expect(body.reason).toBe("Kertas tiba basah");
    expect(body.goodsReceiptId).toBeGreaterThan(0);
    // Baris kedua dibiarkan kosong, jadi tidak ikut terkirim.
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.quantity).toBe(2);
    expect(replaced[0]).toStartWith("/procurement/purchase-return/");
    expect(
      window.sessionStorage.getItem(`list-focus:${RETURN_LIST_PATH}`),
    ).toBeTruthy();
    expect(invalidated).toContainEqual(["purchase-return"]);
  });

  test("ubah draf: PUT ke publicId-nya, isian terisi dari retur", async () => {
    const row = rowOf("DRAFT");
    onRender(["VIEW", "UPDATE"], row.publicId);

    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));
    expect(field("reason").value).toBe(row.reason);

    onType("items.0.quantity", "3");
    onSave();
    await onYes();

    await waitFor(() => expect(replaced).toHaveLength(1));

    expect(calls[0]?.method).toBe("PUT");
    expect(calls[0]?.path).toBe(`/retur-pembelian/${row.publicId}`);
    expect(replaced[0]).toBe(returnHref(row.publicId));
  });

  test("simpan gagal 500: galat tingkat form, isian tetap", async () => {
    override = () =>
      Response.json(
        { status: 500, error: "Internal Server Error" },
        { status: 500 },
      );
    const row = rowOf("DRAFT");
    onRender(["VIEW", "UPDATE"], row.publicId);

    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));
    onType("items.0.quantity", "3");
    onSave();
    await onYes();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(field("items.0.quantity").value).toBe("3");
    expect(replaced).toHaveLength(0);
  });

  // Penolakan sisa retur hanya server yang tahu: penerimaan tidak memberi tahu
  // berapa yang sudah diretur retur sebelumnya.
  test("penolakan sisa retur dari server tampil apa adanya", async () => {
    override = () =>
      Response.json(
        {
          status: 400,
          error:
            "Jumlah Retur Untuk Kertas HVS A4 Melebihi Jumlah Yang Diterima (diterima 10, sudah diretur 9)",
        },
        { status: 400 },
      );
    const row = rowOf("DRAFT");
    onRender(["VIEW", "UPDATE"], row.publicId);

    await waitFor(() => expect(lineCount()).toBeGreaterThan(0));
    onType("items.0.quantity", "3");
    onSave();
    await onYes();

    expect(await screen.findByText(/sudah diretur 9/)).toBeTruthy();
  });
});
