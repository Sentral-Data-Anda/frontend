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

import { TIPE_CUTI_LIST_PATH } from "../model";
import type { TipeCuti } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/hr/leave-type/baru",
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

const { TipeCutiFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <TipeCutiFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const DETAIL: TipeCuti = {
  id: 1,
  publicId: "p-1",
  code: "TCT-0001",
  name: "Cuti Tahunan",
  maxDaysPerYear: 12,
  isPaid: true,
  isActive: true,
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (
  options: { save?: Failure; remove?: Failure; detail?: TipeCuti } = {},
) => {
  const calls: { method: string; body?: unknown }[] = [];
  const detail = options.detail ?? DETAIL;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/tipe-cuti/TCT-0001" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (options.save) {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Mengubah Tipe Cuti",
        data: detail,
      });
    }
    if (url === "/api/v1/tipe-cuti/TCT-0001" && method === "DELETE") {
      calls.push({ method });

      if (options.remove) {
        return Response.json(options.remove, {
          status: options.remove.status,
        });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Tipe Cuti",
        data: detail,
      });
    }
    if (url === "/api/v1/tipe-cuti" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (options.save) {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json(
        {
          status: 201,
          message: "Berhasil Menambahkan Tipe Cuti",
          data: { ...detail, id: 8, code: "TCT-0008", name: "Cuti Duka" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/tipe-cuti/TCT-0001") {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "Tipe Cuti Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "TCT-0001");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Cuti Tahunan",
    ),
  );
};

const daysInput = () =>
  screen.getByLabelText("Jumlah hari") as HTMLInputElement;

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah tipe cuti")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Tipe Cuti" })
        .getAttribute("href"),
    ).toBe(TIPE_CUTI_LIST_PATH);
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "TCT-0001");

    expect(screen.getByText("Tidak bisa mengubah tipe cuti")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "TCT-0001");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "TCT-0001");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

// U-F: Penggajian tidak membaca cuti. Kalimat ini yang menghalangi layar
// menjanjikan potongan yang tidak pernah terjadi.
describe("isPaid dekoratif dikatakan terus terang", () => {
  test("catatan bagian menyebut Penggajian tidak membaca cuti", () => {
    onRenderForm(["VIEW", "CREATE"]);

    const note = screen.getByText(/Penggajian tidak membaca cuti/);
    expect(note.textContent).toMatch(/tidak mengurangi gaji/);
  });

  test("tidak ada janji potongan di layar", () => {
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.queryByText(/memotong gaji/)).toBeNull();
    expect(screen.queryByText(/dipotong dari gaji/)).toBeNull();
  });
});

describe("Tanpa batas vs nol hari", () => {
  test("Tanpa batas mengosongkan dan men-disable isian hari", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(daysInput(), { target: { value: "12" } });
    expect(daysInput().disabled).toBe(false);

    fireEvent.click(screen.getByRole("radio", { name: "Tanpa batas" }));

    await waitFor(() => expect(daysInput().disabled).toBe(true));
    expect(daysInput().value).toBe("");
  });

  test("Tanpa batas mengirim maxDaysPerYear null", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Cuti Melahirkan" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Tanpa batas" }));
    await onSaveConfirmed();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toEqual({
      name: "Cuti Melahirkan",
      maxDaysPerYear: null,
      isPaid: true,
      isActive: true,
    });
  });

  test("Dibatasi dengan 0 hari: konfirmasi tidak muncul, galat di isian hari", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Cuti Duka" },
    });
    fireEvent.change(daysInput(), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        screen.getByText("Isi jatah minimal 1 hari, atau pilih Tanpa batas"),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
  });

  test("isian hari menolak huruf", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(daysInput(), { target: { value: "1a2" } });

    expect(daysInput().value).toBe("12");
  });
});

describe("simpan", () => {
  test("nama kosong: konfirmasi tidak muncul, fokus ke nama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT lengkap, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${TIPE_CUTI_LIST_PATH}?search=tahun&page=2`;
    window.sessionStorage.setItem(
      `list-return:${TIPE_CUTI_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data tipe cuti ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          name: "Cuti Tahunan",
          maxDaysPerYear: 12,
          isPaid: true,
          isActive: true,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_CUTI_LIST_PATH}`),
    ).toBe("TCT-0001");
  });

  test("ubah memuat Tanpa batas sebagai Tanpa batas, bukan 0 hari", async () => {
    onMockApi({ detail: { ...DETAIL, maxDaysPerYear: null } });
    onRenderForm(["VIEW", "UPDATE"], "TCT-0001");

    await waitFor(() => expect(daysInput().disabled).toBe(true));
    expect(daysInput().value).toBe("");
    expect(
      (screen.getByRole("radio", { name: "Tanpa batas" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  test("kode tampil read-only hanya di mode ubah", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const code = screen.getByLabelText("Kode") as HTMLInputElement;
    expect(code.value).toBe("TCT-0001");
    expect(code.readOnly).toBe(true);

    cleanup();
    onRenderForm(["VIEW", "CREATE"]);
    expect(screen.queryByLabelText("Kode")).toBeNull();
  });

  test("nama ganda (409 be-sada): galat di field nama", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Tipe Cuti Sudah Tersedia",
        issues: [{ path: "name", message: "Tipe Cuti Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Tipe cuti dengan nama ini sudah ada. Pakai nama lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat 500: pesan di FormAlert, fokus ke Simpan, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Cuti Tahunan",
    );
  });
});

describe("tambah", () => {
  test("Ya mengirim POST, spasi dirapikan, sorot baris baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  Cuti   Duka " },
    });
    fireEvent.change(daysInput(), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("radio", { name: "Tidak dibayar" }));
    fireEvent.click(screen.getByRole("radio", { name: "Tidak aktif" }));
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([TIPE_CUTI_LIST_PATH]));
    expect(calls).toEqual([
      {
        method: "POST",
        body: {
          name: "Cuti Duka",
          maxDaysPerYear: 2,
          isPaid: false,
          isActive: false,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_CUTI_LIST_PATH}`),
    ).toBe("TCT-0008");
  });
});

describe("kode tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "TCT-9999");

    await waitFor(() =>
      expect(screen.getByText("Data tipe cuti tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});

// Hapus ditolak be-sada begitu ada pengajuan cuti yang menunjuk tipe ini —
// termasuk yang CANCELLED dan REJECTED. Teks konfirmasinya diuji karena ia
// yang mengarahkan user ke tindakan yang benar.
describe("hapus", () => {
  test("konfirmasi menawarkan nonaktifkan, bukan pertanyaan telanjang", async () => {
    onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    const dialog = await screen.findByText(/Hapus hanya untuk tipe/);
    expect(dialog.textContent).toMatch(/nonaktifkan saja/i);
    expect(dialog.textContent).toMatch(/riwayatnya tetap terbaca/);
    expect(
      screen.queryByText("Apakah Anda ingin menghapus data tipe cuti ini?"),
    ).toBeNull();
  });

  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([TIPE_CUTI_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada apa adanya, tetap di form", async () => {
    const message =
      "Tipe Cuti Ini Sudah Dipakai Oleh Pengajuan Cuti. Nonaktifkan Saja, Jangan Dihapus";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Tipe cuti belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
