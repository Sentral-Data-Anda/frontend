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

import { returPembelianMock } from "../../../../../scripts/mock/handlers/retur-pembelian";
import type { MockContext } from "../../../../../scripts/mock/kit";
import {
  PURCHASE_RETURN,
  type PurchaseReturnRow,
} from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";
import { RETURN_LIST_PATH } from "../model";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/procurement/purchase-return/ret",
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

const { ReturnDetailScreen } = await import("./screen");

const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];
const SNAPSHOT = structuredClone(PURCHASE_RETURN);

const originalFetch = globalThis.fetch;
const calls: { method: string; path: string }[] = [];
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (method !== "GET") calls.push({ method, path });

    const context: MockContext = {
      request: new Request(url, { method }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    return (
      (await returPembelianMock(context)) ??
      Response.json(
        { status: 200, message: "Berhasil Mendapatkan Data", data: [] },
        { status: 200 },
      )
    );
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  PURCHASE_RETURN.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  calls.length = 0;
  replaced.length = 0;
  delete process.env.MOCK_RETURN_ACTION_500;
});

const onRender = (
  publicId: string,
  granted: Partial<Record<MenuSlug, MenuAction[]>> = {
    [MENU.PURCHASE_RETURN]: ALL,
  },
) => {
  grants.current = granted;

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ReturnDetailScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const rowOf = (
  status: PurchaseReturnRow["status"],
  isApproved?: boolean,
): PurchaseReturnRow =>
  PURCHASE_RETURN.find(
    (row) =>
      row.status === status &&
      (isApproved === undefined || (row.approvedAt !== null) === isApproved),
  ) as PurchaseReturnRow;

const actionNames = () =>
  [
    ...screen
      .getByRole("region", { name: "Aksi retur" })
      .querySelectorAll("button, a"),
  ].map((node) => node.textContent);

const onConfirm = async (name: string, text: RegExp) => {
  fireEvent.click(screen.getByRole("button", { name }));
  const dialog = await screen.findByRole("alertdialog");

  expect(within(dialog).getByText(text)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Ya" }));
};

describe("aksi per status", () => {
  test("Draf: Hapus, Ubah, Ajukan", async () => {
    onRender(rowOf("DRAFT").publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    expect(actionNames()).toEqual(["Hapus", "Ubah", "Ajukan"]);
  });

  test("Draf tanpa UPDATE/DELETE: tanpa aksi", async () => {
    const row = rowOf("DRAFT");
    onRender(row.publicId, { [MENU.PURCHASE_RETURN]: ["VIEW", "CREATE"] });

    await screen.findByRole("heading", { name: row.reason });
    expect(screen.queryByRole("region", { name: "Aksi retur" })).toBeNull();
  });

  // Status SUBMITTED saja tidak cukup: `complete` di be-sada menolak retur
  // yang `approvedAt`-nya belum ditulis hook persetujuan.
  test("Diajukan tapi belum disetujui: hanya Batalkan", async () => {
    onRender(rowOf("SUBMITTED", false).publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    expect(actionNames()).toEqual(["Batalkan"]);
  });

  test("Sudah disetujui: Batalkan dan Selesaikan", async () => {
    onRender(rowOf("SUBMITTED", true).publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    expect(actionNames()).toEqual(["Batalkan", "Selesaikan"]);
  });

  test("Dibatalkan: tanpa aksi", async () => {
    const dropped = rowOf("CANCELLED");
    onRender(dropped.publicId);

    await screen.findByRole("heading", { name: dropped.reason });
    expect(screen.queryByRole("region", { name: "Aksi retur" })).toBeNull();
  });

  test("Batalkan hanya dengan DELETE", async () => {
    onRender(rowOf("SUBMITTED", true).publicId, {
      [MENU.PURCHASE_RETURN]: ["VIEW", "UPDATE"],
    });

    await screen.findByRole("region", { name: "Aksi retur" });
    expect(actionNames()).toEqual(["Selesaikan"]);
  });
});

describe("konfirmasi", () => {
  test("Selesaikan menyebut akibatnya dan tidak bisa dibatalkan", async () => {
    onRender(rowOf("SUBMITTED", true).publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    await onConfirm("Selesaikan", /tidak bisa dibatalkan/);

    await waitFor(() =>
      expect(calls.some((call) => call.path.endsWith("/selesai"))).toBe(true),
    );
  });

  test("Ajukan memakai POST /pengajuan", async () => {
    onRender(rowOf("DRAFT").publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    await onConfirm("Ajukan", /mengajukan retur ini/);

    await waitFor(() =>
      expect(
        calls.some(
          (call) => call.method === "POST" && call.path.endsWith("/pengajuan"),
        ),
      ).toBe(true),
    );
  });

  test("Hapus kembali ke daftar", async () => {
    onRender(rowOf("DRAFT").publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    await onConfirm("Hapus", /menghapus data retur pembelian ini/);

    await waitFor(() => expect(replaced.at(-1)).toBe(RETURN_LIST_PATH));
  });
});

describe("keadaan", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender("ret-apa-pun", {});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Purchase Return"),
    ).toBeTruthy();
  });

  test("publicId tidak dikenal: keadaan tidak ditemukan", async () => {
    onRender("ret-tidak-ada");

    expect(
      await screen.findByText(/retur pembelian.*tidak ditemukan/i),
    ).toBeTruthy();
  });

  test("aksi gagal: pesan server tampil dan isian tetap", async () => {
    process.env.MOCK_RETURN_ACTION_500 = "1";
    onRender(rowOf("DRAFT").publicId);

    await screen.findByRole("region", { name: "Aksi retur" });
    await onConfirm("Ajukan", /mengajukan retur ini/);

    expect(await screen.findByText("Retur belum diajukan.")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Aksi retur" })).toBeTruthy();
  });

  // Retur tidak membawa hasil tanda tangannya, jadi layar tidak boleh
  // mengaku tahu bedanya menunggu, ditolak, dan ditarik.
  test("diajukan: ringkasan tidak mengaku tahu hasil tanda tangannya", async () => {
    onRender(rowOf("SUBMITTED", false).publicId);

    expect(
      await screen.findByText("Sudah diajukan, belum disetujui"),
    ).toBeTruthy();
    expect(screen.getByText(/Status sebenarnya/)).toBeTruthy();
  });
});

describe("baris", () => {
  test("baris retur menampilkan jumlah diretur dan yang diterima", async () => {
    const row = rowOf("DRAFT");
    onRender(row.publicId);

    const list = await screen.findByRole("list", {
      name: "Barang yang dikembalikan",
    });

    expect(within(list).getAllByText(/Kertas HVS/).length).toBeGreaterThan(0);
    expect(within(list).getByText(/Diterima 10/)).toBeTruthy();
  });
});
