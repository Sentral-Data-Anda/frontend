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
import { PENGUMUMAN_LIST_PATH } from "../model";
import type { Announcement } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/kegiatan/pengumuman/baru",
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

const { PengumumanFormScreen } = await import("./screen");

const CODE = "PGM-2026-0002";

const DETAIL: Announcement = {
  publicId: "b2",
  code: CODE,
  category: "KEGIATAN",
  title: "Retret Pemuda 2026",
  content: "Baris satu\nBaris dua",
  publishDate: "2026-09-26T00:00:00.000Z",
  expiryDate: "2026-10-02T00:00:00.000Z",
  isPublished: true,
  isPinned: false,
  bapel: null,
  listImage: [
    {
      publicId: "p1",
      name: "Poster Retret",
      mimeType: "image/jpeg",
      size: 10,
      showOnWebsite: true,
      url: "http://media.test/p1.jpeg",
    },
    {
      publicId: "p2",
      name: "Rundown internal",
      mimeType: "application/pdf",
      size: 10,
      showOnWebsite: false,
      url: "http://media.test/p2.pdf",
    },
  ],
  status: "TERBIT",
};

type Call = { method: string; url: string; body?: FormData };
type Failure = { status: number; error: string; issues?: unknown[] };

const originalFetch = globalThis.fetch;
const NATURAL_WIDTH = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  "naturalWidth",
)!;
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
  Object.defineProperty(
    HTMLImageElement.prototype,
    "naturalWidth",
    NATURAL_WIDTH,
  );
});

const onMockApi = (
  options: { detail?: Announcement; save?: Failure; isDdlEmpty?: boolean } = {},
) => {
  const calls: Call[] = [];
  const detail = options.detail ?? DETAIL;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/ddl/bapel") && options.isDdlEmpty) {
      return Response.json(
        { status: 404, error: "Badan Pelayanan Tidak Ditemukan" },
        { status: 404 },
      );
    }
    if (url.startsWith("/api/v1/ddl/bapel")) {
      return Response.json({
        status: 200,
        data: [
          { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
          { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
        ],
      });
    }
    if (method !== "GET") {
      calls.push({ method, url, body: init?.body as FormData | undefined });

      if (options.save && method !== "DELETE") {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json(
        {
          status: method === "POST" ? 201 : 200,
          message: "Berhasil",
          data: { code: method === "POST" ? "PGM-2026-0010" : CODE },
        },
        { status: method === "POST" ? 201 : 200 },
      );
    }
    if (url === `/api/v1/pengumuman/${CODE}`) {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "Pengumuman Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

let queryClient: QueryClient;

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <PengumumanFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], CODE);

  await waitFor(() =>
    expect((screen.getByLabelText("Judul") as HTMLInputElement).value).toBe(
      DETAIL.title,
    ),
  );
};

const onConfirmSave = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE: /baru bukan form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah pengumuman")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat pengumuman."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Judul")).toBeNull();
  });

  test("tanpa UPDATE: /ubah bukan form", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"], CODE);

    expect(screen.getByText("Tidak bisa mengubah pengumuman")).toBeTruthy();
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

  test("404: layar tidak ditemukan", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "PGM-2026-9999");

    await screen.findByText("Data pengumuman tidak ditemukan");
    expect(screen.queryByLabelText("Judul")).toBeNull();
  });
});

describe("website", () => {
  test("seluruh jemaat: centang website dan kalimat aplikasi + website", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    expect(
      screen.getAllByRole("checkbox", { name: /Tampil di website/ }),
    ).toHaveLength(2);
    expect(
      screen.getByText("Tampil di aplikasi dan website gereja."),
    ).toBeTruthy();
  });

  test("komisi: tanpa centang, alasan hanya aplikasi", async () => {
    onMockApi({
      detail: {
        ...DETAIL,
        bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
      },
    });
    await onRenderLoadedEdit();

    expect(
      screen.queryByRole("checkbox", { name: /Tampil di website/ }),
    ).toBeNull();
    expect(
      screen.getByText(
        "Opsional. Foto atau PDF, maksimal 4 berkas. Lampiran tidak dimuat di website.",
      ),
    ).toBeTruthy();
    await screen.findByText(
      "Hanya tampil di aplikasi: pengumuman untuk Komisi Pemuda.",
    );
  });

  test("komisi yang tidak ada di /ddl/bapel tetap tampil dengan namanya", async () => {
    onMockApi({
      isDdlEmpty: true,
      detail: {
        ...DETAIL,
        bapel: { id: 7, code: "BPL-7", name: "Komisi Lansia" },
      },
    });
    await onRenderLoadedEdit();

    await screen.findByText(
      "Hanya tampil di aplikasi: pengumuman untuk Komisi Lansia.",
    );
    expect(screen.getByLabelText("Untuk").textContent).toContain(
      "Komisi Lansia",
    );
  });

  test("berita duka: tanpa centang, alasan kategori", async () => {
    onMockApi({ detail: { ...DETAIL, category: "BERITA_DUKA" } });
    await onRenderLoadedEdit();

    expect(
      screen.queryByRole("checkbox", { name: /Tampil di website/ }),
    ).toBeNull();
    expect(
      screen.getByText(
        "Hanya tampil di aplikasi: berita duka dan ucapan syukur tidak dimuat di website.",
      ),
    ).toBeTruthy();
  });
});

describe("simpan", () => {
  test("isian kosong: tanpa konfirmasi, fokus ke judul", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("title"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("tambah: POST multipart tanpa keepFiles, sorot baris baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Judul"), {
      target: { value: "Pendaftaran katekisasi" },
    });
    fireEvent.change(screen.getByLabelText("Isi"), {
      target: { value: "Baris satu\nBaris dua" },
    });
    await onConfirmSave();

    await waitFor(() => expect(replaced).toEqual([PENGUMUMAN_LIST_PATH]));
    const body = calls[0].body!;
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/v1/pengumuman",
    });
    expect(body.get("content")).toBe("Baris satu\nBaris dua");
    expect(body.get("category")).toBe("PENGUMUMAN");
    expect(body.get("isPublished")).toBe("0");
    expect(body.has("keepFiles")).toBe(false);
    expect(body.has("expiryDate")).toBe(false);
    expect(body.has("bapelId")).toBe(false);
    expect(
      window.sessionStorage.getItem(`list-focus:${PENGUMUMAN_LIST_PATH}`),
    ).toBe("PGM-2026-0010");
  });

  test("ubah: hapus satu lampiran lama → keepFiles hanya sisanya", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(
      screen.getByRole("button", { name: "Hapus Rundown internal" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText(
      "Apakah Anda ingin menyimpan perubahan data pengumuman ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([PENGUMUMAN_LIST_PATH]));
    expect(calls[0]).toMatchObject({
      method: "PUT",
      url: `/api/v1/pengumuman/${CODE}`,
    });
    expect(JSON.parse(String(calls[0].body!.get("keepFiles")))).toEqual([
      { publicId: "p1", showOnWebsite: true },
    ]);
    expect(calls[0].body!.get("expiryDate")).toBe("2026-10-02");
    expect(
      window.sessionStorage.getItem(`list-focus:${PENGUMUMAN_LIST_PATH}`),
    ).toBe(CODE);
  });

  test("galat server ke field: tanggal berakhir dan lampiran", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Tanggal Berakhir tidak boleh lebih awal dari Tanggal Terbit",
        issues: [
          {
            path: "expiryDate",
            message:
              "Tanggal Berakhir tidak boleh lebih awal dari Tanggal Terbit",
          },
          {
            path: "keepFiles",
            message: "Lampiran Yang Dipertahankan Tidak Ditemukan",
          },
        ],
      },
    });
    await onRenderLoadedEdit();
    await onConfirmSave();

    await screen.findByText(
      "Tanggal Berakhir tidak boleh lebih awal dari Tanggal Terbit",
    );
    expect(
      screen.getByText("Lampiran Yang Dipertahankan Tidak Ditemukan"),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("expiryDate"));
    expect(replaced).toEqual([]);
  });

  test("galat 500: galat tingkat form, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit();
    await onConfirmSave();

    await screen.findByText("Data belum tersimpan. Coba simpan lagi.");
    expect((screen.getByLabelText("Judul") as HTMLInputElement).value).toBe(
      DETAIL.title,
    );
    expect(
      screen.getByRole("button", { name: "Hapus Poster Retret" }),
    ).toBeTruthy();
  });
});

test("refetch berkala: URL lampiran diperbarui, isian user tetap", async () => {
  // happy-dom tidak memuat gambar; tanpa ini MediaThumb menganggapnya gagal muat.
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => 1,
  });
  onMockApi();
  await onRenderLoadedEdit();

  fireEvent.change(screen.getByLabelText("Judul"), {
    target: { value: "Retret Pemuda 2026 (revisi)" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Hapus Rundown internal" }),
  );

  const [poster, rundown] = DETAIL.listImage;
  onMockApi({
    detail: {
      ...DETAIL,
      listImage: [
        { ...poster, url: "http://media.test/p1.jpeg?baru" },
        { ...rundown, url: "http://media.test/p2.pdf?baru" },
      ],
    },
  });
  await act(() =>
    queryClient.refetchQueries({ queryKey: ["pengumuman", "detail"] }),
  );

  await waitFor(() =>
    expect(
      screen.getByRole("img", { name: "Poster Retret" }).getAttribute("src"),
    ).toBe("http://media.test/p1.jpeg?baru"),
  );
  expect((screen.getByLabelText("Judul") as HTMLInputElement).value).toBe(
    "Retret Pemuda 2026 (revisi)",
  );
  expect(
    screen.queryByRole("button", { name: "Hapus Rundown internal" }),
  ).toBeNull();
});

test("hapus: Ya menghapus lalu kembali ke daftar", async () => {
  const calls = onMockApi();
  await onRenderLoadedEdit(["UPDATE", "DELETE"]);

  fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
  await screen.findByText("Apakah Anda ingin menghapus data pengumuman ini?");
  fireEvent.click(screen.getByRole("button", { name: "Ya" }));

  await waitFor(() => expect(replaced).toEqual([PENGUMUMAN_LIST_PATH]));
  expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
});
