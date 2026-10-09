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

import { MENU } from "@/config/menu";
import { addDays, todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { ABSENSI_LIST_PATH } from "../model";
import type { AbsensiKaryawan } from "../types";

const TODAY = todayJakarta();

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/hr/attendance/baru",
  useSearchParams: () => new URLSearchParams(),
}));

/** Sadar-slug: hibah hanya berlaku untuk ATTENDANCE. */
mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = slug === MENU.ATTENDANCE ? actions.current : [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { AbsensiFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: AbsensiKaryawan = {
  id: 1,
  publicId: "abs-0001",
  karyawanId: 1,
  karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Ani Wijaya" },
  date: `${addDays(TODAY, -3)}T00:00:00.000Z`,
  checkIn: "08:00",
  checkOut: "17:00",
  status: "HADIR",
  note: null,
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (
  options: {
    save?: Failure;
    remove?: Failure;
    detail?: AbsensiKaryawan;
    isDetailMissing?: boolean;
  } = {},
) => {
  const calls: { method: string; body?: unknown }[] = [];
  const detail = options.detail ?? DETAIL;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/ddl/karyawan")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [
          { id: 1, code: "KRY-0001", name: "Ani Wijaya" },
          { id: 2, code: "KRY-0002", name: "Budi Santoso" },
        ],
      });
    }

    if (url === "/api/v1/absensi-karyawan" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (options.save) {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json(
        {
          status: 201,
          message: "Berhasil Menambahkan Absensi Karyawan",
          data: { ...detail, id: 20, publicId: "abs-0020" },
        },
        { status: 201 },
      );
    }

    if (url === "/api/v1/absensi-karyawan/abs-0001" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (options.save) {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Mengubah Absensi Karyawan",
        data: detail,
      });
    }

    if (url === "/api/v1/absensi-karyawan/abs-0001" && method === "DELETE") {
      calls.push({ method });

      if (options.remove) {
        return Response.json(options.remove, { status: options.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Absensi Karyawan",
        data: detail,
      });
    }

    if (
      url === "/api/v1/absensi-karyawan/abs-0001" &&
      !options.isDetailMissing
    ) {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "Absensi Karyawan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[], publicId?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <AbsensiFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const clockIn = () => screen.getByLabelText("Jam masuk") as HTMLInputElement;

const clockOut = () => screen.getByLabelText("Jam pulang") as HTMLInputElement;

// Pointer sungguhan, bukan `click` sintetis: Base UI `Select.Item` menetapkan
// nilainya di `pointerup`, jadi `click` saja membuka popup lalu tidak memilih
// apa pun — dan test-nya hijau sambil tidak menguji apa-apa (pedoman §7).
const onPickStatus = async (label: string) => {
  fireEvent.click(screen.getByLabelText("Status"));

  const option = await screen.findByRole("option", { name: label });

  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.pointerUp(option, { pointerType: "mouse" });
  fireEvent.click(option);
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "abs-0001");

  await waitFor(() => expect(clockIn().value).toBe("08:00"));
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah absensi karyawan"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Absensi Karyawan" })
        .getAttribute("href"),
    ).toBe(ABSENSI_LIST_PATH);
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "abs-0001");

    expect(
      screen.getByText("Tidak bisa mengubah absensi karyawan"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("form ubah: Hapus hanya dengan DELETE", async () => {
    onMockApi();
    await onRenderLoadedEdit(["UPDATE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

// U-F: `KaryawanAttendance` dibaca nol konsumen. Aturan "layarnya
// mengatakannya" tanpa penjaga hanyalah niat.
describe("absensi tidak memengaruhi gaji, dan layarnya mengatakannya", () => {
  test("catatan bagian ada di DOM dan menyebut Penggajian tidak membaca absensi", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    const note = screen.getByText(/Penggajian tidak membaca absensi/);
    expect(note.textContent).toMatch(/bukan masukan perhitungan/);
    expect(note.textContent).toMatch(/tidak mengurangi gaji/);
  });

  test("nol janji potongan di layar", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.queryByText(/memotong gaji/)).toBeNull();
    expect(screen.queryByText(/dipotong dari gaji/)).toBeNull();
  });

  // §0.3 no. 2: prompt password di layar nol angka gaji melatih orang
  // mengabaikannya.
  test("nol prompt password dan nol angka gaji", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Rp\s?\d/);
  });

  test("status Cuti mengatakan barisnya dicatat manual", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await onPickStatus("Cuti");

    await waitFor(() =>
      expect(
        screen.getByText(/Cuti yang disetujui tidak otomatis muncul/),
      ).toBeTruthy(),
    );
  });
});

describe("jam dibuang untuk status di luar Hadir, dan layarnya mendahuluinya", () => {
  test("memilih Libur men-disable dan mengosongkan kedua jam", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(clockIn(), { target: { value: "08:00" } });
    fireEvent.change(clockOut(), { target: { value: "17:00" } });
    expect(clockIn().disabled).toBe(false);

    await onPickStatus("Libur");

    await waitFor(() => expect(clockIn().disabled).toBe(true));
    expect(clockOut().disabled).toBe(true);
    expect([clockIn().value, clockOut().value]).toEqual(["", ""]);
  });

  test("kembali ke Hadir membuka kedua jam lagi", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await onPickStatus("Alpa");
    await waitFor(() => expect(clockIn().disabled).toBe(true));

    await onPickStatus("Hadir");
    await waitFor(() => expect(clockIn().disabled).toBe(false));
    expect(clockOut().disabled).toBe(false);
  });

  test("payload status di luar Hadir mengirim kedua jam null", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    await onPickStatus("Sakit");
    await waitFor(() => expect(clockIn().value).toBe(""));

    await onSaveConfirmed();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toMatchObject({
      status: "SAKIT",
      checkIn: null,
      checkOut: null,
    });
  });
});

describe("simpan", () => {
  test("isian kosong: konfirmasi tidak muncul", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        screen.getByText("Pilih karyawan yang dicatat kehadirannya"),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
  });

  test("Ya mengirim PUT, kembali ke daftar dengan filter dan sorot publicId", async () => {
    const listUrl = `${ABSENSI_LIST_PATH}?bulan=semua&page=2`;
    window.sessionStorage.setItem(`list-return:${ABSENSI_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          karyawanId: 1,
          date: addDays(TODAY, -3),
          checkIn: "08:00",
          checkOut: "17:00",
          status: "HADIR",
          note: null,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${ABSENSI_LIST_PATH}`),
    ).toBe("abs-0001");
  });

  test("409 tanggal ganda: galat di field tanggal, tetap di form", async () => {
    onMockApi({
      save: {
        status: 409,
        error:
          "Karyawan Ini Sudah Memiliki Absensi Pada Tanggal Tersebut. Ubah Data Yang Ada",
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText(
          "Karyawan ini sudah punya absensi di tanggal tersebut. Ubah baris yang sudah ada.",
        ),
      ).toBeTruthy(),
    );
    expect(replaced).toEqual([]);
  });

  test("404 karyawan: galat di field karyawan", async () => {
    onMockApi({ save: { status: 404, error: "Karyawan Tidak Ditemukan" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(screen.getByText("Karyawan ini tidak ditemukan.")).toBeTruthy(),
    );
  });

  test("galat 500: pesan di FormAlert, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    expect(clockIn().value).toBe("08:00");
  });
});

describe("publicId tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi({ isDetailMissing: true });
    onRenderForm(["VIEW", "UPDATE"], "abs-0001");

    await waitFor(() =>
      expect(
        screen.getByText("Data absensi karyawan tidak ditemukan"),
      ).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Jam masuk")).toBeNull();
  });
});

// Tujuh layar SDM lain soft-delete; ini tidak. Teks konfirmasinya yang
// memberitahu bedanya.
describe("hapus permanen", () => {
  test("konfirmasi menyebut permanen dan tidak bisa dikembalikan", async () => {
    onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    const dialog = await screen.findByText(/dihapus permanen/);
    expect(dialog.textContent).toMatch(/tidak bisa dikembalikan/);
    expect(
      screen.queryByText(
        "Apakah Anda ingin menghapus data absensi karyawan ini?",
      ),
    ).toBeNull();
  });

  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([ABSENSI_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("galat hapus: pesan server apa adanya, tetap di form", async () => {
    onMockApi({ remove: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Absensi karyawan belum terhapus.")).toBeTruthy(),
    );
    expect(replaced).toEqual([]);
  });
});
