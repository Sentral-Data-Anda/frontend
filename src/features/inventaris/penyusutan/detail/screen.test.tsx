import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { RunDetail } from "../types";

const access: { current: Record<string, MenuAction[]> } = { current: {} };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/inventaris/penyusutan/PNY-2026-0003",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = access.current[slug] ?? [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { PenyusutanDetailScreen } = await import("./screen");

const DONE: RunDetail = {
  publicId: "r",
  code: "PNY-2026-0003",
  year: 2026,
  month: 8,
  status: "DRAFT",
  totalAmount: "1312500.00",
  postedAt: null,
  updatedAt: "2026-09-01T03:00:00.000Z",
  journal: null,
  entries: [
    {
      publicId: "e1",
      assetId: 1,
      amount: "312500.00",
      accumulatedAfter: "5000000.00",
      bookValueAfter: "10000000.00",
      asset: { publicId: "a1", code: "AST_0001", name: "Proyektor Epson" },
    },
    {
      publicId: "e2",
      assetId: 2,
      amount: "1000000.00",
      accumulatedAfter: "3000000.00",
      bookValueAfter: "21000000.00",
      asset: { publicId: "a2", code: "AST_0002", name: "Printer Canon" },
    },
  ],
};

const FRESH: RunDetail = {
  ...DONE,
  totalAmount: "0.00",
  updatedAt: null,
  entries: [],
};

const POSTED: RunDetail = {
  ...DONE,
  status: "POSTED",
  postedAt: "2026-09-02T03:00:00.000Z",
  journal: { code: "JRN-2026-0003" },
};

type Failure = { status: number; error: string };

const calls: string[] = [];
const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

const onMockApi = (run: RunDetail | null, failure?: Failure) => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const path = String(input).replace("/api/v1", "");

    if (method !== "GET") {
      calls.push(`${method} ${path}`);
      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json({ status: 200, message: "Berhasil", data: run });
    }
    if (!run) {
      return Response.json(
        { status: 404, error: "Penyusutan Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({ status: 200, message: "OK", data: run });
  }) as typeof fetch;
};

beforeAll(() => {
  viewport = onStubViewport(true);
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  calls.length = 0;
  replaced.length = 0;
});

const FULL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onRender = (
  run: RunDetail | null,
  granted: MenuAction[] = FULL,
  asset: MenuAction[] = [],
  failure?: Failure,
) => {
  access.current = { PENYUSUTAN: granted, BARANG: asset };
  onMockApi(run, failure);

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PenyusutanDetailScreen code="PNY-2026-0003" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onLoaded = () => screen.findByText("Penyusutan Agustus 2026");

const button = (name: string) => screen.queryByRole("button", { name });

describe("aksi per status dan izin", () => {
  test("draf belum dihitung: Hitung tanpa dialog, Posting tersembunyi", async () => {
    onRender(FRESH);
    await onLoaded();

    expect(button("Posting")).toBeNull();
    expect(button("Hapus")).toBeTruthy();
    expect(
      screen.getByText("Tekan Hitung untuk menghitung penyusutan periode ini."),
    ).toBeTruthy();

    fireEvent.click(button("Hitung") as HTMLElement);

    await waitFor(() =>
      expect(calls).toEqual(["PUT /penyusutan/PNY-2026-0003/hitung"]),
    );
    expect(screen.queryByText("Konfirmasi Tindakan")).toBeNull();
  });

  test("sudah dihitung: Hitung ulang lewat dialog", async () => {
    onRender(DONE);
    await onLoaded();

    fireEvent.click(button("Hitung ulang") as HTMLElement);
    expect(
      await screen.findByText(
        "Apakah Anda ingin menghitung ulang penyusutan Agustus 2026? Hasil sebelumnya diganti dengan data barang terbaru.",
      ),
    ).toBeTruthy();
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));
    await waitFor(() =>
      expect(calls).toEqual(["PUT /penyusutan/PNY-2026-0003/hitung"]),
    );
  });

  test("Posting: konfirmasi memuat periode dan total", async () => {
    onRender(DONE);
    await onLoaded();

    fireEvent.click(button("Posting") as HTMLElement);
    expect(
      await screen.findByText(
        "Apakah Anda ingin memposting penyusutan Agustus 2026 sebesar Rp 1.312.500,00? Jurnal dibuat otomatis dan tidak bisa dibatalkan.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));
    await waitFor(() =>
      expect(calls).toEqual(["PUT /penyusutan/PNY-2026-0003/posting"]),
    );
  });

  test("galat posting: FormAlert memuat pesan server apa adanya", async () => {
    const error = "Akun Beban Penyusutan Belum Diatur Di Setelan Akuntansi";
    onRender(DONE, FULL, [], { status: 400, error });
    await onLoaded();

    fireEvent.click(button("Posting") as HTMLElement);
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(error)).toBeTruthy();
    expect(screen.getByText(/Keuangan › Setelan Akuntansi/)).toBeTruthy();
  });

  test("0 baris: konfirmasi dan petunjuk menyebut posting tanpa jurnal", async () => {
    onRender({ ...DONE, totalAmount: "0.00", entries: [] });
    await onLoaded();

    const note = "Periode tanpa barang disusutkan diposting tanpa jurnal.";
    expect(screen.getByText(note)).toBeTruthy();

    fireEvent.click(button("Posting") as HTMLElement);
    expect(
      await screen.findByText(
        `Apakah Anda ingin memposting penyusutan Agustus 2026? ${note}`,
      ),
    ).toBeTruthy();
  });

  test("Hapus lewat dialog lalu kembali ke daftar", async () => {
    onRender(DONE);
    await onLoaded();

    fireEvent.click(button("Hapus") as HTMLElement);
    expect(
      await screen.findByText(
        "Apakah Anda ingin menghapus periode ini? Periode bisa dibuka lagi.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual(["/inventaris/penyusutan"]));
    expect(calls).toEqual(["DELETE /penyusutan/PNY-2026-0003"]);
  });

  test("tanpa UPDATE: tanpa Hitung/Posting; tanpa DELETE: tanpa Hapus", async () => {
    onRender(DONE, ["VIEW", "DELETE"]);
    await onLoaded();
    expect(button("Hitung ulang")).toBeNull();
    expect(button("Posting")).toBeNull();
    expect(button("Hapus")).toBeTruthy();

    cleanup();
    onRender(DONE, ["VIEW", "UPDATE"]);
    await onLoaded();
    expect(button("Hapus")).toBeNull();
    expect(button("Posting")).toBeTruthy();
  });

  test("diposting: tanpa aksi, jurnal tampil", async () => {
    onRender(POSTED);
    await onLoaded();

    expect(button("Hitung ulang")).toBeNull();
    expect(button("Posting")).toBeNull();
    expect(button("Hapus")).toBeNull();
    expect(screen.getByText("JRN-2026-0003")).toBeTruthy();
  });
});

describe("rincian", () => {
  // Baris total ADA HANYA DI HP: `EntryList` merendernya pada
  // `isTableWidth === false`, dan nilai buku di baris HP bermeta "Nilai buku
  // <angka>" sementara di lebar tabel ia kolom berisi angkanya saja. Berkas
  // ini menstub lebar tabel, jadi test ini menstub HP sendiri, lalu melewati
  // 48rem untuk memaku sisi tabelnya.
  test("HP: angka Rupiah dan baris total; lebar tabel: kolom nilai buku, tanpa baris total", async () => {
    const viewport = onStubViewport(false);

    onRender(DONE);
    await onLoaded();

    expect(screen.getAllByText("Rp 312.500,00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nilai buku Rp 21.000.000,00").length).toBe(1);
    expect(screen.getByText("Total penyusutan 2 barang")).toBeTruthy();
    expect(screen.getAllByText("Rp 1.312.500,00").length).toBe(2);

    act(() => viewport.onResize(true));

    await waitFor(() =>
      expect(screen.queryByText("Total penyusutan 2 barang")).toBeNull(),
    );
    expect(screen.queryByText("Nilai buku Rp 21.000.000,00")).toBeNull();
    expect(screen.getAllByText("Rp 21.000.000,00").length).toBe(1);
    expect(screen.getAllByText("Rp 1.312.500,00").length).toBe(1);

    viewport.onRestore();
  });

  test("tautan barang hanya dengan BARANG VIEW", async () => {
    onRender(DONE);
    await onLoaded();
    expect(
      screen.queryByRole("link", { name: "Lihat barang Proyektor Epson" }),
    ).toBeNull();

    cleanup();
    onRender(DONE, FULL, ["VIEW"]);
    await onLoaded();
    expect(
      screen
        .getByRole("link", { name: "Lihat barang Proyektor Epson" })
        .getAttribute("href"),
    ).toBe("/inventaris/barang/AST_0001");
  });

  test("404 → FormNotFound", async () => {
    onRender(null);

    expect(
      await screen.findByText("Data periode penyusutan tidak ditemukan"),
    ).toBeTruthy();
  });
});
