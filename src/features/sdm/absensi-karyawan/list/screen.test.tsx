import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
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
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import {
  absensiKaryawanMock,
  resetAttendanceRows,
} from "../../../../../scripts/mock/handlers/absensi-karyawan";
import { resetKaryawanRows } from "../../../../../scripts/mock/handlers/karyawan";
import { onStubViewport } from "../../../../../tests/viewport";

const search = { current: "" };
const replaced: string[] = [];
const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (url: string) => void replaced.push(url),
  }),
  usePathname: () => "/hr/attendance",
  useSearchParams: () => new URLSearchParams(search.current),
}));

/**
 * Mock SADAR-SLUG: factory yang mengabaikan argumennya membuat layar yang
 * menjaga menu yang salah tetap hijau, yaitu persis kelas bug yang
 * `useMenuAccess` ada untuk mencegah.
 */
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

const { AbsensiListScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;
let suiteFetch: typeof fetch;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/ddl/karyawan") {
      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 1, code: "KRY-0001", name: "Andreas Sitanggang" }],
      });
    }

    return absensiKaryawanMock({
      request: new Request(url),
      url,
      path,
      method: "GET",
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    });
  }) as typeof fetch;
  suiteFetch = globalThis.fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

// Pedoman §7.2: dua larik, dua reset milik modul penyemainya.
beforeEach(() => {
  resetAttendanceRows();
  resetKaryawanRows();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = suiteFetch;
  search.current = "";
  replaced.length = 0;
});

const onRenderList = (granted: MenuAction[], query = "") => {
  actions.current = granted;
  search.current = query;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AbsensiListScreen />
    </QueryClientProvider>,
  );
};

const onLoaded = async () =>
  waitFor(() =>
    expect(screen.getAllByText(/Andreas Sitanggang/).length).toBeGreaterThan(0),
  );

describe("gerbang VIEW", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa daftar dan tanpa permintaan", () => {
    let isFetched = false;
    const previous = globalThis.fetch;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderList([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Absensi Karyawan"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);

    globalThis.fetch = previous;
  });

  // Mock di atas hanya memberi hibah ke ATTENDANCE, jadi layar yang
  // menjaga slug lain merender keadaan tanpa akses di SETIAP test di bawah ini.
  test("dengan VIEW: daftar dirender, bukan keadaan tanpa akses", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(
      screen.queryByText("Anda tidak memiliki akses ke Absensi Karyawan"),
    ).toBeNull();
  });
});

describe("gerbang tambah dan ubah", () => {
  test("tanpa CREATE: tombol tambah tidak ada di DOM", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(
      screen.queryByRole("link", { name: "Tambah absensi karyawan" }),
    ).toBeNull();
  });

  test("dengan CREATE: tombol tambah menuju rute baru", async () => {
    onRenderList(["VIEW", "CREATE"]);
    await onLoaded();

    expect(
      screen
        .getByRole("link", { name: "Tambah absensi karyawan" })
        .getAttribute("href"),
    ).toBe("/hr/attendance/baru");
  });

  test("tanpa UPDATE: baris tidak bertaut ke form ubah", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(
      screen.queryAllByRole("link", { name: /^Ubah absensi/ }),
    ).toHaveLength(0);
  });

  test("dengan UPDATE: tautan ubah memakai publicId, bukan id internal", async () => {
    onRenderList(["VIEW", "UPDATE"]);
    await onLoaded();

    const links = screen.getAllByRole("link", { name: /^Ubah absensi/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute("href")).toMatch(
      /^\/hr\/attendance\/abs-\d{4}\/ubah$/,
    );
  });
});

describe("daftar", () => {
  test("subjudul menyebut periodenya, bukan angka telanjang", async () => {
    onRenderList(["VIEW"]);

    // Bawaan menyaring ke bulan berjalan, jadi angkanya BUKAN total tabel.
    await waitFor(() =>
      expect(screen.getByText(/\d+ catatan absensi · \w+ \d{4}/)).toBeTruthy(),
    );
  });

  const onRenderEmpty = (query = "") => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://mock.test");

      return url.pathname.endsWith("/ddl/karyawan")
        ? Response.json({ status: 200, message: "OK", data: [] })
        : Response.json({
            status: 200,
            message: "OK",
            totalData: 0,
            totalPage: 1,
            data: [],
          });
    }) as typeof fetch;

    onRenderList(["VIEW"], query);
  };

  // Bawaan menyaring, jadi "belum ada" di sini akan berbohong tentang bulan lain.
  test("kosong di bulan berjalan berbunyi 'tidak ada', bukan 'belum ada'", async () => {
    onRenderEmpty();

    expect(await screen.findByText("Tidak ada absensi karyawan")).toBeTruthy();
    expect(screen.queryByText("Belum ada absensi karyawan")).toBeNull();
    expect(
      screen.getByText(/Pilih Semua bulan untuk melihat seluruh catatan/),
    ).toBeTruthy();
  });

  test("kosong di semua bulan baru berbunyi 'belum ada'", async () => {
    onRenderEmpty("bulan=semua");

    expect(await screen.findByText("Belum ada absensi karyawan")).toBeTruthy();
    expect(screen.queryByText("Tidak ada absensi karyawan")).toBeNull();
  });

  /**
   * Rakitan nyata, bukan prop palsu: `useListParams` + `ListToolbar` yang
   * benar-benar terpasang. Bawaan layar ini menyaring ke bulan berjalan, jadi
   * indikatornya harus menyala di bawaan dan mati di `?bulan=semua` — terbalik
   * dari layar yang bawaannya netral.
   */
  test("bawaan bulan berjalan: tombol Filter berbadge dan satu label hapus-filter", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(
      screen.getByRole("button", { name: "Filter, 1 aktif" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hapus filter Bulan: Bulan ini" }),
    ).toBeTruthy();
  });

  test("bulan=semua: tanpa badge dan tanpa label hapus-filter", async () => {
    onRenderList(["VIEW"], "bulan=semua");
    await onLoaded();

    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Filter aktif" })).toBeNull();
  });

  test("karyawan menambah satu label di atas bawaan bulan yang menyaring", async () => {
    onRenderList(["VIEW"], "karyawan=1");
    await onLoaded();

    expect(
      screen.getByRole("button", { name: "Filter, 2 aktif" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hapus semua" })).toBeTruthy();
  });

  test("Hapus semua mengembalikan bulan ke 'semua', bukan membiarkannya kosong", async () => {
    onRenderList(["VIEW"], "karyawan=1");
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Hapus semua" }));

    expect(replaced.at(-1)).toContain("bulan=semua");
  });

  test("Semua bulan dikatakan di subjudul", async () => {
    onRenderList(["VIEW"], "bulan=semua");

    await waitFor(() =>
      expect(
        screen.getByText(/\d+ catatan absensi · semua bulan/),
      ).toBeTruthy(),
    );
  });

  // U-F. Penjaga sebelumnya memaksa `bulan=semua` supaya cabangnya tercapai —
  // yaitu menguji penjaga pada instance yang bukan instance nyatanya (§7.1).
  // Keadaan di bawah ini adalah yang dibuka orang tanpa menyentuh apa pun.
  test("keadaan BAWAAN memuat kalimat bahwa absensi tidak memengaruhi gaji", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    const note = screen.getByText(/Penggajian tidak membaca absensi/);
    expect(note.textContent).toMatch(/bukan masukan perhitungan/);
    expect(note.textContent).toMatch(/tidak mengurangi gaji/);
  });

  test("kalimat itu tetap ada saat daftarnya kosong", async () => {
    onRenderList(["VIEW"], "bulan=2026-01");

    await waitFor(() =>
      expect(screen.getByText(/Penggajian tidak membaca absensi/)).toBeTruthy(),
    );
  });

  test("nol janji potongan di daftar", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(screen.queryByText(/memotong gaji/)).toBeNull();
    expect(screen.queryByText(/dipotong dari gaji/)).toBeNull();
  });

  // `due` memerahkan teksnya dan berarti ditolak/gagal/jatuh tempo di seluruh
  // aplikasi. Diperiksa di tempat ia dirender, bukan hanya di tabel petanya.
  // Prasyarat dinyatakan, bukan diandalkan: baris Alpa benih jatuh di
  // TODAY-1, yang keluar dari filter bulan bawaan setiap tanggal 1.
  test("chip Alpa tidak memakai varian kegagalan uang", async () => {
    onRenderList(["VIEW"], "bulan=semua");
    await onLoaded();

    const alpa = screen.getAllByText("Alpa")[0];
    const hadir = screen.getAllByText("Hadir")[0];

    expect(alpa.className).not.toMatch(/text-destructive|failed-700/);
    expect(alpa.className).not.toBe(hadir.className);
  });

  test("tanpa kotak cari: be-sada belum menerima ?filter", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.getByRole("button", { name: /Filter/ })).toBeTruthy();
  });

  test("status dirender sebagai label Indonesia, bukan nama enum", async () => {
    onRenderList(["VIEW"]);
    await onLoaded();

    expect(screen.getAllByText("Hadir").length).toBeGreaterThan(0);
    expect(screen.queryByText("HADIR")).toBeNull();
  });

  test("bawaan daftar bulan ini: permintaan membawa rentang tanggal", async () => {
    const seen: string[] = [];
    const previous = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return previous(input);
    }) as typeof fetch;

    onRenderList(["VIEW"]);
    await onLoaded();

    const listCall = seen.find((url) => url.includes("/absensi-karyawan?"));
    expect(listCall).toMatch(/startDate=\d{4}-\d{2}-01/);
    expect(listCall).toMatch(/endDate=\d{4}-\d{2}-\d{2}/);

    globalThis.fetch = previous;
  });

  test("Semua bulan mencabut rentang dari permintaan", async () => {
    const seen: string[] = [];
    const previous = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return previous(input);
    }) as typeof fetch;

    onRenderList(["VIEW"], "bulan=semua");
    await onLoaded();

    const listCall = seen.find((url) => url.includes("/absensi-karyawan?"));
    expect(listCall).not.toMatch(/startDate=/);
    expect(listCall).not.toMatch(/endDate=/);

    globalThis.fetch = previous;
  });

  // Keadaan kosong punya tiga kalimat, dan yang salah menyuruh orang melakukan
  // apa yang baru saja ia lakukan.
  test("kosong karena bulan: menawarkan Semua bulan", async () => {
    onRenderList(["VIEW"], "bulan=2026-01");

    await waitFor(() =>
      expect(
        screen.getByText(/Pilih Semua bulan untuk melihat seluruh catatan/),
      ).toBeTruthy(),
    );
  });

  test("kosong karena filter lain, Semua bulan aktif: tidak menyuruh pilih Semua bulan lagi", async () => {
    onRenderList(["VIEW"], "bulan=semua&status=CUTI&karyawan=2");

    await waitFor(() =>
      expect(screen.getByText(/cocok dengan filter/)).toBeTruthy(),
    );
    expect(screen.queryByText(/Pilih Semua bulan/)).toBeNull();
  });

  test("kosong tanpa batas apa pun: deskripsi hari pertama, bukan saran filter", async () => {
    process.env.MOCK_EMPTY = "1";
    onRenderList(["VIEW"], "bulan=semua");

    await waitFor(() =>
      expect(screen.getByText(/Satu baris per karyawan per hari/)).toBeTruthy(),
    );
    expect(screen.queryByText(/Pilih Semua bulan/)).toBeNull();
    expect(screen.queryByText(/cocok dengan filter/)).toBeNull();
    delete process.env.MOCK_EMPTY;
  });

  test("status di URL diteruskan ke permintaan", async () => {
    const seen: string[] = [];
    const previous = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return previous(input);
    }) as typeof fetch;

    onRenderList(["VIEW"], "status=ALPA&bulan=semua");
    await waitFor(() =>
      expect(seen.some((url) => url.includes("/absensi-karyawan?"))).toBe(true),
    );

    expect(seen.find((url) => url.includes("/absensi-karyawan?"))).toMatch(
      /status=ALPA/,
    );

    globalThis.fetch = previous;
  });
});
