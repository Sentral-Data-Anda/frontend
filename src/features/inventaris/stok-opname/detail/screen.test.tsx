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

import { stokOpnameMock } from "../../../../../scripts/mock/handlers/stok-opname";
import {
  OPNAME,
  STOCK_ITEM,
  STOCK_MOVEMENT,
} from "../../../../../scripts/mock/inventaris-store";
import { SESSION_USER_ID } from "../../../../../scripts/mock-dashboard";

const DRAFT = OPNAME.find((row) => row.status === "DRAFT")!.code;
const POSTED = OPNAME.find((row) => row.status === "POSTED")!.code;
const CANCELLED = OPNAME.find((row) => row.status === "CANCELLED")!.code;
const COMPLETED_BY_VIEWER = OPNAME.find(
  (row) => row.status === "COMPLETED" && row.completedById === SESSION_USER_ID,
)!.code;
const COMPLETED = OPNAME.find(
  (row) => row.status === "COMPLETED" && row.completedById !== SESSION_USER_ID,
)!.code;

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined, push: () => undefined }),
  usePathname: () => `/inventaris/stok-opname/${COMPLETED_BY_VIEWER}`,
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

const { OpnameDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const OPNAME_SNAPSHOT = structuredClone(OPNAME);
const STOCK_SNAPSHOT = structuredClone(STOCK_ITEM);
const MOVEMENT_SNAPSHOT = structuredClone(STOCK_MOVEMENT);

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    return (await stokOpnameMock({
      request: new Request(url, { method }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    })) as Response;
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  OPNAME.splice(0, Infinity, ...structuredClone(OPNAME_SNAPSHOT));
  STOCK_ITEM.splice(0, Infinity, ...structuredClone(STOCK_SNAPSHOT));
  STOCK_MOVEMENT.splice(0, Infinity, ...structuredClone(MOVEMENT_SNAPSHOT));
});

const onRender = (granted: MenuAction[], code: string) => {
  actions.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <OpnameDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const ALL: MenuAction[] = ["VIEW", "UPDATE", "DELETE"];

const actionNames = async () => {
  await screen.findByText("Barang yang dihitung", { selector: "h2" });
  const section = screen.queryByRole("region", { name: "Aksi stok opname" });

  return section
    ? within(section)
        .queryAllByRole("button")
        .map((button) => button.textContent)
        .concat(
          within(section)
            .queryAllByRole("link")
            .map((link) => link.textContent),
        )
    : [];
};

const onConfirm = async (label: string) => {
  fireEvent.click(await screen.findByRole("button", { name: label }));
  const dialog = await screen.findByRole("alertdialog");
  const text = dialog.textContent;

  fireEvent.click(within(dialog).getByRole("button", { name: "Ya" }));

  return text;
};

describe("aksi per status × izin", () => {
  test("Draf: Batalkan, Selesai dihitung, Ubah", async () => {
    onRender(ALL, DRAFT);

    expect(await actionNames()).toEqual([
      "Batalkan",
      "Selesai dihitung",
      "Ubah",
    ]);
  });

  test("Selesai dihitung: Batalkan dan Posting; tanpa UPDATE hanya Batalkan", async () => {
    onRender(ALL, COMPLETED);

    expect(await actionNames()).toEqual(["Batalkan", "Posting"]);
    cleanup();
    onRender(["VIEW", "DELETE"], COMPLETED);

    expect(await actionNames()).toEqual(["Batalkan"]);
  });

  test("Draf tanpa DELETE: tanpa Batalkan", async () => {
    onRender(["VIEW", "UPDATE"], DRAFT);

    expect(await actionNames()).toEqual(["Selesai dihitung", "Ubah"]);
  });

  test("Diposting dan Dibatalkan: tanpa aksi", async () => {
    onRender(ALL, POSTED);
    expect(await actionNames()).toEqual([]);
    cleanup();
    onRender(ALL, CANCELLED);
    expect(await actionNames()).toEqual([]);
  });

  test("tanpa VIEW: keadaan tanpa akses", async () => {
    onRender([], POSTED);

    expect(
      await screen.findByText("Anda tidak memiliki akses ke Stok Opname"),
    ).toBeTruthy();
  });
});

describe("konfirmasi dan galat", () => {
  test("selesai: teks konfirmasi; baris selisih tanpa catatan ditandai", async () => {
    onRender(ALL, DRAFT);

    expect(await onConfirm("Selesai dihitung")).toContain(
      "Apakah Anda ingin menandai stok opname ini selesai dihitung? Hitungan tidak bisa diubah lagi.",
    );
    expect(
      await screen.findByText("Stok opname belum selesai dihitung."),
    ).toBeTruthy();
    expect(screen.getAllByText(/Tulis alasan selisih/).length).toBeGreaterThan(
      0,
    );
  });

  test("posting oleh penyelesai: peringatan di atas tombol dan di dialog; sukses meng-invalidate stok", async () => {
    const queryClient = onRender(ALL, COMPLETED_BY_VIEWER);
    const invalidated: unknown[] = [];
    const original = queryClient.invalidateQueries.bind(queryClient);

    queryClient.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof queryClient.invalidateQueries;

    expect(
      await screen.findByText(
        "Anda sendiri yang menandai hitungan ini selesai; sebaiknya posting dilakukan orang lain.",
      ),
    ).toBeTruthy();
    expect(await onConfirm("Posting")).toContain(
      "Stok 1 barang disesuaikan dengan hitungan fisik dan tidak bisa dibatalkan. Anda sendiri yang menandai hitungan ini selesai; sebaiknya posting dilakukan orang lain.",
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Posting" })).toBeNull(),
    );
    expect(invalidated).toContainEqual(["stock-item"]);
    expect(invalidated).toContainEqual(["stock-movement"]);
    expect(invalidated).toContainEqual(["stock-opname"]);
  });

  test("posting 409 → FormAlert dan penjelasan ulangi", async () => {
    onRender(ALL, COMPLETED);
    await onConfirm("Posting");

    expect(await screen.findByText("Hitungan perlu diulang.")).toBeTruthy();
    expect(
      screen.getByText(
        "Ada Mutasi Kertas HVS A4 Sesudah Tanggal Opname. Ulangi Stok Opname",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeTruthy();
  });

  test("batalkan: teks konfirmasi hapus, status berubah", async () => {
    onRender(ALL, DRAFT);

    expect(await onConfirm("Batalkan")).toContain(
      "Apakah Anda ingin membatalkan stok opname ini? Hitungannya tetap tersimpan sebagai riwayat.",
    );
    expect(await screen.findByText("Dibatalkan")).toBeTruthy();
  });
});
