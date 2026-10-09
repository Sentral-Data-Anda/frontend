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

import { permintaanPembelianMock } from "../../../../../scripts/mock/handlers/permintaan-pembelian";
import type { MockContext } from "../../../../../scripts/mock/kit";
import { PURCHASE_REQUEST } from "../../../../../scripts/mock/pengadaan-store";
import { SESSION_USER_ID } from "../../../../../scripts/mock-dashboard";
import { onStubViewport } from "../../../../../tests/viewport";
import { REQUEST_LIST_PATH } from "../model";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/procurement/purchase-request/PRQ",
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

const { RequestDetailScreen } = await import("./screen");

const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];
const SNAPSHOT = structuredClone(PURCHASE_REQUEST);
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
  delete process.env.MOCK_PR_NO_WORKFLOW;
});

const onRender = (
  code: string,
  granted: Partial<Record<MenuSlug, MenuAction[]>> = {
    [MENU.PURCHASE_REQUEST]: ALL,
  },
) => {
  grants.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <RequestDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const rowOf = (status: string, isMine?: boolean) =>
  PURCHASE_REQUEST.find(
    (row) =>
      row.status === status &&
      (isMine === undefined ||
        (row.requestedBy === SESSION_USER_ID) === isMine),
  ) as (typeof PURCHASE_REQUEST)[number];

const actionNames = () =>
  [
    ...screen
      .getByRole("region", { name: "Aksi permintaan" })
      .querySelectorAll("button, a"),
  ].map((node) => node.textContent);

const onConfirm = async (name: string, text: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
  const dialog = await screen.findByRole("alertdialog");

  expect(within(dialog).getByText(text)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Ya" }));
};

describe("aksi per status", () => {
  test("Draf: Hapus, Ubah, Ajukan", async () => {
    onRender(rowOf("DRAFT").code);

    await screen.findByRole("region", { name: "Aksi permintaan" });
    expect(actionNames()).toEqual(["Hapus", "Ubah", "Ajukan"]);
  });

  test("Draf tanpa UPDATE/DELETE: tanpa aksi", async () => {
    const row = rowOf("DRAFT");
    onRender(row.code, { [MENU.PURCHASE_REQUEST]: ["VIEW", "CREATE"] });

    await screen.findByRole("heading", { name: row.purpose });
    expect(
      screen.queryByRole("region", { name: "Aksi permintaan" }),
    ).toBeNull();
  });

  test("Menunggu: Tarik hanya untuk pengaju", async () => {
    onRender(rowOf("PENDING_APPROVAL", true).code);
    await screen.findByRole("region", { name: "Aksi permintaan" });
    expect(actionNames()).toEqual(["Tarik pengajuan"]);
    cleanup();

    const other = rowOf("PENDING_APPROVAL", false);
    onRender(other.code);
    await screen.findByRole("heading", { name: other.purpose });
    expect(
      screen.queryByRole("region", { name: "Aksi permintaan" }),
    ).toBeNull();
  });

  test("Ditolak: hanya Ajukan ulang, catatan penolak tampil", async () => {
    const row = rowOf("REJECTED");
    onRender(row.code);

    await screen.findByRole("region", { name: "Aksi permintaan" });
    expect(actionNames()).toEqual(["Ajukan ulang"]);
    expect(
      screen.getByRole("link", { name: "Ajukan ulang" }).getAttribute("href"),
    ).toBe(`/procurement/purchase-request/baru?salin=${row.code}`);
    expect(screen.getByText(/Catatan penolak: Kas komisi/)).toBeTruthy();
    expect(
      within(
        screen.getByRole("region", { name: "Ringkasan permintaan" }),
      ).getByText(row.purpose),
    ).toBeTruthy();
  });

  test("Disetujui: Buat pesanan hanya dengan PESANAN CREATE", async () => {
    const row = rowOf("APPROVED");
    onRender(row.code, {
      [MENU.PURCHASE_REQUEST]: ALL,
      [MENU.PURCHASE_ORDER]: ["VIEW", "CREATE"],
    });

    await screen.findByRole("region", { name: "Aksi permintaan" });
    expect(
      screen.getByRole("link", { name: "Buat pesanan" }).getAttribute("href"),
    ).toBe(`/procurement/purchase-order/baru?permintaan=${row.code}`);
    expect(screen.getByText(/ dari Rp /)).toBeTruthy();
    cleanup();

    onRender(row.code);
    await screen.findByRole("heading", { name: row.purpose });
    expect(screen.queryByRole("link", { name: "Buat pesanan" })).toBeNull();
  });
});

describe("tautan persetujuan", () => {
  test("tertaut hanya dengan APPROVAL_REQUEST VIEW", async () => {
    const row = rowOf("REJECTED");
    const approval = row.approvals.at(-1);
    onRender(row.code, {
      [MENU.PURCHASE_REQUEST]: ["VIEW"],
      [MENU.APPROVAL_REQUEST]: ["VIEW"],
    });

    const link = await screen.findByRole("link", { name: /· Ditolak/ });
    expect(link.getAttribute("href")).toBe(
      `/approval/approval-request/${approval?.publicId}`,
    );
    cleanup();

    onRender(row.code, { [MENU.PURCHASE_REQUEST]: ["VIEW"] });
    await screen.findByText(/· Ditolak/);
    expect(screen.queryByRole("link", { name: /· Ditolak/ })).toBeNull();
  });
});

describe("jalankan aksi", () => {
  test("ajukan: teks konfirmasi, lalu Menunggu", async () => {
    const row = rowOf("DRAFT", true);
    onRender(row.code);

    await screen.findByRole("button", { name: "Ajukan" });
    await onConfirm(
      "Ajukan",
      "Apakah Anda ingin mengajukan permintaan ini untuk disetujui? Permintaan tidak bisa diubah selama menunggu.",
    );

    expect(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    ).toBeTruthy();
    expect(calls).toEqual([
      {
        method: "POST",
        path: `/permintaan-pembelian/${row.code}/pengajuan`,
      },
    ]);
  });

  test("tarik: teks konfirmasi, lalu kembali Draf", async () => {
    const row = rowOf("PENDING_APPROVAL", true);
    onRender(row.code);

    await screen.findByRole("button", { name: "Tarik pengajuan" });
    await onConfirm(
      "Tarik pengajuan",
      "Apakah Anda ingin menarik pengajuan ini? Permintaan kembali menjadi Draf.",
    );

    expect(await screen.findByRole("button", { name: "Ajukan" })).toBeTruthy();
    expect(calls[0]?.method).toBe("PUT");
  });

  test("tanpa alur: galat server, tetap Draf", async () => {
    process.env.MOCK_PR_NO_WORKFLOW = "1";
    onRender(rowOf("DRAFT").code);

    await screen.findByRole("button", { name: "Ajukan" });
    await onConfirm(
      "Ajukan",
      "Apakah Anda ingin mengajukan permintaan ini untuk disetujui? Permintaan tidak bisa diubah selama menunggu.",
    );

    expect(await screen.findByText("Permintaan belum diajukan.")).toBeTruthy();
    expect(
      screen.getByText(
        "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ajukan" })).toBeTruthy();
  });

  test("hapus: konfirmasi standar, lalu kembali ke daftar", async () => {
    onRender(rowOf("DRAFT").code);

    await screen.findByRole("button", { name: "Hapus" });
    await onConfirm(
      "Hapus",
      "Apakah Anda ingin menghapus data permintaan pembelian ini?",
    );

    await waitFor(() => expect(replaced).toEqual([REQUEST_LIST_PATH]));
  });
});
