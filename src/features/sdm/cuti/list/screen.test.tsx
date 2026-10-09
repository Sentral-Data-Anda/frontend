import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { Cuti } from "../types";

const grants: { current: Partial<Record<string, MenuAction[]>> } = {
  current: {},
};

const search = { current: "" };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/hr/leave",
  useSearchParams: () => new URLSearchParams(search.current),
}));

// Sadar-slug: mock yang mengabaikan argumennya membuat layar bisa menjaga
// menu yang salah sementara suite tetap hijau.
mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => ({
    isCanView: Boolean(grants.current[slug]?.includes("VIEW")),
    isCanCreate: Boolean(grants.current[slug]?.includes("CREATE")),
    isCanUpdate: Boolean(grants.current[slug]?.includes("UPDATE")),
    isCanDelete: Boolean(grants.current[slug]?.includes("DELETE")),
  }),
}));

const { CutiListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const REASON = "Mendampingi orang tua kontrol ke rumah sakit jiwa";

const ROWS: Cuti[] = [
  {
    id: 1,
    publicId: "cti-1",
    code: "CTI-0001",
    karyawanId: 1,
    leaveTypeId: 1,
    startDate: "2026-05-12T00:00:00.000Z",
    endDate: "2026-05-16T00:00:00.000Z",
    totalDays: "5",
    reason: REASON,
    status: "PENDING",
    rejectedReason: null,
    approvedAt: null,
    karyawan: {
      publicId: "kry-1",
      code: "KRY-0001",
      name: "Ani Wijaya",
      position: "Sekretaris",
    },
    leaveType: {
      publicId: "tct-1",
      code: "TCT-0001",
      name: "Cuti Tahunan",
      isPaid: true,
      maxDaysPerYear: 12,
    },
  },
  {
    id: 2,
    publicId: "cti-2",
    code: "CTI-0002",
    karyawanId: 2,
    leaveTypeId: 2,
    startDate: "2026-04-02T00:00:00.000Z",
    endDate: "2026-04-02T00:00:00.000Z",
    totalDays: "0.5",
    reason: "Kontrol kehamilan",
    status: "APPROVED",
    rejectedReason: null,
    approvedAt: "2026-03-20T03:00:00.000Z",
    karyawan: {
      publicId: "kry-2",
      code: "KRY-0002",
      name: "Budi Santoso",
      position: "Koster",
    },
    leaveType: {
      publicId: "tct-2",
      code: "TCT-0002",
      name: "Cuti Sakit",
      isPaid: true,
      maxDaysPerYear: 14,
    },
  },
];

const onMockApi = (rows: Cuti[] = ROWS) => {
  const urls: string[] = [];

  globalThis.fetch = ((input: string | URL) => {
    const href = String(input);
    if (!href.includes("/ddl/")) urls.push(href);

    if (href.includes("/ddl/")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: [] }),
      );
    }

    if (rows.length === 0) {
      return Promise.resolve(
        Response.json(
          { status: 404, error: "Pengajuan Cuti Tidak Ditemukan" },
          { status: 404 },
        ),
      );
    }

    return Promise.resolve(
      Response.json({
        status: 200,
        message: "ok",
        totalData: rows.length,
        totalPage: 1,
        data: rows,
      }),
    );
  }) as unknown as typeof fetch;

  return urls;
};

const onRender = (granted: Partial<Record<string, MenuAction[]>>) => {
  grants.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CutiListScreen />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  search.current = "";
});

describe("gerbang izin daftar cuti", () => {
  test("tanpa LEAVE VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender({});

    expect(screen.getByText("Anda tidak memiliki akses ke Leave")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("VIEW atas menu LAIN tidak membuka Cuti", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender({ [MENU.LEAVE_TYPE]: ["VIEW", "CREATE"] });

    expect(screen.getByText("Anda tidak memiliki akses ke Leave")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("tanpa CREATE: tombol ajukan tidak ada di DOM", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    await screen.findAllByText("Ani Wijaya");
    expect(screen.queryByLabelText("Ajukan cuti")).toBeNull();
  });

  test("dengan CREATE: tombol ajukan dirender", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW", "CREATE"] });

    await screen.findAllByText("Ani Wijaya");
    expect(screen.getByLabelText("Ajukan cuti")).toBeTruthy();
  });
});

describe("§0.3 no. 4 — alasan tidak pernah di daftar", () => {
  // Dua bentuk, bukan satu: `DataList` merender TABEL di >= 48rem dan BARIS
  // di bawahnya, dan baris HP punya `meta` sendiri yang tidak dilewati
  // konfigurasi kolom. Satu lebar saja menguji separuh layar.
  //
  // Langit-langitnya, tertulis supaya hijaunya tidak terbaca sebagai cakupan
  // yang tidak ia punya: ia mencocokkan alasan PENUH, jadi alasan yang
  // dipotong — `truncate`, `slice(0, 40)`, kutipan sebagian — lolos. Itu
  // persis cara orang menambahkan alasan "dengan aman". Yang menutupnya
  // adalah review, bukan test ini.
  test.each([
    ["tabel (>= 48rem)", true],
    ["baris HP (< 48rem)", false],
  ])("alasan tidak ada di DOM — %s", async (_label, isWide) => {
    const viewport = onStubViewport(isWide);
    onMockApi();
    const view = onRender({ [MENU.LEAVE]: ["VIEW"] });

    await screen.findAllByText("Ani Wijaya");

    // Kuitansi bahwa bentuk yang dimaksud memang terender, bukan dua kali
    // bentuk yang sama: kepala kolom hanya ada di tabel.
    expect(Boolean(screen.queryByText("Tipe"))).toBe(isWide);

    const html = view.container.innerHTML;

    for (const row of ROWS) {
      expect(html).not.toContain(row.reason);
      expect(screen.queryByText(row.reason)).toBeNull();
      expect(screen.queryByTitle(row.reason)).toBeNull();
    }

    expect(html).not.toContain("rumah sakit jiwa");

    viewport.onRestore();
  });

  test("tipe cuti BOLEH tampil: bendahara harus bisa membedakannya", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    expect((await screen.findAllByText(/Cuti Tahunan/)).length).toBeGreaterThan(
      0,
    );
  });
});

describe("daftar", () => {
  test("subjudul menghitung pengajuan, bukan baris halaman", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    expect(await screen.findByText("2 pengajuan cuti")).toBeTruthy();
  });

  test("hari ditampilkan lewat formatDays, termasuk setengah hari", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    await screen.findAllByText("Ani Wijaya");
    expect(screen.getAllByText(/0,5 hari/).length).toBeGreaterThan(0);
  });

  test("tab status lengkap dan tanpa Draf", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    const tabs = await screen.findAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Semua",
      "Menunggu",
      "Disetujui",
      "Ditolak",
      "Dibatalkan",
    ]);
  });

  test("tanpa kotak cari: be-sada belum punya ?filter untuk cuti", async () => {
    onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    await screen.findAllByText("Ani Wijaya");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  test("filter layar jadi parameter be-sada: karyawanId, leaveTypeId, status", async () => {
    search.current = "karyawan=2&tipe=3&status=APPROVED&page=2";
    const urls = onMockApi();
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    await waitFor(() => expect(urls.length).toBeGreaterThan(0));

    const query = new URL(urls[0] ?? "", "http://localhost").searchParams;
    expect(query.get("karyawanId")).toBe("2");
    expect(query.get("leaveTypeId")).toBe("3");
    expect(query.get("status")).toBe("APPROVED");
    expect(query.get("page")).toBe("2");
    expect(query.get("filter")).toBeNull();
  });

  test("404 kosong dirender sebagai keadaan kosong, bukan galat", async () => {
    onMockApi([]);
    onRender({ [MENU.LEAVE]: ["VIEW"] });

    await waitFor(() =>
      expect(screen.getByText("Belum ada pengajuan cuti")).toBeTruthy(),
    );
  });
});
