import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ToastHost } from "@/components/common/feedback";
import type { MenuAction } from "@/types/menu";

import { DAFTAR_PELAYAN_LIST_PATH } from "../model";
import type { FutureSlot, PelayanDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pelayanan/daftar-pelayan/baru",
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

const { DaftarPelayanFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const BETHARI: PelayanDetail = {
  code: "PLYN_0001-0002",
  typePelayan: "INDIVIDUAL",
  jemaatId: "2",
  name: null,
  phone: null,
  bapelId: "1",
  rolePelayan: ["2", "4"],
  members: [],
  musikSkill: ["1"],
  status: true,
  jemaat: { id: 2, code: "JMT-0002", name: "Bethari Ayu Kusuma" },
  memberList: [],
};

const EFRATA: PelayanDetail = {
  code: "GPLYN_0001-0001",
  typePelayan: "GROUP",
  jemaatId: null,
  name: "Paduan Suara Efrata",
  phone: "081234567890",
  bapelId: "1",
  rolePelayan: ["4"],
  members: ["9", "10"],
  musikSkill: [],
  status: true,
  jemaat: null,
  memberList: [
    { id: 9, code: "JMT-0009", name: "Immanuel Saragih" },
    { id: 10, code: "JMT-0010", name: "Josephine Tanuwijaya" },
  ],
};

const DETAILS: Record<string, PelayanDetail> = {
  [BETHARI.code]: BETHARI,
  [EFRATA.code]: EFRATA,
};

const DDL: Record<string, { id: number; code?: string; name: string }[]> = {
  bapel: [
    { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
    { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
  ],
  "role-pelayan": [
    { id: 2, name: "Pemusik" },
    { id: 4, name: "Singer" },
  ],
  "skill-music": [{ id: 1, name: "Keyboard" }],
  jemaat: [
    { id: 8, code: "JMT-0008", name: "Hanna Simorangkir" },
    { id: 9, code: "JMT-0009", name: "Immanuel Saragih" },
  ],
};

const slot = (day: number): FutureSlot => ({
  code: `JDL_0001-2026-000${day}`,
  name: `Pelayan Ibadah ${day}`,
  date: `2026-10-0${day}`,
  startTime: "07:30",
  endTime: "10:00",
  bapel: { name: "Majelis Jemaat" },
});

type Failure = { status: number; error: string; issues?: unknown[] };

const onMockApi = (
  options: {
    save?: Failure;
    remove?: Failure;
    futureSlots?: FutureSlot[];
  } = {},
) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const ddl = url.match(/^\/api\/v1\/ddl\/([a-z-]+)/)?.[1];
    const code = url.match(/^\/api\/v1\/pelayan\/([^/?]+)$/)?.[1];

    if (ddl && DDL[ddl]) {
      return Response.json({ status: 200, message: "OK", data: DDL[ddl] });
    }
    if (method !== "GET") {
      calls.push({
        method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      const failure = method === "DELETE" ? options.remove : options.save;

      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json(
        {
          status: method === "POST" ? 201 : 200,
          message:
            method === "DELETE"
              ? "Berhasil Menghapus Pelayan"
              : method === "POST"
                ? "Berhasil Membuat Pelayan"
                : "Berhasil Memperbarui Pelayan",
          data: { code: code ?? "PLYN_0001-0009" },
          ...(method === "PUT"
            ? { futureSlots: options.futureSlots ?? [] }
            : {}),
        },
        { status: method === "POST" ? 201 : 200 },
      );
    }
    if (code && DETAILS[code]) {
      return Response.json({ status: 200, message: "OK", data: DETAILS[code] });
    }

    return Response.json(
      { status: 404, error: "Pelayan Tidak Ditemukan" },
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
      <ToastHost>
        <DaftarPelayanFormScreen code={code} />
      </ToastHost>
    </QueryClientProvider>,
  );
};

const onRenderLoaded = async (
  code = BETHARI.code,
  granted: MenuAction[] = ["UPDATE"],
) => {
  onRenderForm(["VIEW", ...granted], code);

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Badan pelayanan") as HTMLElement).textContent,
    ).toContain("Majelis Jemaat"),
  );
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const onPick = async (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  const item = await screen.findByRole("option", { name: option });
  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah pelayan")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data pelayan."),
    ).toBeTruthy();
    expect(screen.queryByText("Jenis")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"], BETHARI.code);

    expect(screen.getByText("Tidak bisa mengubah pelayan")).toBeTruthy();
  });

  test("form ubah: Hapus hanya dengan DELETE; form tambah tidak pernah", async () => {
    onMockApi();
    await onRenderLoaded();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoaded(BETHARI.code, ["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();

    cleanup();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("form ubah", () => {
  test("jenis dan jemaat terkunci: teks baca, tanpa pilihan jenis", async () => {
    onMockApi();
    await onRenderLoaded();

    const jenis = screen.getByLabelText("Jenis") as HTMLInputElement;
    const jemaat = screen.getByLabelText("Jemaat") as HTMLInputElement;

    expect(jenis.readOnly).toBe(true);
    expect(jenis.value).toBe("Perorangan");
    expect(jemaat.readOnly).toBe(true);
    expect(jemaat.value).toBe("Bethari Ayu Kusuma · JMT-0002");
    expect(screen.queryByRole("radio", { name: "Kelompok" })).toBeNull();
  });

  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "PLYN_9999-0001");

    await waitFor(() =>
      expect(screen.getByText("Data pelayan tidak ditemukan")).toBeTruthy(),
    );
  });

  test("Simpan → Ya: PUT seluruh baris, sorot baris, kembali ke daftar dengan filter", async () => {
    const listUrl = `${DAFTAR_PELAYAN_LIST_PATH}?bapel=1`;
    window.sessionStorage.setItem(
      `list-return:${DAFTAR_PELAYAN_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoaded();

    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        url: "/api/v1/pelayan/PLYN_0001-0002",
        body: {
          typePelayan: "INDIVIDUAL",
          bapelId: 1,
          jemaatId: 2,
          name: null,
          phone: null,
          members: [],
          rolePelayan: [2, 4],
          isPemusik: true,
          musikSkill: [1],
          status: true,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${DAFTAR_PELAYAN_LIST_PATH}`),
    ).toBe(BETHARI.code);
    expect(
      await screen.findByText("Berhasil Memperbarui Pelayan"),
    ).toBeTruthy();
    expect(screen.queryByText(/masih terjadwal/)).toBeNull();
  });

  test("Aktif → Nonaktif: hint berganti peringatan", async () => {
    onMockApi();
    await onRenderLoaded();

    await onPick("Status", "Nonaktif");

    expect(
      await screen.findByText(
        "Bila masih terjadwal, jadwalnya tetap memuat pelayan ini. Daftar jadwalnya muncul sesudah simpan.",
      ),
    ).toBeTruthy();
  });

  test("nonaktif dengan futureSlots: toast peringatan maks 3 jadwal + 'dan n lainnya'", async () => {
    const calls = onMockApi({
      futureSlots: [slot(4), slot(5), slot(6), slot(7)],
    });
    await onRenderLoaded();

    await onPick("Status", "Nonaktif");
    await onSaveConfirmed();

    await waitFor(() =>
      expect(document.querySelector('[data-type="warning"]')).not.toBeNull(),
    );
    const toast = document.querySelector('[data-type="warning"]')?.textContent;

    expect(toast).toContain("Bethari Ayu Kusuma masih terjadwal di 4 jadwal");
    expect(toast).toContain("4 Okt 2026 · Pelayan Ibadah 4");
    expect(toast).toContain("6 Okt 2026 · Pelayan Ibadah 6");
    expect(toast).not.toContain("Pelayan Ibadah 7");
    expect(toast).toContain("dan 1 lainnya");
    expect(toast).toContain("Ganti petugasnya di Jadwal Pelayan.");
    expect(toast).not.toContain("Berhasil Memperbarui Pelayan");
    expect(calls[0].body).toMatchObject({ status: false });
    expect(replaced).toHaveLength(1);
  });

  test("pindah ke bapel tempat jemaat sudah terdaftar: galat di badan pelayanan", async () => {
    onMockApi({
      save: {
        status: 400,
        error:
          "Jemaat Tersebut Sudah Terdaftar Sebagai Pelayan di Komisi Pemuda",
      },
    });
    await onRenderLoaded();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("bapelId"));
    expect(
      screen.getByText(
        "Jemaat ini sudah terdaftar sebagai pelayan di Komisi Pemuda. Pilih badan pelayanan lain.",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("simpan 500: FormAlert, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoaded();

    await onSaveConfirmed();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("hapus yang masih terjadwal (400): pesan be-sada di FormAlert", async () => {
    const message =
      "Pelayan Tidak Dapat Dihapus Karena Masih Terjadwal pada 4 Oktober 2026. Nonaktifkan Pelayan Ini Jika Tidak Ingin Dipakai Lagi";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoaded(BETHARI.code, ["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByText("Pelayan belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("hapus berhasil: DELETE lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoaded(BETHARI.code, ["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([DAFTAR_PELAYAN_LIST_PATH]));
    expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
  });
});

describe("anggota kelompok", () => {
  test("ubah memuat anggota dari memberList; hapus mengumumkan dan memindah fokus", async () => {
    onMockApi();
    await onRenderLoaded(EFRATA.code);

    expect(screen.getByText("2 anggota")).toBeTruthy();
    expect(
      (screen.getByLabelText("Nama kelompok") as HTMLInputElement).value,
    ).toBe("Paduan Suara Efrata");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hapus Immanuel Saragih dari anggota",
      }),
    );

    expect(screen.getByText("Immanuel Saragih dihapus")).toBeTruthy();
    expect(screen.getByText("1 anggota")).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toBe(
        "Hapus Josephine Tanuwijaya dari anggota",
      ),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hapus Josephine Tanuwijaya dari anggota",
      }),
    );
    await waitFor(() => expect(document.activeElement?.id).toBe("members"));
  });

  test("tambah: memilih jemaat menambah ke daftar; anggota tidak ditawarkan lagi", async () => {
    onMockApi();
    await onRenderLoaded(EFRATA.code);

    const input = screen.getByLabelText("Tambah anggota");
    fireEvent.focus(input);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Buka pilihan" }).at(-1)!,
    );

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Hanna Simorangkir",
    ]);

    fireEvent.click(options[0]);

    expect(screen.getByText("Hanna Simorangkir ditambahkan")).toBeTruthy();
    expect(screen.getByText("3 anggota")).toBeTruthy();
  });

  test("tanpa anggota: Simpan ditolak di field anggota", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("radio", { name: "Kelompok" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Tambahkan minimal satu anggota."),
    ).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});

describe("form tambah", () => {
  test("ganti jenis mengosongkan field jenis lain dan tugas", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("radio", { name: "Kelompok" }));
    fireEvent.change(screen.getByLabelText("Nama kelompok"), {
      target: { value: "Band Remaja" },
    });
    fireEvent.change(screen.getByLabelText("No. HP kontak"), {
      target: { value: "0812-3456" },
    });
    expect(
      (screen.getByLabelText("No. HP kontak") as HTMLInputElement).value,
    ).toBe("08123456");

    fireEvent.click(screen.getByRole("radio", { name: "Perorangan" }));
    fireEvent.click(screen.getByRole("radio", { name: "Kelompok" }));

    expect(
      (screen.getByLabelText("Nama kelompok") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("No. HP kontak") as HTMLInputElement).value,
    ).toBe("");
  });

  test("perorangan kosong: konfirmasi tidak muncul, fokus ke jemaat", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("jemaatId"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});
