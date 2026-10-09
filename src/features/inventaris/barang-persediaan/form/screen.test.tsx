import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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

import type { MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { STOCK_LIST_PATH, movementCreateHref } from "../model";
import type { StockItem } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/inventory/stock-item/baru",
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

const { StockFormScreen } = await import("./screen");

const CODE = "BRP-0001";

const ref = (code: string, name: string) => ({ publicId: code, code, name });

const DETAIL: StockItem = {
  id: 1,
  publicId: "s1",
  code: CODE,
  name: "Lilin Altar",
  description: "",
  quantity: 48,
  reorderPoint: 20,
  lastUnitPrice: null,
  avgUnitPrice: null,
  typeId: 6,
  bapelId: 1,
  roomId: 1,
  unitId: 1,
  type: ref("TYP_ITM-0006", "Perlengkapan Ibadah"),
  bapel: ref("BPL-1", "Majelis Jemaat"),
  room: ref("RM-0001", "Gedung Gereja"),
  unit: ref("UNT-0001", "Buah"),
};

type Call = { method: string; url: string; body: unknown };
type Failure = { status: number; error: string; issues?: unknown[] };

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;
let queryClient: QueryClient;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onMockApi = (options: { save?: Failure; remove?: Failure } = {}) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      calls.push({
        method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const failure = method === "DELETE" ? options.remove : options.save;

      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json({
        status: 200,
        message: "Berhasil Mengubah Barang Persediaan",
        data: DETAIL,
      });
    }
    if (url === `/api/v1/barang-persediaan/${CODE}`) {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Barang Persediaan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
  code?: string,
) => {
  grants.current = granted;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <StockFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (
  actions: MenuAction[] = ["VIEW", "UPDATE"],
  movement: MenuAction[] = [],
) => {
  onRenderForm({ STOCK_ITEM: actions, STOCK_MOVEMENT: movement }, CODE);

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    ),
  );
};

const onConfirm = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE / UPDATE: bukan form", () => {
    onMockApi();
    onRenderForm({ STOCK_ITEM: ["VIEW"] });

    expect(
      screen.getByText("Tidak bisa menambah barang persediaan"),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data barang persediaan."),
    ).toBeTruthy();

    cleanup();
    onRenderForm({ STOCK_ITEM: ["VIEW", "CREATE"] }, CODE);
    expect(
      screen.getByText("Tidak bisa mengubah barang persediaan"),
    ).toBeTruthy();
  });

  test("tambah: stok awal; Hapus tidak ada", () => {
    onMockApi();
    onRenderForm({ STOCK_ITEM: ["VIEW", "CREATE", "DELETE"] });

    expect(screen.getByLabelText("Stok awal")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("ubah: stok hanya dibaca; Catat mutasi hanya dengan CREATE mutasi; Hapus hanya dengan DELETE", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    expect(screen.queryByLabelText("Stok awal")).toBeNull();
    expect(screen.getByText("48 Buah")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Catat mutasi" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"], ["VIEW", "CREATE"]);
    expect(
      screen.getByRole("link", { name: "Catat mutasi" }).getAttribute("href"),
    ).toBe(movementCreateHref(CODE));
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("404: data tidak ditemukan", async () => {
    onMockApi();
    onRenderForm({ STOCK_ITEM: ["VIEW", "UPDATE"] }, "BRP-9999");

    expect(
      await screen.findByText("Data barang persediaan tidak ditemukan"),
    ).toBeTruthy();
  });
});

describe("simpan", () => {
  test("ubah: PUT tanpa openingQuantity, kembali ke daftar + sorot + invalidasi", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();
    queryClient.setQueryData(["stock-item", "list", "page=1"], {});
    queryClient.setQueryData(["ddl", "barang-persediaan?limit=20"], {});

    fireEvent.change(screen.getByLabelText(/Batas stok menipis/), {
      target: { value: "" },
    });
    await onConfirm();

    await waitFor(() => expect(replaced).toEqual([STOCK_LIST_PATH]));
    expect(calls[0]).toEqual({
      method: "PUT",
      url: `/api/v1/barang-persediaan/${CODE}`,
      body: {
        name: "Lilin Altar",
        typeId: 6,
        bapelId: 1,
        roomId: 1,
        unitId: 1,
        reorderPoint: null,
      },
    });
    expect(window.sessionStorage.getItem(`list-focus:${STOCK_LIST_PATH}`)).toBe(
      CODE,
    );
    expect(
      queryClient.getQueryState(["stock-item", "list", "page=1"])
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(["ddl", "barang-persediaan?limit=20"])
        ?.isInvalidated,
    ).toBe(true);
  });

  test("nama kembar (409) → field nama; relasi 404 → field-nya", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Barang Persediaan Sudah Tersedia",
        issues: [{ path: "name", message: "Barang Persediaan Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();
    await onConfirm();

    expect(
      await screen.findByText(
        "Barang persediaan dengan nama ini sudah ada. Pakai nama lain.",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(replaced).toEqual([]);

    cleanup();
    onMockApi({
      save: {
        status: 404,
        error: "Satuan Tidak Ditemukan",
        issues: [{ path: "unitId", message: "Satuan Tidak Ditemukan" }],
      },
    });
    await onRenderLoadedEdit();
    await onConfirm();
    expect(await screen.findByText("Satuan Tidak Ditemukan")).toBeTruthy();
  });

  test("galat 500: galat tingkat form, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Internal Server Error" } });
    await onRenderLoadedEdit();
    await onConfirm();

    await screen.findByText("Data belum tersimpan. Coba simpan lagi.");
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    );
  });
});

describe("hapus", () => {
  test("stok ≠ 0: FormAlert apa adanya", async () => {
    onMockApi({
      remove: {
        status: 400,
        error:
          "Barang Ini Masih Memiliki Stok 48. Keluarkan Stoknya Terlebih Dahulu",
      },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText(/Hanya barang dengan stok 0 yang bisa dihapus/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Barang persediaan belum terhapus."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Barang Ini Masih Memiliki Stok 48. Keluarkan Stoknya Terlebih Dahulu",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("berhasil: kembali ke daftar", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([STOCK_LIST_PATH]));
  });
});
