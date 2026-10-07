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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { exportControlsIn } from "../../../../../tests/export-guard";
import { onStubViewport } from "../../../../../tests/viewport";
import type { KontrakKaryawan } from "../types";

const granted: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/sdm/kontrak-karyawan",
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

const { KontrakListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const row = (
  code: string,
  name: string,
  extra: Partial<KontrakKaryawan> = {},
): KontrakKaryawan => ({
  id: Number(code.slice(-1)),
  publicId: `ktr-${code}`,
  code,
  karyawanId: 1,
  contractType: "TETAP",
  position: "Sekretaris",
  basicSalary: "4500000.00",
  effectiveFrom: "2020-01-01T00:00:00.000Z",
  effectiveTo: null,
  weeklyDayOff: [1],
  note: null,
  karyawan: { publicId: "kry-1", code: "KRY-0001", name },
  ...extra,
});

const ROWS: KontrakKaryawan[] = [
  row("KTR-0001", "Ani Wijaya"),
  row("KTR-0002", "Budi Santoso", {
    karyawanId: 2,
    position: "Koster",
    basicSalary: "3200000.00",
    weeklyDayOff: [],
  }),
  row("KTR-0003", "Citra Halim", {
    karyawanId: 3,
    contractType: "KONTRAK",
    position: "Bendahara Kantor",
    basicSalary: "5750000.00",
    effectiveFrom: "2019-01-01T00:00:00.000Z",
    effectiveTo: "2019-12-31T00:00:00.000Z",
  }),
  row("KTR-0004", "Dewi Pakpahan", {
    karyawanId: 4,
    position: "Pengasuh Anak",
    basicSalary: "1800000.00",
    effectiveFrom: "2099-01-01T00:00:00.000Z",
  }),
];

const onMockApi = (status = 200, code: string | null = null) => {
  globalThis.fetch = ((input: string | URL) => {
    const href = String(input);

    if (href.includes("/ddl/")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: [] }),
      );
    }

    if (status !== 200) {
      return Promise.resolve(
        Response.json(
          { status, error: "Verifikasi Password Diperlukan", code },
          { status },
        ),
      );
    }

    return Promise.resolve(
      Response.json({
        status: 200,
        message: "ok",
        totalData: ROWS.length,
        totalPage: 1,
        data: ROWS,
      }),
    );
  }) as unknown as typeof fetch;
};

const onRender = (actions: MenuAction[]) => {
  granted.current = { [MENU.KONTRAK_KARYAWAN]: actions };

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <KontrakListScreen />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  granted.current = {};
});

describe("gerbang izin daftar kontrak", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kontrak Karyawan"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  // Gerbang yang menjaga menu TETANGGA lolos kalau mocknya mengabaikan slug.
  test("VIEW di menu lain tidak membuka layar ini", () => {
    granted.current = { [MENU.PAYROLL]: ["VIEW", "CREATE", "UPDATE"] };

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <KontrakListScreen />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Anda tidak memiliki akses ke Kontrak Karyawan"),
    ).toBeTruthy();
  });

  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.queryByRole("link", { name: "Tambah kontrak" })).toBeNull();

    viewport.onRestore();
  });

  test("tanpa UPDATE: pensil tidak ada di DOM", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(
      screen.queryByRole("link", { name: "Ubah kontrak Ani Wijaya" }),
    ).toBeNull();

    viewport.onRestore();
  });
});

describe("baris kontrak", () => {
  test("gaji pokok dirender bersebelahan dengan namanya", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.getAllByText(/Rp 4\.500\.000/).length).toBeGreaterThan(0);

    viewport.onRestore();
  });

  test("status berlaku diturunkan dari tanggalnya", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Citra Halim")).toBeTruthy());
    expect(screen.getAllByText("Berlaku").length).toBeGreaterThan(0);
    expect(screen.getByText("Berakhir")).toBeTruthy();
    expect(screen.getByText("Akan datang")).toBeTruthy();

    viewport.onRestore();
  });

  test("kontrak tanpa libur mingguan ditandai di barisnya", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Budi Santoso")).toBeTruthy());
    expect(screen.getByText("Libur mingguan belum diisi")).toBeTruthy();

    viewport.onRestore();
  });

  // Dua ejaan untuk satu masa berlaku terbuka: kolom tabel memakai
  // `periodShortText` ("Sejak 1 Jan 2020") dengan bentuk panjangnya di `title`,
  // baris HP memakai `periodText` ("Sejak 1 Januari 2020") di metanya. Tanggal
  // karangan bisa muncul di salah satunya saja, jadi keduanya dijaga.
  test("masa berlaku terbuka tidak dirender sebagai tanggal karangan, di kolom dan di baris HP", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.getAllByText("Sejak 1 Jan 2020").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("Sejak 1 Januari 2020").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(/1970|Invalid Date/)).toBeNull();

    act(() => viewport.onResize(false));

    await waitFor(() =>
      expect(
        screen.getAllByText(/Sejak 1 Januari 2020/).length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryByText(/1970|Invalid Date/)).toBeNull();

    viewport.onRestore();
  });
});

describe("penanda data gaji", () => {
  test("menetap di daftar, dengan kata yang sama", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Data gaji")).toBeTruthy();
  });
});

/**
 * SDM §0.3 no. 1. Aturan tanpa penjaga adalah niat, jadi penjaganya menyapu
 * KELUARGA ejaan dan bukan satu literal, dan ia melihat DOM yang benar-benar
 * dirender, bukan sumbernya.
 */
describe("nol jalur ekspor", () => {
  test("nol kendali apa pun yang menawarkan berkas, termasuk yang di-portal", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "CREATE", "UPDATE", "DELETE"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());

    // Panel filter Base UI di-portal ke `body`: dibuka dulu supaya isinya
    // benar-benar ada di himpunan subjeknya.
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /Terapkan|Reset/ }).length,
      ).toBeGreaterThan(0),
    );

    // Dan opsi select di dalamnya: `SelectField` merender opsinya di dalam
    // `Select.Portal`, jadi DOM-nya belum ada sampai select-nya dibuka. Panel
    // yang terbuka dengan select yang masih tertutup adalah himpunan subjek
    // yang melewatkan tiap opsi — dua opsi palsu pernah lolos seluruh grup SDM
    // karena nol test membuka satu select pun. `fireEvent.click` tidak
    // membukanya; `keyDown` + `ArrowDown` yang membukanya.
    const triggers = screen.getAllByRole("combobox");
    // DUA di lebar tabel: filter karyawan di panel, dan "Baris per halaman" di
    // footer tabel. Yang kedua tidak ada sama sekali di lebar HP — dan selama
    // `onStubViewport(true)` cuma menjawab kueri 64rem, layar ini merender
    // baris HP, jadi select itu di luar himpunan subjek dan nol test pernah
    // membukanya.
    expect(triggers).toHaveLength(2);

    // Opsinya dihitung DI DALAM listbox select itu sendiri (`aria-controls`,
    // yang hanya ada selagi ia terbuka): select yang tertutup tetap
    // menyisakan satu `[role='option']` di `document`, jadi hitungan global
    // hijau untuk select yang sebenarnya gagal terbuka — kuantifier yang
    // mengukur himpunan orang lain. Diukur: dengan hitungan global, select
    // kedua di layar ini lolos tanpa pernah terbuka.
    const optionsOf = (trigger: Element) =>
      document
        .getElementById(trigger.getAttribute("aria-controls") ?? "")
        ?.querySelectorAll("[role='option']").length ?? 0;

    for (const trigger of triggers) {
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      await waitFor(() =>
        expect(trigger.getAttribute("aria-expanded")).toBe("true"),
      );

      expect(optionsOf(trigger)).toBeGreaterThan(0);
      expect(exportControlsIn(document)).toEqual([]);

      fireEvent.keyDown(trigger, { key: "Escape" });
      await waitFor(() =>
        expect(trigger.getAttribute("aria-expanded")).toBe("false"),
      );
    }

    viewport.onRestore();
  });

  test("penjaganya melihat ke luar container render", () => {
    const portal = document.createElement("div");
    portal.innerHTML = '<a download href="/x.csv">Unduh CSV</a>';
    document.body.append(portal);

    expect(exportControlsIn(document).length).toBe(2);

    portal.remove();
  });

  test("keluarga ejaan, bukan satu frasa", () => {
    const root = document.createElement("div");

    for (const label of [
      "Salin ke berkas",
      "Simpan berkas",
      "Arsipkan",
      "Bagikan",
      "Kirim ke email",
      "Spreadsheet",
      "Rekap bulanan",
      "Cetak semua",
      "Export",
    ]) {
      root.innerHTML = `<button type="button">${label}</button>`;
      expect(exportControlsIn(root)).toHaveLength(1);
    }
  });

  test("kendali biasa layar ini tidak kena positif palsu", () => {
    const root = document.createElement("div");

    for (const label of ["Simpan", "Batal", "Hapus", "Filter", "Coba lagi"]) {
      root.innerHTML = `<button type="button">${label}</button>`;
      expect(exportControlsIn(root)).toEqual([]);
    }
  });
});

describe("bacaan gaji dijaga StepUp", () => {
  test("403 STEP_UP_REQUIRED meminta password, bukan menyebut izin", async () => {
    onMockApi(403, "STEP_UP_REQUIRED");
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("Data gaji terkunci")).toBeTruthy(),
    );
    expect(
      screen.getByText("Masukkan password akun Anda untuk melihat data gaji."),
    ).toBeTruthy();
    expect(screen.queryByText(/tidak memiliki akses/)).toBeNull();
  });

  test("403 biasa tetap galat daftar, bukan permintaan password", async () => {
    const viewport = onStubViewport(true);
    onMockApi(403, null);
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() =>
      expect(screen.getByText("Verifikasi Password Diperlukan")).toBeTruthy(),
    );
    expect(screen.queryByText("Data gaji terkunci")).toBeNull();

    viewport.onRestore();
  });

  test("daftar yang terbuka tidak menampilkan dialog password", async () => {
    const viewport = onStubViewport(true);
    onMockApi();
    onRender(["VIEW", "UPDATE"]);

    await waitFor(() => expect(screen.getByText("Ani Wijaya")).toBeTruthy());
    expect(screen.queryByText("Konfirmasi Password")).toBeNull();

    viewport.onRestore();
  });
});
