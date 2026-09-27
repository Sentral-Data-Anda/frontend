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
import { afterEach, describe, expect, mock, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";
import { formatDateShort } from "@/lib/format";
import type { MenuAction } from "@/types/menu";

import { IBADAH_LIST_PATH } from "../model";
import type { IbadahDetail } from "../types";

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
  requested.length = 0;
  alamat.failure = undefined;
  alamat.gate = undefined;
});

const CODE = "IBD_0001-2026-0010";

const DETAIL: IbadahDetail = {
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
  placeType: "GEREJA",
  placeName: null,
  address: null,
  hostKeluarga: null,
  zoneChurch: null,
};

const HOME: IbadahDetail = {
  ...DETAIL,
  code: "IBD_0006-2026-0003",
  typeIbadah: { id: 6, code: "TYP_IBD-0006", name: "Ibadah Wilayah" },
  startTime: "19:00",
  endTime: "20:30",
  room: null,
  jadwalPelayan: null,
  placeType: "RUMAH_JEMAAT",
  address: "Jl. Cijerah No. 1",
  hostKeluarga: { id: 1, code: "KK-0001", name: "Keluarga Sitanggang" },
  zoneChurch: { id: 1, code: "ZC-0001", name: "Wilayah I" },
};

const VILLA: IbadahDetail = {
  ...DETAIL,
  code: "IBD_0004-2026-0009",
  room: null,
  placeType: "LAINNYA",
  placeName: "Villa Ciater",
  address: "Jl. Raya Ciater KM 12",
  zoneChurch: { id: 5, code: "ZC-0005", name: "Wilayah V" },
};

const PADANG: IbadahDetail = {
  ...DETAIL,
  code: "IBD_0005-2026-0001",
  typeIbadah: { id: 5, code: "TYP_IBD-0005", name: "Ibadah Padang" },
};

const TYPES = [
  { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I", isActive: true },
  { id: 2, code: "TYP_IBD-0002", name: "Ibadah Minggu II", isActive: true },
  { id: 5, code: "TYP_IBD-0005", name: "Ibadah Padang", isActive: false },
  { id: 6, code: "TYP_IBD-0006", name: "Ibadah Wilayah", isActive: true },
];

const ZONES = [
  { id: 1, code: "ZC-0001", name: "Wilayah I", isActive: true },
  { id: 2, code: "ZC-0002", name: "Wilayah II", isActive: true },
  { id: 5, code: "ZC-0005", name: "Wilayah V", isActive: false },
];

const KELUARGA = [
  { id: 4, code: "KK-0004", name: "Keluarga Manurung" },
  { id: 1, code: "KK-0001", name: "Keluarga Sitanggang" },
  { id: 3, code: "KK-0003", name: "Keluarga Wijaya" },
];

const TODAY = todayJakarta();
const HOSTED = `${addDays(TODAY, -17)}T00:00:00.000Z`;
const SCHEDULED = `${addDays(TODAY, 7)}T00:00:00.000Z`;

const SUGGESTIONS = [
  { id: 23, code: "KK-0023", name: "Keluarga Sembiring", lastHostedDate: null },
  { ...KELUARGA[1], lastHostedDate: HOSTED },
  { ...KELUARGA[0], lastHostedDate: SCHEDULED },
];

const ADDRESSES: Record<string, unknown> = {
  "1": {
    id: 1,
    address: "Jl. Cijerah No. 1 Blok B",
    zoneChurch: { ...ZONES[1] },
  },
  "3": { id: 3, address: "Jl. Rawa Buntu No. 3", zoneChurch: { ...ZONES[2] } },
  "4": { id: 4, address: "Jl. Manurung No. 4", zoneChurch: null },
  "23": { id: 23, address: "Jl. Sembiring No. 23", zoneChurch: null },
};

const requested: string[] = [];
const alamat: { failure?: Failure; gate?: Promise<void> } = {};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

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

    requested.push(url);

    const address = /^\/api\/v1\/ddl\/keluarga\/(\d+)\/alamat$/.exec(url);

    if (address) {
      await alamat.gate;

      return alamat.failure ? fail(alamat.failure) : ok(ADDRESSES[address[1]]);
    }
    if (url === "/api/v1/ddl/type-ibadah") return ok(TYPES);
    if (url === "/api/v1/ddl/zone-church") return ok(ZONES);
    if (url.startsWith("/api/v1/ddl/keluarga?")) return ok(KELUARGA);
    if (url.startsWith("/api/v1/ibadah/saran-tuan-rumah?")) {
      return ok(SUGGESTIONS);
    }
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
    if (url === `/api/v1/ibadah/${HOME.code}`) return ok(HOME);
    if (url === `/api/v1/ibadah/${VILLA.code}`) return ok(VILLA);

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
          placeType: "GEREJA",
          hostKeluargaId: null,
          placeName: null,
          address: null,
          zoneChurchId: null,
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
    const error =
      "Ibadah dengan tipe, tanggal, jam mulai dan wilayah yang sama sudah tercatat. Isi Wilayah jika ibadah ini untuk wilayah yang berbeda";
    onMockApi({
      save: {
        status: 409,
        error,
        issues: [{ path: "startTime", message: error }],
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
        "Ibadah Minggu I pada tanggal, jam, dan wilayah ini sudah tercatat. Ubah jam mulai atau wilayah, atau buka data yang sudah ada dari daftar.",
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
  test("tipe aktif, jam, dan ruang ikut; sisanya kosong; simpan POST untuk jadwal pekan depan", async () => {
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

    const nextWeek = addDays(todayJakarta(), 7);
    const date = screen.getByLabelText("Tanggal");
    fireEvent.change(date, {
      target: { value: nextWeek.split("-").reverse().join("/") },
    });
    fireEvent.blur(date);
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/v1/ibadah",
      body: {
        typeIbadahId: 1,
        date: nextWeek,
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

const onPickHost = async (name: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Buka pilihan" }));
  fireEvent.click(
    await screen.findByRole("option", { name: new RegExp(name) }),
  );
};

const onRenderCopy = async (source: IbadahDetail) => {
  search.current = `salin=${source.code}`;
  onMockApi();
  onRenderForm(["VIEW", "CREATE"]);

  await waitFor(() => expect(valueOf("Jam mulai")).toBe(source.startTime));
};

const zoneText = () => screen.getByLabelText("Wilayah").textContent;

const isRequested = (pattern: RegExp) =>
  requested.some((url) => pattern.test(url));

describe("tempat", () => {
  test("ganti tipe tempat bolak-balik memulihkan isian; payload membersihkan yang bukan milik", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "UPDATE"], CODE);
    await waitFor(() =>
      expect(valueOf("Tema")).toBe("Hidup dalam kasih karunia"),
    );

    fireEvent.click(screen.getByLabelText("Lainnya"));
    expect(screen.queryByLabelText("Ruang")).toBeNull();
    fireEvent.change(screen.getByLabelText("Nama tempat"), {
      target: { value: "Aula Kelurahan" },
    });
    fireEvent.click(screen.getByLabelText("Gereja"));
    expect(screen.getByLabelText("Ruang").textContent).toContain(
      "Gedung Gereja",
    );
    fireEvent.click(screen.getByLabelText("Lainnya"));
    expect(valueOf("Nama tempat")).toBe("Aula Kelurahan");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toMatchObject({
      placeType: "LAINNYA",
      placeName: "Aula Kelurahan",
      roomId: null,
      hostKeluargaId: null,
      address: null,
    });
  });

  test("rumah jemaat tanpa tuan rumah dan alamat: galat di field saat Simpan", async () => {
    await onRenderCopy(HOME);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Pilih keluarga tuan rumah.")).toBeTruthy();
    expect(screen.getByText("Isi alamat tempat ibadah.")).toBeTruthy();
  });

  test("salin rumah jemaat: tuan rumah dan alamat kosong + info; saran berhint di atas", async () => {
    await onRenderCopy(HOME);

    expect(screen.getByText("Tuan rumah tidak ikut disalin.")).toBeTruthy();
    expect(valueOf("Tuan rumah")).toBe("");
    expect(valueOf("Alamat")).toBe("");
    expect(zoneText()).toContain("Wilayah I");

    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan" }));
    await screen.findByRole("option", { name: /Keluarga Wijaya/ });
    await waitFor(() =>
      expect(
        screen.getAllByRole("option").map((option) => option.textContent),
      ).toEqual([
        "Keluarga SembiringBelum pernah",
        `Keluarga SitanggangTerakhir ${formatDateShort(HOSTED)}`,
        `Keluarga ManurungDijadwalkan ${formatDateShort(SCHEDULED)}`,
        "Keluarga Wijaya",
      ]),
    );
    expect(
      isRequested(/saran-tuan-rumah\?typeIbadahId=6&zoneChurchId=1$/),
    ).toBe(true);
  });

  test("pilih tuan rumah: alamat dan wilayah terisi; ganti tuan rumah menimpa alamat, wilayah nonaktif tidak dipakai", async () => {
    await onRenderCopy(HOME);

    await onPickHost("Keluarga Sitanggang");
    await waitFor(() =>
      expect(valueOf("Alamat")).toBe("Jl. Cijerah No. 1 Blok B"),
    );
    expect(zoneText()).toContain("Wilayah II");

    await onPickHost("Keluarga Wijaya");
    await waitFor(() => expect(valueOf("Alamat")).toBe("Jl. Rawa Buntu No. 3"));
    expect(zoneText()).toContain("Wilayah II");

    fireEvent.click(screen.getByRole("button", { name: "Kosongkan pilihan" }));
    expect(valueOf("Alamat")).toBe("Jl. Rawa Buntu No. 3");
  });

  test("mengetik sebelum alamat tiba: tidak ditimpa; alamat gagal: hint isi manual", async () => {
    await onRenderCopy(HOME);
    let onRelease = () => {};
    const gate = new Promise<void>((resolve) => {
      onRelease = resolve;
    });
    alamat.gate = gate;

    await onPickHost("Keluarga Sitanggang");
    expect(await screen.findByText("Memuat alamat keluarga…")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Alamat"), {
      target: { value: "Jl. Diketik" },
    });
    await act(async () => {
      onRelease();
      await gate;
    });
    await waitFor(() => expect(zoneText()).toContain("Wilayah II"));
    expect(screen.queryByText("Memuat alamat keluarga…")).toBeNull();
    expect(valueOf("Alamat")).toBe("Jl. Diketik");

    alamat.gate = undefined;
    alamat.failure = { status: 500, error: "Kesalahan server." };
    await onPickHost("Keluarga Wijaya");
    expect(
      await screen.findByText("Alamat keluarga tidak bisa dimuat. Isi manual."),
    ).toBeTruthy();
    expect(valueOf("Alamat")).toBe("Jl. Diketik");
  });

  test("form ubah dimuat: tanpa isi otomatis; hint tuan rumah pindah wilayah", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE", "CREATE"], HOME.code);

    expect(
      await screen.findByText("Tuan rumah sekarang di Wilayah II."),
    ).toBeTruthy();
    expect(valueOf("Alamat")).toBe("Jl. Cijerah No. 1");
    expect(valueOf("Tuan rumah")).toBe("Keluarga Sitanggang");
    expect(zoneText()).toContain("Wilayah I");
  });

  test("tanpa CREATE: tanpa saran dan tanpa alamat otomatis, alamat diketik", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], HOME.code);
    await waitFor(() => expect(valueOf("Alamat")).toBe("Jl. Cijerah No. 1"));

    expect(screen.getByText("Isi alamat rumah tuan rumah.")).toBeTruthy();
    await onPickHost("Keluarga Wijaya");
    expect(valueOf("Alamat")).toBe("Jl. Cijerah No. 1");
    expect(screen.queryByText(/Belum pernah/)).toBeNull();
    expect(isRequested(/saran-tuan-rumah|\/alamat$/)).toBe(false);
  });

  test("salin lainnya bertanda wilayah nonaktif: nama dan alamat ikut, wilayah kosong + info", async () => {
    await onRenderCopy(VILLA);

    expect(
      screen.getByText("Wilayah V sudah nonaktif, jadi tidak ikut disalin."),
    ).toBeTruthy();
    expect(valueOf("Nama tempat")).toBe("Villa Ciater");
    expect(
      (screen.getByLabelText(/^Alamat/) as HTMLTextAreaElement).value,
    ).toBe("Jl. Raya Ciater KM 12");
    expect(zoneText()).toContain("Pilih wilayah");
  });
});
