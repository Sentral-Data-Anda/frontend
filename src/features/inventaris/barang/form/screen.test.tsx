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

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { BARANG_LIST_PATH, barangDetailHref } from "../model";
import type { AssetDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/inventaris/barang/baru",
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

const { BarangFormScreen } = await import("./screen");

const CODE = "AST_0001_0001-0001";

const DETAIL: AssetDetail = {
  id: 1,
  publicId: "a1",
  code: CODE,
  name: "Proyektor Epson EB-X51",
  description: "Proyektor utama ibadah raya.",
  serialNumber: "X51-7Q2K9031",
  condition: "BAIK",
  acquisitionSource: "PURCHASE",
  donorName: null,
  acquisitionDate: "2025-07-01T00:00:00.000Z",
  acquisitionCost: "8500000.00",
  warrantyUntil: null,
  isDepreciable: true,
  salvageValue: "500000.00",
  usefulLifeMonths: 48,
  depreciationStartDate: "2025-07-01T00:00:00.000Z",
  openingAccumulatedDepreciation: null,
  openingAccumulatedAsOf: null,
  type: { id: 1, code: "TYP_ITM-0001", name: "Elektronik" },
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  mainImage: null,
  detailImage: [],
  status: "AKTIF",
  disposal: null,
  depreciation: {
    openingAccumulated: "0",
    accumulated: "0.00",
    bookValue: "8500000.00",
    lastPeriod: null,
  },
};

type Call = { method: string; url: string; body?: FormData };
type Failure = { status: number; error: string; issues?: unknown[] };

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

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

const onMockApi = (
  options: { detail?: AssetDetail; save?: Failure; remove?: Failure } = {},
) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      calls.push({ method, url, body: init?.body as FormData | undefined });
      const failure = method === "DELETE" ? options.remove : options.save;

      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json({
        status: 200,
        message: "Berhasil",
        data: { code: method === "POST" ? "AST_0001_0001-0009" : CODE },
      });
    }
    if (url === `/api/v1/asset/${CODE}`) {
      return Response.json({ status: 200, data: options.detail ?? DETAIL });
    }

    return Response.json(
      { status: 404, error: "Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <BarangFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], CODE);

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    ),
  );
};

const onConfirmSave = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang", () => {
  test("tanpa CREATE / UPDATE: bukan form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);
    expect(screen.getByText("Tidak bisa menambah barang")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data barang."),
    ).toBeTruthy();

    cleanup();
    onRenderForm(["VIEW", "CREATE"], CODE);
    expect(screen.getByText("Tidak bisa mengubah barang")).toBeTruthy();
  });

  test("Hapus hanya di form ubah dengan DELETE", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("barang menunggu pelepasan: tidak bisa diubah, kembali ke halamannya", async () => {
    onMockApi({ detail: { ...DETAIL, status: "MENUNGGU_PELEPASAN" } });
    onRenderForm(["VIEW", "UPDATE"], CODE);

    expect(await screen.findByText("Barang tidak bisa diubah")).toBeTruthy();
    expect(screen.queryByText(/Hubungi administrator/)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke halaman barang" })
        .getAttribute("href"),
    ).toBe(barangDetailHref(CODE));
  });

  test("404: data barang tidak ditemukan", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "AST_9999");

    expect(await screen.findByText("Data barang tidak ditemukan")).toBeTruthy();
  });
});

describe("form ubah", () => {
  test("lokasi teks baca; sudah disusutkan → field terkunci", async () => {
    onMockApi({
      detail: {
        ...DETAIL,
        depreciation: {
          ...DETAIL.depreciation!,
          lastPeriod: { year: 2026, month: 8 },
        },
      },
    });
    await onRenderLoadedEdit();

    expect(screen.getByText("Gedung Gereja")).toBeTruthy();
    expect(screen.queryByLabelText("Ruang")).toBeNull();
    expect(
      (screen.getByLabelText("Harga perolehan (Rp)") as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Tidak" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Masa manfaat (bulan)") as HTMLInputElement)
        .disabled,
    ).toBe(false);
    expect(
      screen.getAllByText("Tidak bisa diubah karena sudah disusutkan.").length,
    ).toBeGreaterThan(0);
  });

  test("belum disusutkan: Ya → Tidak membuang field penyusutan; lokasi lama dikirim", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("radio", { name: "Tidak" }));
    await onConfirmSave();

    await waitFor(() => expect(replaced).toEqual([BARANG_LIST_PATH]));
    const body = calls[0].body!;
    expect(calls[0]).toMatchObject({
      method: "PUT",
      url: `/api/v1/asset/${CODE}`,
    });
    expect(body.get("isDepreciable")).toBe("0");
    expect(body.has("usefulLifeMonths")).toBe(false);
    expect(body.has("depreciationStartDate")).toBe(false);
    expect(body.get("roomId")).toBe("1");
    expect(body.get("bapelId")).toBe("1");
    expect(body.get("keepFiles")).toBe("[]");
    expect(
      window.sessionStorage.getItem(`list-focus:${BARANG_LIST_PATH}`),
    ).toBe(CODE);
  });

  test("nomor seri dipakai (409) → galat di field, tidak kembali", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Nomor Seri Sudah Dipakai AST_0002_0005-0001",
        issues: [
          {
            path: "serialNumber",
            message: "Nomor Seri Sudah Dipakai AST_0002_0005-0001",
          },
        ],
      },
    });
    await onRenderLoadedEdit();
    await onConfirmSave();

    expect(
      await screen.findByText("Nomor Seri Sudah Dipakai AST_0002_0005-0001"),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("serialNumber"),
    );
    expect(replaced).toEqual([]);
  });

  test("sudah dilepas (400) → FormAlert, isian tetap", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Barang Sudah Dilepas Dan Tidak Dapat Diubah",
      },
    });
    await onRenderLoadedEdit();
    await onConfirmSave();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(
      screen.getByText("Barang Sudah Dilepas Dan Tidak Dapat Diubah"),
    ).toBeTruthy();
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    );
  });

  test("hapus ditolak: FormAlert pesan server; berhasil: kembali ke daftar", async () => {
    const calls = onMockApi({
      remove: {
        status: 400,
        error: "Barang Sudah Disusutkan. Gunakan Pelepasan Di Siklus Aset",
      },
    });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText(/Hapus hanya untuk data yang salah catat/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Barang belum terhapus.")).toBeTruthy();
    expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
    expect(replaced).toEqual([]);

    cleanup();
    onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
    await waitFor(() => expect(replaced).toEqual([BARANG_LIST_PATH]));
  });
});

describe("form tambah", () => {
  test("kosong: galat klien, tanpa kiriman", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Isi nama barang, minimal 4 karakter"),
    ).toBeTruthy();
    expect(document.getElementById("roomId-error")?.textContent).toBe(
      "Pilih ruang",
    );
    expect(calls).toEqual([]);
  });

  test("Donasi membuka nama pemberi dan label nilai perkiraan", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.queryByLabelText("Nama pemberi")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Donasi" }));
    expect(screen.getByLabelText("Nama pemberi")).toBeTruthy();
    expect(
      screen.getByLabelText("Nilai perolehan (perkiraan, Rp)"),
    ).toBeTruthy();
    expect(screen.getByLabelText("Ruang")).toBeTruthy();
  });
});
