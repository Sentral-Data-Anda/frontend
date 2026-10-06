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

import { exportControlsIn } from "../export-guard";
import { LIST_PATH } from "../model";
import type { KontrakKaryawan } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/sdm/kontrak-karyawan/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const actions = granted.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { KontrakFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const DETAIL: KontrakKaryawan = {
  id: 1,
  publicId: "ktr-1",
  code: "KTR-0001",
  karyawanId: 1,
  contractType: "KONTRAK",
  position: "Sekretaris",
  basicSalary: "4500000.00",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  effectiveTo: null,
  weeklyDayOff: [1],
  note: null,
  karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Ani Wijaya" },
};

const sent: { method: string; body: Record<string, unknown> }[] = [];

type Failure = { status: number; error: string; code?: string };

const onMockApi = (
  detail: KontrakKaryawan = DETAIL,
  options: { detailFailure?: Failure; saveFailure?: Failure } = {},
) => {
  globalThis.fetch = ((input: string | URL, init?: RequestInit) => {
    const href = String(input);
    const method = init?.method ?? "GET";

    if (href.includes("/ddl/karyawan")) {
      return Promise.resolve(
        Response.json({
          status: 200,
          message: "ok",
          data: [{ id: 1, code: "KRY-0001", name: "Ani Wijaya" }],
        }),
      );
    }

    if (method === "GET" && options.detailFailure) {
      return Promise.resolve(
        Response.json(options.detailFailure, {
          status: options.detailFailure.status,
        }),
      );
    }

    if (method !== "GET") {
      sent.push({
        method,
        body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
      });

      if (options.saveFailure) {
        return Promise.resolve(
          Response.json(options.saveFailure, {
            status: options.saveFailure.status,
          }),
        );
      }
    }

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: detail }),
    );
  }) as unknown as typeof fetch;
};

const onRender = (actions: MenuAction[], code?: string) => {
  granted.current = { [MENU.KONTRAK_KARYAWAN]: actions };

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <KontrakFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onLoaded = () =>
  waitFor(() =>
    expect(
      (screen.getByLabelText("Karyawan") as HTMLInputElement).readOnly,
    ).toBe(true),
  );

const onSave = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  sent.length = 0;
  replaced.length = 0;
  granted.current = {};
});

describe("gerbang izin form kontrak", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah kontrak")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Kontrak Karyawan" })
        .getAttribute("href"),
    ).toBe(LIST_PATH);
    expect(screen.queryByLabelText("Berlaku dari")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender(["VIEW", "CREATE"], "KTR-0001");

    expect(screen.getByText("Tidak bisa mengubah kontrak")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  // CREATE di menu tetangga tidak boleh membuka form ini.
  test("izin menu lain tidak membuka form", () => {
    granted.current = { [MENU.PAYROLL]: ["VIEW", "CREATE", "UPDATE"] };

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Toast.Provider>
          <KontrakFormScreen />
        </Toast.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Tidak bisa menambah kontrak")).toBeTruthy();
  });

  test("Hapus hanya dengan DELETE", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE", "DELETE"], "KTR-0001");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy(),
    );
  });
});

describe("kontrak tidak bisa dipindahkan ke karyawan lain", () => {
  test("pada ubah, Karyawan read-only dan bukan pilihan", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();

    const field = screen.getByLabelText("Karyawan") as HTMLInputElement;

    expect(field.readOnly).toBe(true);
    expect(field.value).toBe("Ani Wijaya");
    expect(field.tagName).toBe("INPUT");
    expect(screen.queryByRole("combobox", { name: "Karyawan" })).toBeNull();
  });

  test("kodenya ikut read-only pada ubah dan tidak ada pada tambah", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    expect(
      (screen.getByLabelText("Kode kontrak") as HTMLInputElement).value,
    ).toBe("KTR-0001");

    cleanup();
    onMockApi();
    onRender(["VIEW", "CREATE"]);
    expect(screen.queryByLabelText("Kode kontrak")).toBeNull();
  });

  test("PUT tetap membawa karyawanId yang sama", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    await onSave();

    await waitFor(() => expect(sent.length).toBe(1));
    expect(sent[0].method).toBe("PUT");
    expect(sent[0].body).toMatchObject({ karyawanId: 1 });
  });
});

describe("libur mingguan", () => {
  test("tujuh hari, Senin lebih dulu, tanpa bawaan", () => {
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    const days = screen.getAllByRole("checkbox") as HTMLInputElement[];

    expect(days.length).toBe(7);
    expect(days.every((day) => !day.checked)).toBe(true);
    expect(screen.getByText("Senin")).toBeTruthy();
    expect(screen.getByText("Minggu")).toBeTruthy();
  });

  test("kosong ditolak saat Simpan, bukan saat blur", async () => {
    onMockApi({ ...DETAIL, weeklyDayOff: [] });
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    expect(screen.queryByText("Libur mingguan wajib dipilih")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Libur mingguan wajib dipilih"),
    ).toBeTruthy();
    expect(sent.length).toBe(0);
  });

  test("kontrak lama tanpa libur mingguan mengatakannya terus terang", async () => {
    onMockApi({ ...DETAIL, weeklyDayOff: [] });
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    expect(screen.getByText(/tercatat tanpa libur mingguan/)).toBeTruthy();
  });

  test("hari yang dicentang terkirim sebagai angka getUTCDay", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();

    const days = screen.getAllByRole("checkbox") as HTMLInputElement[];

    await waitFor(() => expect(days[0].checked).toBe(true));
    fireEvent.click(days[5]);
    await onSave();

    await waitFor(() => expect(sent.length).toBe(1));
    expect(sent[0].body.weeklyDayOff).toEqual([1, 6]);
  });
});

describe("galat server", () => {
  test("409 tumpang-tindih menempel di Berlaku dari, dengan pesannya", async () => {
    onMockApi(DETAIL, {
      saveFailure: {
        status: 409,
        error:
          "Karyawan ini sudah memiliki kontrak pada periode yang dipilih. Ubah periodenya atau hapus kontrak yang lama",
      },
    });
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    await onSave();

    const message = await screen.findByText(
      /sudah memiliki kontrak pada periode yang dipilih/,
    );

    expect(message.id).toBe("effectiveFrom-error");
    expect(
      screen.getByLabelText("Berlaku dari").getAttribute("aria-describedby"),
    ).toBe("effectiveFrom-error");
    expect(screen.queryByText(/Data belum tersimpan/)).toBeNull();
  });

  test("galat jaringan tidak membuang isian", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();

    globalThis.fetch = (() =>
      Promise.reject(
        new TypeError("Failed to fetch"),
      )) as unknown as typeof fetch;

    await onSave();

    expect(await screen.findByText(/Data belum tersimpan/)).toBeTruthy();
    expect((screen.getByLabelText("Jabatan") as HTMLInputElement).value).toBe(
      "Sekretaris",
    );
  });
});

describe("jalan keluar sesudah simpan", () => {
  test("menyorot baris yang disimpan lalu kembali ke daftar", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    await onSave();

    await waitFor(() => expect(replaced.length).toBe(1));
    expect(replaced[0]).toBe(LIST_PATH);
    expect(window.sessionStorage.getItem(`list-focus:${LIST_PATH}`)).toBe(
      "KTR-0001",
    );
  });
});

describe("bacaan gaji dijaga StepUp", () => {
  test("403 STEP_UP_REQUIRED meminta password, bukan menyebut izin", async () => {
    onMockApi(DETAIL, {
      detailFailure: {
        status: 403,
        error: "Verifikasi Password Diperlukan",
        code: "STEP_UP_REQUIRED",
      },
    });
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    expect(await screen.findByText("Data gaji terkunci")).toBeTruthy();
    expect(
      screen.getByText("Masukkan password akun Anda untuk melihat data gaji."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Jabatan")).toBeNull();
  });

  // 403 POLOS: bukan step-up, bukan 404. Dulu layar ini diam-diam jadi form
  // TAMBAH — judul ubah, Simpan aktif, field kosong, Karyawan bisa dipilih.
  test("muat yang gagal di luar 404 tetap form ubah dan tidak bisa disimpan", async () => {
    onMockApi(DETAIL, {
      detailFailure: { status: 403, error: "Akses ditolak" },
    });
    onRender(["VIEW", "UPDATE", "DELETE"], "KTR-0001");

    expect(await screen.findByText("Kontrak ini belum bisa dimuat.")).toBeTruthy();

    const field = screen.getByLabelText("Karyawan") as HTMLInputElement;

    expect(field.readOnly).toBe(true);
    expect(screen.queryByRole("combobox", { name: "Karyawan" })).toBeNull();
    expect((screen.getByLabelText("Kode kontrak") as HTMLInputElement).value).toBe(
      "KTR-0001",
    );
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Hapus" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByText("Data gaji terkunci")).toBeNull();
  });

  test("404 tetap keadaan tidak ditemukan", async () => {
    onMockApi(DETAIL, {
      detailFailure: { status: 404, error: "Kontrak Karyawan Tidak Ditemukan" },
    });
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    expect(await screen.findByText(/tidak ditemukan/i)).toBeTruthy();
    expect(screen.queryByText("Data gaji terkunci")).toBeNull();
  });
});

describe("penanda data gaji dan nol jalur ekspor", () => {
  test("penanda menetap di form", () => {
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    expect(screen.getByText("Data gaji")).toBeTruthy();
  });

  test("judul halaman tidak memuat nominal", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "KTR-0001");

    await onLoaded();
    expect(screen.getByText("Ubah Kontrak Karyawan")).toBeTruthy();
    expect(screen.queryByText(/Ubah Kontrak Karyawan.*Rp/)).toBeNull();
  });

  test("nol kendali apa pun yang menawarkan berkas, termasuk di dialog", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE", "DELETE"], "KTR-0001");

    await onLoaded();

    // Dialog konfirmasi di-portal ke `body`, jadi ia dibuka dulu.
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByRole("button", { name: "Ya" });

    expect(exportControlsIn(document)).toEqual([]);
  });
});
