import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { expenseApproval, expenseDetail } from "../fixtures";
import type { CashExpenseDetail } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/keuangan/kas-keluar/doc-7",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const actions = granted.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { ExpenseDetailScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

const FULL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onRender = (
  expense: CashExpenseDetail,
  access: Record<string, MenuAction[]> = { [MENU.KAS_KELUAR]: FULL },
) => {
  granted.current = access;
  globalThis.fetch = (async () =>
    Response.json({
      status: 200,
      message: "OK",
      data: expense,
    })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Toast.Provider>
        <ExpenseDetailScreen publicId={expense.publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("bahasa layar", () => {
  test("tidak pernah mengucapkan Debit atau Kredit", async () => {
    const { container } = onRender(
      expenseDetail({ journal: { code: "JRN-2026-0031", status: "POSTED" } }),
    );

    await screen.findByText("Dibayarkan kepada");
    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
    expect(container.textContent).toContain("5-100 — Beban Listrik dan Air");
  });

  test("referensi tampil di ringkasan: itu tautan ke pesanannya", async () => {
    onRender(expenseDetail());

    expect(await screen.findByText("Referensi")).toBeTruthy();
    expect(screen.getByText("PSN-2026-0012")).toBeTruthy();
  });
});

describe("keadaan persetujuan", () => {
  test("Menunggu persetujuan diturunkan dari approval, dokumen tetap Draf", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    expect(await screen.findByText("Menunggu persetujuan")).toBeTruthy();
    expect(screen.queryByText("Draf")).toBeNull();
  });

  test("ditolak: tetap Draf, catatan penolak tampil, boleh diubah lagi", async () => {
    onRender(
      expenseDetail({
        approval: expenseApproval({
          status: "REJECTED",
          note: "Kas komisi belum cukup bulan ini.",
        }),
      }),
    );

    expect(await screen.findByText("Draf")).toBeTruthy();
    expect(screen.getByText(/Kas komisi belum cukup bulan ini\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
  });

  test("tautan ke permintaan persetujuan hanya dengan izin Persetujuan", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    await screen.findByText("Menunggu persetujuan");
    expect(screen.queryByRole("link", { name: "PST-2026-0007" })).toBeNull();

    cleanup();
    onRender(expenseDetail({ approval: expenseApproval() }), {
      [MENU.KAS_KELUAR]: FULL,
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW"],
    });

    expect(
      (await screen.findByRole("link", { name: "PST-2026-0007" })).getAttribute(
        "href",
      ),
    ).toBe(
      "/persetujuan/permintaan-persetujuan/0b5e7a00-0000-4000-a000-000000000007",
    );
  });
});

describe("aksi status", () => {
  test("draf tanpa pengajuan: Ubah, Hapus, Ajukan — tanpa Bayar", async () => {
    onRender(expenseDetail());

    expect(await screen.findByRole("button", { name: "Ajukan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ubah" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bayar" })).toBeNull();
  });

  test("menunggu: Ubah dan Hapus hilang; tarik hanya untuk pengaju", async () => {
    onRender(expenseDetail({ approval: expenseApproval() }));

    expect(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(
      expenseDetail({
        approval: expenseApproval({ isSubmittedByViewer: false }),
      }),
    );

    await screen.findByText("Menunggu persetujuan");
    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
  });

  test("Bayar hanya dari Disetujui", async () => {
    onRender(
      expenseDetail({
        status: "APPROVED",
        approval: expenseApproval({ status: "APPROVED" }),
      }),
    );

    expect(await screen.findByRole("button", { name: "Bayar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeTruthy();

    cleanup();
    onRender(expenseDetail({ status: "PAID" }));

    await screen.findByText("Dibayar");
    expect(screen.queryByRole("button", { name: "Bayar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeTruthy();
  });

  test("Batalkan menanyakan alasan di halaman, bukan di dalam dialog", async () => {
    onRender(expenseDetail({ status: "PAID" }));

    fireEvent.click(await screen.findByRole("button", { name: "Batalkan" }));

    expect(
      await screen.findByRole("textbox", { name: /Alasan pembatalan/ }),
    ).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  test("tanpa UPDATE dan DELETE: tidak ada aksi yang dirender", async () => {
    onRender(expenseDetail(), { [MENU.KAS_KELUAR]: ["VIEW"] });

    await screen.findByText("Dibayarkan kepada");
    expect(screen.queryByRole("button", { name: "Ajukan" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });
});

describe("entri jurnal", () => {
  test("dibayar: barisnya tampil dan menautkan entrinya dengan izin Jurnal", async () => {
    onRender(
      expenseDetail({
        status: "PAID",
        journal: { code: "JRN-2026-0031", status: "POSTED" },
      }),
      { [MENU.KAS_KELUAR]: FULL, [MENU.JURNAL]: ["VIEW"] },
    );

    expect(
      (await screen.findByRole("link", { name: "JRN-2026-0031" })).getAttribute(
        "href",
      ),
    ).toBe("/keuangan/jurnal/JRN-2026-0031");
  });

  test("draf: tidak ada baris entri jurnal", async () => {
    onRender(expenseDetail());

    await screen.findByText("Dibayarkan kepada");
    expect(screen.queryByText("Entri jurnal")).toBeNull();
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan ke server", () => {
    let isFetched = false;
    granted.current = {};
    globalThis.fetch = (async () => {
      isFetched = true;

      return Response.json({ status: 200, data: expenseDetail() });
    }) as unknown as typeof fetch;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Toast.Provider>
          <ExpenseDetailScreen publicId="doc-7" />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kas Keluar"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });
});
