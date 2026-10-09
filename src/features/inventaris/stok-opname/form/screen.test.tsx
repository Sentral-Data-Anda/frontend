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

import { fasilitasMock } from "../../../../../scripts/mock/handlers/fasilitas";
import { inventarisMock } from "../../../../../scripts/mock/handlers/inventaris";
import { stokOpnameMock } from "../../../../../scripts/mock/handlers/stok-opname";
import {
  OPNAME,
  STOCK_ITEM,
  isLive,
} from "../../../../../scripts/mock/inventaris-store";
import type { MockContext } from "../../../../../scripts/mock/kit";
import { onStubViewport } from "../../../../../tests/viewport";
import { OPNAME_LIST_PATH } from "../model";

const POSTED = OPNAME.find((row) => row.status === "POSTED")!.code;
const DRAFT = OPNAME.find((row) => row.status === "DRAFT")!.code;

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/inventory/stok-opname/baru",
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

const { OpnameFormScreen } = await import("./screen");

type Call = { method: string; path: string; body: Record<string, unknown> };

const HANDLERS = [stokOpnameMock, inventarisMock, fasilitasMock];
const originalFetch = globalThis.fetch;
const SNAPSHOT = structuredClone(OPNAME);
const calls: Call[] = [];
let override: ((call: Call) => Response | null) | null = null;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (method !== "GET") {
      const call = { method, path, body };

      calls.push(call);
      const forced = override?.(call);

      if (forced) return forced;
    }

    const context: MockContext = {
      request: new Request(url, {
        method,
        body: init?.body ? String(init.body) : undefined,
      }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
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
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  OPNAME.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  calls.length = 0;
  replaced.length = 0;
  override = null;
  window.sessionStorage.clear();
});

const onRender = (granted: MenuAction[], code?: string) => {
  actions.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <OpnameFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const rowCount = () =>
  within(
    screen.getByRole("list", { name: "Barang yang dihitung" }),
  ).getAllByRole("listitem").length;

const physicalOf = (index: number) =>
  document.getElementById(
    `items.${index}.physicalQuantity`,
  ) as HTMLInputElement;

const onSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

const onYes = async () =>
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ya",
    }),
  );

const liveStock = () =>
  STOCK_ITEM.filter(isLive).sort((a, b) => a.name.localeCompare(b.name));

describe("izin dan status", () => {
  test("tanpa CREATE: keadaan tidak bisa menambah", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah stok opname")).toBeTruthy();
  });

  test("ubah opname Diposting: keadaan tidak bisa diubah", async () => {
    onRender(["VIEW", "UPDATE"], POSTED);

    expect(
      await screen.findByText("Stok opname tidak bisa diubah"),
    ).toBeTruthy();
    expect(
      screen.getByText("Hanya stok opname berstatus Draf yang bisa diubah."),
    ).toBeTruthy();
  });
});

describe("tambah", () => {
  test("muat semua barang mengisi baris sekali; fisik kosong ditolak dan difokuskan", async () => {
    onRender(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Muat semua barang" }));
    await waitFor(() => expect(rowCount()).toBe(liveStock().length));
    expect(screen.queryByRole("button", { name: /Muat/ })).toBeNull();
    expect(
      screen.getByText(
        `${liveStock().length} barang · 0 selisih · ${liveStock().length} belum diisi`,
      ),
    ).toBeTruthy();

    onSave();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.0.physicalQuantity"),
    );
    expect(screen.getAllByText("Isi jumlah fisik").length).toBe(
      liveStock().length,
    );
    expect(calls).toEqual([]);
  });

  test("simpan: payload seluruh gereja tanpa systemQuantity, kembali ke daftar tersorot", async () => {
    const queryClient = onRender(["VIEW", "CREATE"]);
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);

    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    fireEvent.click(screen.getByRole("button", { name: "Muat semua barang" }));
    await waitFor(() => expect(rowCount()).toBe(liveStock().length));

    liveStock().forEach((item, index) =>
      fireEvent.change(physicalOf(index), {
        target: {
          value: String(index === 0 ? item.quantity + 2 : item.quantity),
        },
      }),
    );
    fireEvent.change(document.getElementById("items.0.note") as HTMLElement, {
      target: { value: "Ketemu di gudang" },
    });
    expect(screen.getByText("+2")).toBeTruthy();

    onSave();
    await onYes();

    await waitFor(() => expect(replaced).toEqual([OPNAME_LIST_PATH]));
    const [call] = calls;

    expect(call.method).toBe("POST");
    expect(call.body.roomId).toBeNull();
    expect(JSON.stringify(call.body)).not.toContain("systemQuantity");
    expect((call.body.items as { note: string | null }[])[0].note).toBe(
      "Ketemu di gudang",
    );
    expect(
      window.sessionStorage.getItem(`list-focus:${OPNAME_LIST_PATH}`),
    ).toContain("OPN-");
    expect(invalidated).toContainEqual(["stock-opname"]);
  });
});

describe("ubah Draf Aula", () => {
  test("baris selisih tanpa catatan ditolak di FE", async () => {
    onRender(["VIEW", "UPDATE"], DRAFT);

    await waitFor(() => expect(rowCount()).toBe(3));
    onSave();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.1.note"),
    );
    expect(screen.getByText("Tulis alasan selisih")).toBeTruthy();
  });

  test("galat server items.<i>.stockItemId → baris yang benar dan fokus", async () => {
    override = () =>
      Response.json(
        {
          status: 400,
          error: "Barang Tidak Berada Di Ruang Ini",
          issues: [
            {
              path: "items.2.stockItemId",
              message: "Barang Tidak Berada Di Ruang Ini",
            },
          ],
        },
        { status: 400 },
      );
    onRender(["VIEW", "UPDATE"], DRAFT);

    await waitFor(() => expect(rowCount()).toBe(3));
    fireEvent.change(document.getElementById("items.1.note") as HTMLElement, {
      target: { value: "Sobek" },
    });
    onSave();
    await onYes();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.2.stockItemId"),
    );
    expect(
      document.getElementById("items.2.stockItemId-error")?.textContent,
    ).toBe("Barang Tidak Berada Di Ruang Ini");
    expect(calls[0].method).toBe("PUT");
  });

  test("simpan gagal 500: galat tingkat form, isian tetap", async () => {
    override = () =>
      Response.json(
        { status: 500, error: "Internal Server Error" },
        { status: 500 },
      );
    onRender(["VIEW", "UPDATE"], DRAFT);

    await waitFor(() => expect(rowCount()).toBe(3));
    fireEvent.change(document.getElementById("items.1.note") as HTMLElement, {
      target: { value: "Sobek" },
    });
    onSave();
    await onYes();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(rowCount()).toBe(3);
  });
});
