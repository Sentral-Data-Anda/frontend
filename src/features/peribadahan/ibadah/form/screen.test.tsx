import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { IBADAH_LIST_PATH } from "../model";
import type { Ibadah } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: "" };
const replaced: string[] = [];
const pushed: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: (href: string) => pushed.push(href),
  }),
  usePathname: () => "/peribadahan/ibadah/baru",
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

const { IbadahFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  pushed.length = 0;
  search.current = "";
});

const CODE = "IBD_0001-2026-0010";

const DETAIL: Ibadah = {
  code: CODE,
  date: "2026-09-20T00:00:00.000Z",
  startTime: "08:00",
  endTime: "09:30",
  theme: "Hidup dalam kasih karunia",
  bibleVerse: null,
  preacher: "Pdt. Yohanes Simatupang",
  maleCount: 132,
  femaleCount: 190,
  childCount: 49,
  note: null,
  typeIbadah: { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  bapel: null,
  jadwalPelayan: { id: 7, code: "JDP-0007", name: "Pelayan Minggu I" },
};

const PADANG: Ibadah = {
  ...DETAIL,
  code: "IBD_0005-2026-0001",
  typeIbadah: { id: 5, code: "TYP_IBD-0005", name: "Ibadah Padang" },
};

const TYPES = [
  { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I", isActive: true },
  { id: 2, code: "TYP_IBD-0002", name: "Ibadah Minggu II", isActive: true },
  { id: 5, code: "TYP_IBD-0005", name: "Ibadah Padang", isActive: false },
];

type Failure = { status: number; error: string };

const ok = (data: unknown, message = "OK", status = 200) =>
  Response.json({ status, message, data }, { status });

const fail = (failure: Failure) =>
  Response.json(failure, { status: failure.status });

const onMockApi = (
  failure: { save?: Failure; remove?: Failure; load?: Failure[] } = {},
) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/ddl/type-ibadah") return ok(TYPES);
    if (url.startsWith("/api/v1/ddl/")) return ok([]);

    if (method !== "GET") {
      calls.push({
        method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      if (method === "DELETE") {
        return failure.remove
          ? fail(failure.remove)
          : ok({ code: CODE }, "Berhasil Menghapus Data Ibadah");
      }
      if (failure.save) return fail(failure.save);

      return ok(
        { code: method === "POST" ? "IBD_0001-2026-0012" : CODE },
        method === "POST"
          ? "Berhasil Membuat Data Ibadah"
          : "Berhasil Memperbarui Data Ibadah",
        method === "POST" ? 201 : 200,
      );
    }

    if (url === `/api/v1/ibadah/${CODE}`) {
      const loadFailure = failure.load?.shift();

      return loadFailure ? fail(loadFailure) : ok(DETAIL);
    }
    if (url === `/api/v1/ibadah/${PADANG.code}`) return ok(PADANG);

    return fail({ status: 404, error: "Ibadah Tidak Ditemukan" });
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
        <IbadahFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const valueOf = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onMockApi();
  onRenderForm(["VIEW", ...granted], CODE);

  await waitFor(() =>
    expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
  );
};

const onDirty = () =>
  fireEvent.change(screen.getByLabelText("Tema"), {
    target: { value: "Tema baru" },
  });

describe("gerbang izin", () => {
  test("tambah dan salin tanpa CREATE: NoFormAccess", () => {
    search.current = `salin=${CODE}`;
    onRenderForm(["VIEW", "UPDATE"]);

    expect(screen.getByText("Tidak bisa menambah ibadah")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data ibadah."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Tema")).toBeNull();
  });

  test("ubah tanpa UPDATE: NoFormAccess", () => {
    onRenderForm(["VIEW", "CREATE"], CODE);

    expect(screen.getByText("Tidak bisa mengubah ibadah")).toBeTruthy();
  });

  test("form ubah: Salin hanya dengan CREATE, Hapus hanya dengan DELETE", async () => {
    await onRenderLoadedEdit(["UPDATE"]);
    expect(screen.queryByRole("link", { name: "Salin" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "CREATE", "DELETE"]);
    expect(
      screen.getByRole("link", { name: "Salin" }).getAttribute("href"),
    ).toBe(`/peribadahan/ibadah/baru?salin=${CODE}`);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("form tambah tidak punya Salin dan Hapus", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.queryByRole("link", { name: "Salin" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("ubah", () => {
  test("total hadir langsung dari isian; tempel 1.200 jadi 1200", async () => {
    await onRenderLoadedEdit();

    expect(screen.getByText("Total 371 orang")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Anak"), {
      target: { value: "1.200" },
    });

    expect(valueOf("Anak")).toBe("1200");
    expect(screen.getByText("Total 1.522 orang")).toBeTruthy();
  });

  test("Ya mengirim PUT utuh dengan jadwal pelayan tersimpan, lalu kembali dan menyorot", async () => {
    const listUrl = `${IBADAH_LIST_PATH}?bulan=2026-09`;
    window.sessionStorage.setItem(`list-return:${IBADAH_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    onRenderForm(["VIEW", "UPDATE"], CODE);
    await waitFor(() =>
      expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data ibadah ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        url: `/api/v1/ibadah/${CODE}`,
        body: {
          typeIbadahId: 1,
          date: "2026-09-20",
          startTime: "08:00",
          endTime: "09:30",
          theme: "Hidup dalam kasih karunia",
          bibleVerse: null,
          preacher: "Pdt. Yohanes Simatupang",
          roomId: 1,
          bapelId: null,
          jadwalPelayanId: 7,
          maleCount: 132,
          femaleCount: 190,
          childCount: 49,
          note: null,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${IBADAH_LIST_PATH}`),
    ).toBe(CODE);
  });

  test("409: galat di jam mulai dengan nama tipe, tetap di form", async () => {
    onMockApi({
      save: {
        status: 409,
        error:
          "Ibadah dengan tipe, tanggal dan jam mulai yang sama sudah tercatat",
      },
    });
    onRenderForm(["VIEW", "UPDATE"], CODE);
    await waitFor(() =>
      expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("startTime"));
    expect(
      screen.getByText(
        "Ibadah Minggu I pada tanggal dan jam ini sudah tercatat. Ubah jam mulai, atau buka data yang sudah ada dari daftar.",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("hapus 400 persembahan: FormAlert pesan server, isian tetap", async () => {
    onMockApi({
      remove: {
        status: 400,
        error:
          "Ibadah Tidak Dapat Dihapus Karena Sudah Memiliki Data Persembahan",
      },
    });
    onRenderForm(["VIEW", "UPDATE", "DELETE"], CODE);
    await waitFor(() =>
      expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data ibadah ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Ibadah belum terhapus.")).toBeTruthy(),
    );
    expect(
      screen.getByText(
        "Ibadah Tidak Dapat Dihapus Karena Sudah Memiliki Data Persembahan",
      ),
    ).toBeTruthy();
    expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia");
    expect(replaced).toEqual([]);
  });

  test("galat 500 saat memuat: tanpa field, aksi terkunci; Coba lagi mengisi form", async () => {
    onMockApi({ load: [{ status: 500, error: "Kesalahan server." }] });
    onRenderForm(["VIEW", "UPDATE", "CREATE", "DELETE"], CODE);

    await screen.findByText("Data ibadah gagal dimuat.");
    expect(screen.getByLabelText("Tema").closest(".hidden")).not.toBeNull();
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Hapus" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    const salin = screen.getByRole("link", { name: "Salin" });
    expect(salin.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(salin);
    expect(pushed).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() =>
      expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
    );
    expect(screen.getByLabelText("Tema").closest(".hidden")).toBeNull();
    expect(screen.queryByText("Data ibadah gagal dimuat.")).toBeNull();
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  test("404 saat memuat: FormNotFound", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "IBD_9999-2026-0001");

    await waitFor(() =>
      expect(screen.getByText("Data ibadah tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Tema")).toBeNull();
  });
});

describe("salin dari form ubah", () => {
  test("form bersih: langsung pindah tanpa dialog", async () => {
    await onRenderLoadedEdit(["UPDATE", "CREATE"]);

    fireEvent.click(screen.getByRole("link", { name: "Salin" }));

    expect(pushed).toEqual([`/peribadahan/ibadah/baru?salin=${CODE}`]);
    expect(screen.queryByText(/Apakah Anda ingin membatalkan/)).toBeNull();
  });

  test("form kotor: dialog batal, Tidak tetap, lalu Ya ke salinan", async () => {
    await onRenderLoadedEdit(["UPDATE", "CREATE"]);
    onDirty();

    fireEvent.click(screen.getByRole("link", { name: "Salin" }));
    await screen.findByText(/Apakah Anda ingin membatalkan/);
    fireEvent.click(screen.getByRole("button", { name: "Tidak" }));
    expect(pushed).toEqual([]);

    fireEvent.click(screen.getByRole("link", { name: "Salin" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(pushed).toEqual([`/peribadahan/ibadah/baru?salin=${CODE}`]);
    expect(replaced).toEqual([]);
  });

  test("Batal sesudah Salin dibatalkan tetap kembali ke daftar", async () => {
    await onRenderLoadedEdit(["UPDATE", "CREATE"]);
    onDirty();

    fireEvent.click(screen.getByRole("link", { name: "Salin" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tidak" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([IBADAH_LIST_PATH]));
    expect(pushed).toEqual([]);
  });
});

describe("layar tambah hasil salin", () => {
  test("tipe aktif, jam, dan ruang ikut; sisanya kosong; simpan POST", async () => {
    search.current = `salin=${CODE}`;
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(valueOf("Jam mulai")).toBe("08:00"));
    expect(
      screen.getByText("Disalin dari Ibadah Minggu I · Minggu, 20 Sep 2026"),
    ).toBeTruthy();
    expect(screen.getByLabelText("Tipe ibadah").textContent).toContain(
      "Ibadah Minggu I",
    );
    expect(valueOf("Jam selesai")).toBe("09:30");
    expect(valueOf("Tema")).toBe("");
    expect(valueOf("Pria (dewasa)")).toBe("");
    expect(screen.getByText("Belum ada yang dicatat.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(replaced).toEqual([IBADAH_LIST_PATH]);

    const date = screen.getByLabelText("Tanggal");
    fireEvent.change(date, { target: { value: "27/09/2026" } });
    fireEvent.blur(date);
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/v1/ibadah",
      body: {
        typeIbadahId: 1,
        date: "2026-09-27",
        startTime: "08:00",
        endTime: "09:30",
        roomId: 1,
        theme: null,
        jadwalPelayanId: null,
        maleCount: 0,
      },
    });
    await waitFor(() =>
      expect(
        window.sessionStorage.getItem(`list-focus:${IBADAH_LIST_PATH}`),
      ).toBe("IBD_0001-2026-0012"),
    );
  });

  test("tipe sumber nonaktif: tipe kosong + info", async () => {
    search.current = `salin=${PADANG.code}`;
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() => expect(valueOf("Jam mulai")).toBe("08:00"));
    expect(
      screen.getByText(
        "Tipe Ibadah Padang sudah nonaktif, jadi tidak ikut disalin.",
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText("Tipe ibadah").textContent).toContain(
      "Pilih tipe ibadah",
    );
  });

  test("sumber tidak ada: form tambah kosong + info, bukan FormNotFound", async () => {
    search.current = "salin=IBD_9999-2026-0001";
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(
        screen.getByText("Ibadah yang akan disalin tidak ditemukan."),
      ).toBeTruthy(),
    );
    expect(valueOf("Jam mulai")).toBe("");
    expect(screen.queryByText("Data ibadah tidak ditemukan")).toBeNull();
  });
});
