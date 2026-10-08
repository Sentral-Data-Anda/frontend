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

import { TIPE_BARANG_LIST_PATH } from "../model";
import type { TipeBarang } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/inventaris/tipe-barang/baru",
  useSearchParams: () => new URLSearchParams(),
}));

// Sadar MENU, bukan satu jawaban untuk semua. Layar ini menanyakan dua menu
// yang berbeda -- TIPE_BARANG untuk form-nya, SETELAN_AKUNTANSI untuk ketiga
// akunnya -- dan mock yang mengabaikan menu mana yang ditanya membuat
// pemisahan wewenang itu tak teruji sama sekali. `accounting` default-nya
// KOSONG, jadi test yang tidak menyebutnya memakai peran paling sempit.
const accounting: { current: MenuAction[] } = { current: [] };

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (menu: string) => {
    const granted =
      menu === "SETELAN_AKUNTANSI" ? accounting.current : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { TipeBarangFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  actions.current = [];
  accounting.current = [];
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
        <TipeBarangFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah tipe barang")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data tipe barang."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Tipe Barang" })
        .getAttribute("href"),
    ).toBe(TIPE_BARANG_LIST_PATH);
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "TYP_ITM-0005");

    expect(screen.getByText("Tidak bisa mengubah tipe barang")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "TYP_ITM-0005");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "TYP_ITM-0005");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const ACCOUNT_DDL = [
  { id: 11, code: "1-200", name: "Peralatan", type: "ASSET", isActive: true },
  {
    id: 21,
    code: "1-290",
    name: "Akumulasi Penyusutan",
    type: "ASSET",
    isActive: true,
  },
  {
    id: 61,
    code: "5-200",
    name: "Beban Penyusutan",
    type: "EXPENSE",
    isActive: true,
  },
];

const DETAIL: TipeBarang = {
  code: "TYP_ITM-0005",
  publicId: "p-5",
  name: "Dekorasi",
  assetAccount: null,
  depreciationExpenseAccount: {
    id: 61,
    code: "5-200",
    name: "Beban Penyusutan",
  },
  accumulatedDepreciationAccount: null,
  inventoryExpenseAccount: null,
};

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/type-item/TYP_ITM-0005" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Tipe Barang",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/type-item/TYP_ITM-0005" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Tipe Barang",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/type-item" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Tipe Barang",
          data: { ...DETAIL, code: "TYP_ITM-0006", name: "Alat Tulis" },
        },
        { status: 201 },
      );
    }
    // Dijawab, bukan di-404-kan: picker akun memanggilnya, dan mock yang
    // menolak di tempat server menjawab adalah kebohongan dengan arah lain.
    if (url.startsWith("/api/v1/ddl/account")) {
      const type = new URL(url, "http://x").searchParams.get("type");

      return Response.json({
        status: 200,
        message: "ok",
        data: ACCOUNT_DDL.filter((row) => !type || row.type === type),
      });
    }
    if (url === "/api/v1/type-item/TYP_ITM-0005") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Tipe Barang Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "TYP_ITM-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Dekorasi",
    ),
  );
};

/** `onRenderLoadedEdit`, with a say over the Setelan Akuntansi grant too. */
const onRenderLoadedEditWithAccounting = async (granted: MenuAction[]) => {
  accounting.current = granted;
  const rendered = onRenderForm(["VIEW", "UPDATE"], "TYP_ITM-0005");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Dekorasi",
    ),
  );

  return rendered;
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("simpan", () => {
  test("nama kosong: konfirmasi tidak muncul, fokus ke nama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT dengan akun tersimpan utuh, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${TIPE_BARANG_LIST_PATH}?search=dek&page=2`;
    window.sessionStorage.setItem(
      `list-return:${TIPE_BARANG_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data tipe barang ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        // Ketiga akun SELALU terkirim, termasuk saat null: server
        // membedakan null (kosongkan) dari field yang tidak dikirim
        // (biarkan apa adanya).
        body: {
          name: "Dekorasi",
          assetAccountId: null,
          // 61 adalah akun yang sudah tersimpan di DETAIL, dikirim kembali
          // utuh: sekadar ganti nama tidak boleh menghapus akun tipe ini.
          depreciationExpenseAccountId: 61,
          accumulatedDepreciationAccountId: null,
          inventoryExpenseAccountId: null,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_BARANG_LIST_PATH}`),
    ).toBe("TYP_ITM-0005");
  });

  test("nama ganda (409 be-sada): galat di field nama", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Tipe Barang Sudah Tersedia",
        issues: [{ path: "name", message: "Tipe Barang Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Tipe dengan nama ini sudah ada. Pakai nama lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("galat 500: pesan di FormAlert, fokus ke Simpan", async () => {
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
  });
});

describe("tambah", () => {
  test("Ya mengirim POST dengan spasi dirapikan, huruf apa adanya, kembali ke daftar dan sorot baris baru", async () => {
    const listUrl = `${TIPE_BARANG_LIST_PATH}?search=alat`;
    window.sessionStorage.setItem(
      `list-return:${TIPE_BARANG_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "  alat   tulis " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menyimpan data tipe barang ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "POST",
        // Ketiga akun SELALU terkirim, termasuk saat null: server
        // membedakan null (kosongkan) dari field yang tidak dikirim
        // (biarkan apa adanya).
        body: {
          name: "alat tulis",
          assetAccountId: null,
          depreciationExpenseAccountId: null,
          accumulatedDepreciationAccountId: null,
          inventoryExpenseAccountId: null,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TIPE_BARANG_LIST_PATH}`),
    ).toBe("TYP_ITM-0006");
  });
});

describe("kode tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "TYP_ITM-9999");

    await waitFor(() =>
      expect(screen.getByText("Data tipe barang tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});

describe("hapus", () => {
  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data tipe barang ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([TIPE_BARANG_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada apa adanya di FormAlert, tetap di form", async () => {
    const message =
      "Tipe Barang Tidak Dapat Dihapus Karena Terhubung dengan Data Pengadaan";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Tipe barang belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

/**
 * Siapa yang boleh mengarahkan akun tipe barang.
 *
 * Form ini dijaga TIPE_BARANG, tapi ketiga akun itu memutuskan ke mana
 * penyusutan mendarat di buku besar — dan server menolak perubahannya kepada
 * siapa pun tanpa SETELAN_AKUNTANSI UPDATE. Picker yang ditampilkan ke
 * petugas inventaris hanya akan menghadiahi mereka 403 sesudah diisi.
 */
describe("akun akuntansi pada form", () => {
  test("tanpa Setelan Akuntansi: field terkunci, bukan picker", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const locked = screen.getByLabelText(
      "Akun beban penyusutan",
    ) as HTMLInputElement;

    expect(locked.readOnly).toBe(true);
    expect(locked.value).toBe("5-200 — Beban Penyusutan");
    expect(
      screen.queryByRole("combobox", { name: "Akun beban penyusutan" }),
    ).toBeNull();
  });

  test("akun yang belum diatur dikatakan apa adanya, bukan dibiarkan kosong", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    expect((screen.getByLabelText("Akun aset") as HTMLInputElement).value).toBe(
      "Belum diatur",
    );
  });

  test("field terkunci menyebut siapa yang bisa mengubahnya", async () => {
    onMockApi();
    const { container } = await onRenderLoadedEditWithAccounting([]);

    expect(container.textContent).toContain(
      "Hanya pemegang Setelan Akuntansi yang bisa mengubahnya.",
    );
  });

  test("dengan Setelan Akuntansi UPDATE: picker yang muncul", async () => {
    onMockApi();
    await onRenderLoadedEditWithAccounting(["VIEW", "UPDATE"]);

    expect(
      await screen.findByRole("combobox", { name: "Akun beban penyusutan" }),
    ).toBeTruthy();
    expect(
      (screen.queryByLabelText("Akun aset") as HTMLInputElement | null)
        ?.readOnly,
    ).not.toBe(true);
  });

  /**
   * Akun KEEMPAT, dan dia dijaga oleh izin yang sama.
   *
   * Dia memutuskan ke beban mana pemakaian persediaan tipe ini mendarat di
   * buku besar -- wewenang yang setara dengan ketiga akun lainnya, jadi
   * membiarkannya terbuka untuk petugas stok akan membatalkan pemisahan
   * wewenang yang dibangun tiga akun sebelumnya.
   */
  test("akun beban pemakaian persediaan ikut dijaga Setelan Akuntansi", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const locked = screen.getByLabelText(
      "Akun beban pemakaian persediaan",
    ) as HTMLInputElement;

    expect(locked.readOnly).toBe(true);
    expect(
      screen.queryByRole("combobox", {
        name: "Akun beban pemakaian persediaan",
      }),
    ).toBeNull();

    cleanup();
    onMockApi();
    await onRenderLoadedEditWithAccounting(["VIEW", "UPDATE"]);

    expect(
      await screen.findByRole("combobox", {
        name: "Akun beban pemakaian persediaan",
      }),
    ).toBeTruthy();
  });
});
