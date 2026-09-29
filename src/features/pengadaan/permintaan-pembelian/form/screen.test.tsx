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

import { permintaanPembelianMock } from "../../../../../scripts/mock/handlers/permintaan-pembelian";
import type { MockContext } from "../../../../../scripts/mock/kit";
import { PURCHASE_REQUEST } from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";
import { REQUEST_LIST_PATH, requestHref } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/pengadaan/permintaan-pembelian/baru",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { RequestFormScreen } = await import("./screen");

type Call = { method: string; path: string; body: FormData };

const SNAPSHOT = structuredClone(PURCHASE_REQUEST);
const BAPEL = [
  { id: 1, code: "BP-1", name: "Majelis Jemaat" },
  { id: 2, code: "BP-2", name: "Komisi Pemuda" },
];
const originalFetch = globalThis.fetch;
const calls: Call[] = [];
let override: ((call: Call) => Response | null) | null = null;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (path === "/ddl/bapel") {
      return Response.json({ status: 200, message: "OK", data: BAPEL });
    }

    const request = new Request(url, { method });

    if (method !== "GET") {
      const body = init?.body as FormData;
      const call = { method, path, body };

      calls.push(call);
      const forced = override?.(call);

      if (forced) return forced;
      // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
      request.formData = async () => body;
    }

    const context: MockContext = {
      request,
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    return (
      (await permintaanPembelianMock(context)) ??
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
  PURCHASE_REQUEST.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  calls.length = 0;
  replaced.length = 0;
  override = null;
  search.current = "";
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
        <RequestFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const codeOf = (status: string) =>
  PURCHASE_REQUEST.find((row) => row.status === status)?.code ?? "";

const field = (id: string) => document.getElementById(id) as HTMLInputElement;

const onType = (id: string, value: string) =>
  fireEvent.change(field(id), { target: { value } });

const cardCount = () =>
  within(
    screen.getByRole("list", { name: "Barang yang diminta" }),
  ).getAllByRole("listitem").length;

const onPickBapel = async (name: string) => {
  await screen.findByText("Pilih badan pelayanan");
  fireEvent.click(screen.getByLabelText("Badan pelayanan"));
  const option = await screen.findByRole("option", { name });
  fireEvent.pointerDown(option);
  fireEvent.click(option);
  await waitFor(() =>
    expect(screen.getByLabelText("Badan pelayanan").textContent).toBe(name),
  );
};

const onSave = () =>
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

const onYes = async () =>
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ya",
    }),
  );

describe("izin dan status", () => {
  test("tanpa CREATE: keadaan tidak bisa menambah", () => {
    onRender(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah permintaan pembelian"),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat permintaan pembelian."),
    ).toBeTruthy();
  });

  test("ubah permintaan Ditolak: tidak bisa diubah, arahkan ke Ajukan ulang", async () => {
    const code = codeOf("REJECTED");
    onRender(["VIEW", "CREATE", "UPDATE"], code);

    expect(
      await screen.findByText("Permintaan tidak bisa diubah"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Hanya permintaan berstatus Draf yang bisa diubah. Gunakan Ajukan ulang.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ajukan ulang" }).getAttribute("href"),
    ).toBe(`/pengadaan/permintaan-pembelian/baru?salin=${code}`);
  });
});

describe("tambah", () => {
  test("satu kartu kosong; subtotal — lalu Rupiah; tambah barang memfokus nama", async () => {
    onRender(["VIEW", "CREATE"]);

    expect(cardCount()).toBe(1);
    expect(screen.getByText("Subtotal —")).toBeTruthy();

    onType("items.0.quantity", "2");
    onType("items.0.estimatedUnitPrice", "85000");
    expect(field("items.0.estimatedUnitPrice").value).toBe("85.000");
    expect(screen.getByText("Subtotal Rp 170.000")).toBeTruthy();
    expect(
      screen.getByText("1 barang · Perkiraan total Rp 170.000"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.1.name"),
    );
    expect(cardCount()).toBe(2);
  });

  test("harga kosong di baris ke-3: galat di kartunya dan fokus", async () => {
    onRender(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    for (const index of [0, 1, 2]) {
      onType(`items.${index}.name`, `Barang ${index}`);
      onType(`items.${index}.quantity`, "1");
      if (index < 2) onType(`items.${index}.estimatedUnitPrice`, "1000");
    }
    onType("purpose", "Retret");
    onSave();

    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-invalid")).toBe("true"),
    );
    expect(
      document.getElementById("items.2.estimatedUnitPrice-error")?.textContent,
    ).toBe("Isi perkiraan harga satuan");
    expect(calls).toEqual([]);
  });

  test("galat server items.<i>.<field> → kartu yang benar dan fokus", async () => {
    override = () =>
      Response.json(
        {
          status: 400,
          error: "Nama Barang tidak boleh lebih dari 150 karakter",
          issues: [
            {
              path: "items.0.name",
              message: "Nama Barang tidak boleh lebih dari 150 karakter",
            },
          ],
        },
        { status: 400 },
      );
    onRender(["VIEW", "CREATE"]);

    await onPickBapel("Komisi Pemuda");
    onType("purpose", "Retret");
    onType("items.0.name", "Matras");
    onType("items.0.quantity", "2");
    onType("items.0.estimatedUnitPrice", "85000");
    onSave();
    await onYes();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.0.name"),
    );
    expect(document.getElementById("items.0.name-error")?.textContent).toBe(
      "Nama Barang tidak boleh lebih dari 150 karakter",
    );
  });

  test("simpan: multipart, lalu halaman permintaan + invalidasi", async () => {
    const queryClient = onRender(["VIEW", "CREATE"]);
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);

    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    await onPickBapel("Komisi Pemuda");
    onType("purpose", "Retret  pemuda");
    onType("items.0.name", "Matras");
    onType("items.0.quantity", "2");
    onType("items.0.estimatedUnitPrice", "85000");
    onSave();
    await onYes();

    await waitFor(() => expect(replaced).toHaveLength(1));
    const [call] = calls;

    expect(call.method).toBe("POST");
    expect(call.body.get("bapelId")).toBe("2");
    expect(call.body.get("purpose")).toBe("Retret pemuda");
    expect(call.body.get("keepFiles")).toBeNull();
    expect(JSON.parse(String(call.body.get("items")))).toEqual([
      { name: "Matras", quantity: 2, estimatedUnitPrice: 85000 },
    ]);
    expect(replaced[0]).toStartWith(requestHref("PRQ-"));
    expect(
      window.sessionStorage.getItem(`list-focus:${REQUEST_LIST_PATH}`),
    ).toContain("PRQ-");
    expect(invalidated).toContainEqual(["purchase-request"]);
  });

  test("simpan gagal 500: galat tingkat form, isian tetap", async () => {
    override = () =>
      Response.json(
        { status: 500, error: "Internal Server Error" },
        { status: 500 },
      );
    const code = PURCHASE_REQUEST.find(
      (row) => row.status === "DRAFT" && row.attachments.length > 0,
    )?.code as string;
    onRender(["VIEW", "UPDATE"], code);

    await waitFor(() => expect(cardCount()).toBe(3));
    onType("items.1.quantity", "5");
    onSave();
    await onYes();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(field("items.1.quantity").value).toBe("5");
    expect(calls[0].method).toBe("PUT");
    expect(JSON.parse(String(calls[0].body.get("keepFiles")))).toHaveLength(1);
  });
});

describe("ajukan ulang", () => {
  test("?salin= mengisi dari permintaan Ditolak tanpa lampiran", async () => {
    const source = PURCHASE_REQUEST.find((row) => row.status === "REJECTED");
    search.current = `salin=${source?.code}`;
    onRender(["VIEW", "CREATE"]);

    expect(
      await screen.findByRole("heading", {
        name: `Ajukan ulang ${source?.code}`,
      }),
    ).toBeTruthy();
    expect(field("purpose").value).toBe(source?.purpose ?? "");
    expect(field("items.0.name").value).toBe(source?.items[0]?.name ?? "");
    expect(
      screen.getByText(
        `Foto atau PDF penawaran toko, bila ada. Membantu penanda tangan. Lampiran permintaan ${source?.code} tidak ikut disalin.`,
      ),
    ).toBeTruthy();
  });

  test("sumber bukan Ditolak → form kosong biasa", async () => {
    search.current = `salin=${codeOf("DRAFT")}`;
    onRender(["VIEW", "CREATE"]);

    expect(
      await screen.findByRole("heading", {
        name: "Tambah Permintaan Pembelian",
      }),
    ).toBeTruthy();
    await waitFor(() => expect(field("purpose")).toBeTruthy());
    expect(field("purpose").value).toBe("");
  });
});
