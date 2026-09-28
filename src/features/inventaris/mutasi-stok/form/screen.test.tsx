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
import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { MUTASI_LIST_PATH } from "../model";
import type { StockOption } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};
const search: { current: string } = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/inventaris/mutasi-stok/baru",
  useSearchParams: () => new URLSearchParams(search.current),
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

const { MutasiFormScreen } = await import("./screen");

const ROWS: StockOption[] = [
  {
    id: 1,
    code: "BRP-0001",
    name: "Lilin Altar",
    quantity: 48,
    unit: { name: "Buah" },
    room: { id: 1, name: "Gedung Gereja" },
  },
  {
    id: 2,
    code: "BRP-0002",
    name: "Roti Perjamuan",
    quantity: 3,
    unit: { name: "Pak" },
    room: { id: 1, name: "Gedung Gereja" },
  },
];

type Call = { url: string; body: unknown };
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
  search.current = "";
});

const onMockApi = (failure?: Failure) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (init?.method === "POST") {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Menambahkan Mutasi Stok",
          data: { publicId: "mv-new" },
        },
        { status: 201 },
      );
    }

    const filter = new URL(url, "http://x").searchParams.get("filter") ?? "";

    return Response.json({
      status: 200,
      data: ROWS.filter((row) => row.code.includes(filter)),
    });
  }) as typeof fetch;

  return calls;
};

const onRenderForm = async (
  granted: Partial<Record<MenuSlug, MenuAction[]>> = {
    MUTASI_STOK: ["VIEW", "CREATE"],
  },
  query = "barang=BRP-0002",
) => {
  grants.current = granted;
  search.current = query;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <MutasiFormScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  if (query) await screen.findByText("Stok 3 Pak · Gedung Gereja");
};

const onSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

describe("form mutasi stok", () => {
  test("tanpa CREATE: bukan form", async () => {
    onMockApi();
    await onRenderForm({ MUTASI_STOK: ["VIEW"] }, "");

    expect(screen.getByText("Tidak bisa mencatat mutasi stok")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat mutasi stok."),
    ).toBeTruthy();
  });

  test("?barang= mengisi awal; bawaan Keluar · Pemakaian; tanpa Koreksi dan Pindah lokasi", async () => {
    onMockApi();
    await onRenderForm();

    expect(
      (screen.getByRole("radio", { name: "Keluar" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Pemakaian" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.queryByRole("radio", { name: "Koreksi" })).toBeNull();
    expect(screen.queryByRole("radio", { name: /Pindah lokasi/ })).toBeNull();
    expect(screen.getByLabelText("Jumlah (Pak)")).toBeTruthy();
  });

  test("Keluar melebihi stok: galat FE, dialog tidak terbuka", async () => {
    const calls = onMockApi();
    await onRenderForm();

    fireEvent.change(screen.getByLabelText("Jumlah (Pak)"), {
      target: { value: "5" },
    });
    onSave();

    expect(
      await screen.findAllByText("Stok tidak cukup. Sisa 3 Pak."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
    expect(calls).toEqual([]);
  });

  test("Masuk Donasi tanpa catatan ditolak; dengan pemberi → POST, sorot, invalidasi", async () => {
    const calls = onMockApi();
    await onRenderForm();
    queryClient.setQueryData(["stock-movement", "list", "page=1"], {});
    queryClient.setQueryData(["stock-item", "list", "page=1"], {});
    queryClient.setQueryData(["ddl", "barang-persediaan?roomId=1"], {});

    fireEvent.click(screen.getByRole("radio", { name: "Masuk" }));
    expect(
      (screen.getByRole("radio", { name: "Donasi" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Jumlah (Pak)"), {
      target: { value: "20" },
    });
    onSave();
    expect(await screen.findByText("Tulis nama pemberi")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Pemberi dan catatan"), {
      target: { value: "Ibu Rina" },
    });
    onSave();
    expect(
      await screen.findByText(
        "Apakah Anda ingin menyimpan mutasi ini? Mutasi tidak bisa diubah atau dihapus.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([MUTASI_LIST_PATH]));
    expect(calls[0]).toEqual({
      url: "/api/v1/mutasi-stok",
      body: {
        stockItemId: 2,
        type: "IN",
        source: "DONATION",
        quantity: 20,
        movementDate: todayJakarta(),
        note: "Ibu Rina",
      },
    });
    expect(
      window.sessionStorage.getItem(`list-focus:${MUTASI_LIST_PATH}`),
    ).toBe("mv-new");
    for (const key of [
      ["stock-movement", "list", "page=1"],
      ["stock-item", "list", "page=1"],
      ["ddl", "barang-persediaan?roomId=1"],
    ]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });

  test("galat server: stok kurang tanpa issues → Jumlah; tanggal → Tanggal", async () => {
    onMockApi({
      status: 400,
      error: "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 1",
    });
    await onRenderForm();

    fireEvent.change(screen.getByLabelText("Jumlah (Pak)"), {
      target: { value: "2" },
    });
    onSave();
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText(
        "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 1",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("quantity"));

    cleanup();
    onMockApi({
      status: 400,
      error: "Tanggal Mutasi Tidak Boleh Sebelum 18 September 2026",
      issues: [
        {
          path: "movementDate",
          message: "Tanggal Mutasi Tidak Boleh Sebelum 18 September 2026",
        },
      ],
    });
    await onRenderForm();
    fireEvent.change(screen.getByLabelText("Jumlah (Pak)"), {
      target: { value: "1" },
    });
    onSave();
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
    expect(
      await screen.findByText(
        "Tanggal Mutasi Tidak Boleh Sebelum 18 September 2026",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat 500 dan sumber milik proses lain → galat tingkat form", async () => {
    onMockApi({ status: 500, error: "Internal Server Error" });
    await onRenderForm();

    fireEvent.change(screen.getByLabelText("Jumlah (Pak)"), {
      target: { value: "1" },
    });
    onSave();
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Mutasi belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Jumlah (Pak)") as HTMLInputElement).value,
    ).toBe("1");
  });
});
