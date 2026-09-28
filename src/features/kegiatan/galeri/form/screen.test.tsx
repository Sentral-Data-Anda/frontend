import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { GALERI_LIST_PATH } from "../model";
import type { Album } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kegiatan/galeri/baru",
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

const { GaleriFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const CODE = "ALBM_0001-0001";

beforeEach(() => {
  let counter = 0;
  URL.createObjectURL = mock(() => `blob:local-${++counter}`);
  URL.revokeObjectURL = mock(() => {});
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: Album = {
  code: CODE,
  name: "Paskah 2026",
  isPublish: true,
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  listImage: ["Ibadah subuh", "Paduan suara", "Salib"].map((name, index) => ({
    publicId: `p-${index}`,
    name,
    mimeType: "image/jpeg",
    size: 1,
    showOnWebsite: index === 0,
    url: `http://media/${index}.jpg`,
  })),
};

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure } = {}) => {
  const calls: { url: string; method: string; body?: FormData }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/ddl/bapel")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [
          { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
          { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
        ],
      });
    }
    if (url === `/api/v1/gallery/${CODE}` && method === "GET") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    calls.push({ url, method, body: init?.body as FormData | undefined });

    if (failure.save && method !== "DELETE") {
      return Response.json(failure.save, { status: failure.save.status });
    }

    return Response.json({
      status: method === "POST" ? 201 : 200,
      message:
        method === "DELETE"
          ? "Berhasil Menghapus Album"
          : "Berhasil Memperbarui Album",
      data: { code: CODE },
    });
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
        <GaleriFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[]) => {
  const view = onRenderForm(granted, CODE);

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama album") as HTMLInputElement).value,
    ).toBe("Paskah 2026"),
  );

  return view;
};

const pick = (container: HTMLElement, ...names: string[]) =>
  fireEvent.change(container.querySelector("input[type=file]")!, {
    target: {
      files: names.map((name) => new File(["x"], name, { type: "image/jpeg" })),
    },
  });

describe("gerbang izin", () => {
  test("tanpa CREATE: /baru merender NoFormAccess, bukan form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah album")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat galeri."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Galeri" })
        .getAttribute("href"),
    ).toBe(GALERI_LIST_PATH);
    expect(screen.queryByLabelText("Nama album")).toBeNull();
  });

  test("tanpa UPDATE: /ubah tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], CODE);

    expect(screen.getByText("Tidak bisa mengubah album")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("Hapus hanya di form ubah dengan DELETE", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

describe("ganti semua foto", () => {
  test("foto tersimpan hanya-baca; ganti menampilkan peringatan, batal mengosongkan pilihan", async () => {
    onMockApi();
    const { container } = await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(screen.getByRole("list", { name: "Foto tersimpan" })).toBeTruthy();
    expect(container.querySelector("input[type=file]")).toBeNull();
    expect(screen.getByText("1 dari 3 foto tampil di website.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ganti semua foto" }));

    expect(
      screen.getByText(
        "Menyimpan foto baru mengganti semua 3 foto lama, termasuk pengaturan tampil di website.",
      ),
    ).toBeTruthy();
    pick(container, "baru.jpg");
    expect(screen.getByText("baru.jpg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batal ganti foto" }));

    expect(screen.getByRole("list", { name: "Foto tersimpan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ganti semua foto" }));
    expect(screen.queryByText("baru.jpg")).toBeNull();
  });

  test("ganti tanpa foto ditolak; dengan foto: konfirmasi khusus lalu PUT berisi image", async () => {
    const calls = onMockApi();
    const { container } = await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Ganti semua foto" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(screen.getByText("Pilih minimal satu foto")).toBeTruthy(),
    );

    pick(container, "a.jpg", "b.jpg");
    fireEvent.click(screen.getByRole("checkbox", { name: /a\.jpg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data album ini? Semua foto lama akan diganti dengan 2 foto baru.",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([GALERI_LIST_PATH]));
    const body = calls[0].body!;
    expect(calls[0].method).toBe("PUT");
    expect(body.getAll("image")).toHaveLength(2);
    expect(body.getAll("showOnWebsite")).toEqual(["1", "0"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${GALERI_LIST_PATH}`),
    ).toContain(CODE);
  });

  test("ubah tanpa ganti foto: konfirmasi baku, PUT tanpa image", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.change(screen.getByLabelText("Nama album"), {
      target: { value: "Paskah 2026 Pagi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data album ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body!.getAll("image")).toEqual([]);
    expect(calls[0].body!.get("name")).toBe("Paskah 2026 Pagi");
  });
});

describe("galat server", () => {
  for (const save of [
    { status: 409, error: "Album Sudah Tersedia" },
    { status: 400, error: "Album Tersebut Sudah Tersedia" },
    { status: 404, error: "Album Sudah Tersedia" },
  ]) {
    test(`duplikat ${save.status} jatuh ke field nama`, async () => {
      onMockApi({ save });
      await onRenderLoadedEdit(["VIEW", "UPDATE"]);

      fireEvent.change(screen.getByLabelText("Nama album"), {
        target: { value: "Retret Pemuda 2025" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

      await waitFor(() =>
        expect(
          screen.getByText("Album dengan nama ini sudah ada. Pakai nama lain."),
        ).toBeTruthy(),
      );
      expect(replaced).toEqual([]);
    });
  }

  test("500: FormAlert, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.change(screen.getByLabelText("Nama album"), {
      target: { value: "Paskah Raya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    expect(
      (screen.getByLabelText("Nama album") as HTMLInputElement).value,
    ).toBe("Paskah Raya");
  });

  test("hapus: konfirmasi baku lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText("Apakah Anda ingin menghapus data album ini?"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([GALERI_LIST_PATH]));
    expect(calls[0].method).toBe("DELETE");
  });

  test("404: FormNotFound", async () => {
    globalThis.fetch = (async () =>
      Response.json(
        { status: 404, error: "Album Tidak Ditemukan" },
        { status: 404 },
      )) as unknown as typeof fetch;
    onRenderForm(["VIEW", "UPDATE"], CODE);

    expect(await screen.findByText("Data album tidak ditemukan")).toBeTruthy();
  });
});
