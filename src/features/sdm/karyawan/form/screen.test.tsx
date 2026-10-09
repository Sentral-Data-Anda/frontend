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
import type { MenuAction } from "@/types/menu";

import { KARYAWAN_LIST_PATH } from "../model";
import type { Karyawan } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/hr/employee/baru",
  useSearchParams: () => new URLSearchParams(),
}));

/** Sadar-slug — alasannya di `list/screen.test.tsx`. */
mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = slug === MENU.EMPLOYEE ? actions.current : [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { KaryawanFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const DETAIL: Karyawan = {
  id: 3,
  publicId: "karyawan-3",
  code: "KRY-0003",
  jemaatId: 7,
  jemaat: { id: 7, code: "JMT-0007", name: "Gideon Tampubolon" },
  name: "Gideon Tampubolon",
  phone: "081234567803",
  email: null,
  address: null,
  position: "Petugas Keamanan",
  joinDate: "2022-01-17T00:00:00.000Z",
  resignDate: null,
  status: "ACTIVE",
};

type Failure = { status: number; error: string };

const onMockApi = (
  failure: { save?: Failure | "network"; remove?: Failure } = {},
) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/ddl/jemaat")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 7, code: "JMT-0007", name: "Gideon Tampubolon" }],
      });
    }

    if (url === "/api/v1/karyawan/KRY-0003" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save === "network") throw new TypeError("gagal jaringan");
      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Karyawan",
        data: DETAIL,
      });
    }

    if (url === "/api/v1/karyawan/KRY-0003" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Karyawan",
        data: DETAIL,
      });
    }

    if (url === "/api/v1/karyawan" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Karyawan",
          data: { ...DETAIL, id: 9, code: "KRY-0009", name: "Ruth Siahaan" },
        },
        { status: 201 },
      );
    }

    if (url === "/api/v1/karyawan/KRY-0003") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Karyawan Tidak Ditemukan" },
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
        <KaryawanFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "KRY-0003");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Gideon Tampubolon",
    ),
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah karyawan")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"], "KRY-0003");

    expect(screen.getByText("Tidak bisa mengubah karyawan")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("form tambah tidak punya Hapus walau memegang DELETE", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", async () => {
    onMockApi();
    await onRenderLoadedEdit(["UPDATE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

/**
 * U-B: gereja tidak memotong PPh21, jadi dua kolom yang ADA di tabel sengaja
 * tidak diminta di sini. §0.3 no. 2: nol nominal gaji di luar Kontrak dan
 * Penggajian.
 *
 * Penandanya KELUARGA EJAAN, bukan satu kata, dan alasannya terukur: label
 * "Upah Pokok Bulanan" lolos penjaga ber-`/gaji/i` saja **dan** lolos penjaga
 * privasi bersama, yang menandai nama kolom skema — bukan kata yang dipakai
 * orang Indonesia menamai field. Keduanya diperlukan, dan keduanya buta
 * terhadap hal yang berbeda.
 *
 * Langit-langit yang disadari, supaya hijaunya tidak terbaca sebagai cakupan
 * yang tidak ia punya: ini memindai LABEL field yang benar-benar dirender di
 * form ini. Ia tidak melihat nominal yang muncul sebagai teks biasa, di layar
 * lain, atau di bawah label yang tidak memakai satu pun kata di bawah.
 */
const SALARY_WORDS =
  /gaji|upah|honor|tunjangan|potongan|nominal|salary|payroll/i;

describe("field yang sengaja tidak ada", () => {
  // PREDIKAT, dimutasikan terpisah dari pemindainya (pedoman §7.1): mempersempit
  // `SALARY_WORDS` gagal DI SINI, bukan lewat render yang kebetulan tetap hijau.
  test("penandanya keluarga ejaan, bukan satu kata", () => {
    for (const label of [
      "Upah Pokok Bulanan",
      "Honor per ibadah",
      "Tunjangan transport",
      "Nominal awal",
      "Potongan tetap",
      "Gaji pokok",
      "Base salary",
      "Payroll note",
    ]) {
      expect(SALARY_WORDS.test(label)).toBe(true);
    }

    // Arah kedua: kesepuluh label yang MEMANG ada di form ini tidak boleh ikut
    // tertangkap, atau penjaganya merah atas kode yang benar.
    for (const label of [
      "Nama",
      "Jemaat",
      "Kode",
      "Nomor HP",
      "Email",
      "Alamat",
      "Jabatan",
      "Tanggal bergabung",
      "Status",
      "Tanggal berhenti",
    ]) {
      expect(SALARY_WORDS.test(label)).toBe(false);
    }
  });

  test("nol field PPh21, nol field tipe upah, nol field bernominal", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    for (const label of [/ptkp/i, /npwp/i, /tipe upah/i, SALARY_WORDS]) {
      expect(screen.queryByLabelText(label)).toBeNull();
    }
  });

  test("kode hanya muncul di form ubah, dan read-only", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    expect(screen.queryByLabelText("Kode")).toBeNull();

    cleanup();
    await onRenderLoadedEdit();
    const code = screen.getByLabelText("Kode") as HTMLInputElement;
    expect(code.value).toBe("KRY-0003");
    expect(code.readOnly).toBe(true);
  });
});

describe("simpan", () => {
  test("isian kosong: konfirmasi tidak muncul, fokus ke field pertama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT, kembali ke daftar dengan filter dan sorot kodenya", async () => {
    const listUrl = `${KARYAWAN_LIST_PATH}?page=2`;
    window.sessionStorage.setItem(`list-return:${KARYAWAN_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          jemaatId: 7,
          name: "Gideon Tampubolon",
          phone: "081234567803",
          email: null,
          address: null,
          position: "Petugas Keamanan",
          joinDate: "2022-01-17",
          resignDate: null,
          status: "ACTIVE",
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${KARYAWAN_LIST_PATH}`),
    ).toBe("KRY-0003");
  });

  test("tambah mengirim POST dan menyorot kode baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  ruth   siahaan " },
    });
    fireEvent.change(screen.getByLabelText("Nomor HP"), {
      target: { value: "0812-3456-7899" },
    });
    fireEvent.change(screen.getByLabelText("Jabatan"), {
      target: { value: "Organis" },
    });
    const joinDate = screen.getByLabelText("Tanggal bergabung");
    fireEvent.change(joinDate, { target: { value: "02/03/2026" } });
    fireEvent.blur(joinDate);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([KARYAWAN_LIST_PATH]));
    expect(calls).toEqual([
      {
        method: "POST",
        body: {
          jemaatId: null,
          name: "Ruth Siahaan",
          phone: "081234567899",
          email: null,
          address: null,
          position: "Organis",
          joinDate: "2026-03-02",
          resignDate: null,
          status: "ACTIVE",
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${KARYAWAN_LIST_PATH}`),
    ).toBe("KRY-0009");
  });

  test("pesan server unik mendarat di fieldnya, bukan di galat form", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Tanggal Berhenti Tidak Boleh Lebih Awal Dari Tanggal Bergabung",
      },
    });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("resignDate"));
    expect(
      screen.getByText(
        "Tanggal berhenti tidak boleh lebih awal dari tanggal bergabung.",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat jaringan: galat tingkat form, isian tetap", async () => {
    onMockApi({ save: "network" });
    await onRenderLoadedEdit();

    fireEvent.change(screen.getByLabelText("Jabatan"), {
      target: { value: "Koster Utama" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    expect((screen.getByLabelText("Jabatan") as HTMLInputElement).value).toBe(
      "Koster Utama",
    );
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Gideon Tampubolon",
    );
    expect(replaced).toEqual([]);
  });
});

describe("hapus dan kode tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "KRY-9999");

    await waitFor(() =>
      expect(screen.getByText("Data karyawan tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([KARYAWAN_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  // S20, keputusan SK: tolak, jangan cascade. Layar menampilkan penolakannya
  // apa adanya dan TIDAK berpindah halaman, supaya isian tetap ada.
  test("409 karyawan masih dipakai: pesan tampil, tetap di form", async () => {
    onMockApi({
      remove: {
        status: 409,
        error:
          "Karyawan Masih Dipakai Kontrak, Absensi, Atau Slip Gaji Yang Aktif",
      },
    });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(screen.getByText("Karyawan belum terhapus.")).toBeTruthy(),
    );
    expect(
      screen.getByText(
        "Karyawan Masih Dipakai Kontrak, Absensi, Atau Slip Gaji Yang Aktif",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
