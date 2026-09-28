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

import { TEMPLATE_JADWAL_LIST_PATH } from "../model";
import type { TemplateJadwalDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pelayanan/template-jadwal/baru",
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

const { TemplateJadwalFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const CODE = "TMP_JDL_0002-0001";

const DETAIL: TemplateJadwalDetail = {
  id: 2,
  publicId: "template-jadwal-2",
  code: CODE,
  name: "Ibadah Pemuda",
  startTime: "17:00",
  endTime: "19:00",
  bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
  detail: [
    { order: 3, rolePelayanId: 5 },
    { order: 1, rolePelayanId: 3 },
    { order: 2, rolePelayanId: 2 },
  ],
};

const BAPEL = [
  { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
];

const ROLES = [
  { id: 1, code: "", name: "Liturgis" },
  { id: 5, code: "", name: "Multimedia" },
  { id: 3, code: "", name: "Pemandu Pujian" },
  { id: 2, code: "", name: "Pemusik" },
];

type Failure = { status: number; error: string; issues?: unknown[] };

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/ddl/bapel") {
      return Response.json({ status: 200, message: "OK", data: BAPEL });
    }
    if (url === "/api/v1/ddl/role-pelayan") {
      return Response.json({ status: 200, message: "OK", data: ROLES });
    }
    if (method !== "GET") {
      calls.push({
        method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      const rejected = method === "DELETE" ? failure.remove : failure.save;
      if (rejected) return Response.json(rejected, { status: rejected.status });

      return Response.json(
        {
          status: method === "POST" ? 201 : 200,
          message: "Berhasil",
          data: { code: method === "POST" ? "TMP_JDL_0001-0003" : CODE },
        },
        { status: method === "POST" ? 201 : 200 },
      );
    }
    if (url === `/api/v1/template-pelayan/${CODE}`) {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Template Jadwal Tidak Ditemukan" },
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
        <TemplateJadwalFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onPick = async (id: string, label: string) => {
  fireEvent.click(document.getElementById(id) as HTMLElement);
  const option = await screen.findByRole("option", { name: label });
  fireEvent.pointerDown(option);
  fireEvent.click(option);
  await waitFor(() =>
    expect(document.getElementById(id)?.textContent).toContain(label),
  );
};

const onType = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const roleLabels = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[id^="slots."][id$=".roleId"]'),
  ).map((trigger) => trigger.textContent);

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], CODE);

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Ibadah Pemuda",
    ),
  );
  await waitFor(() =>
    expect(roleLabels()).toEqual(["Pemandu Pujian", "Pemusik", "Multimedia"]),
  );
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa menambah template jadwal"),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data template jadwal."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Template Jadwal" })
        .getAttribute("href"),
    ).toBe(TEMPLATE_JADWAL_LIST_PATH);
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], CODE);

    expect(
      screen.getByText("Tidak bisa mengubah template jadwal"),
    ).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("Hapus hanya di form ubah dengan DELETE", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE"], CODE);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], CODE);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

describe("tambah", () => {
  test("form kosong: konfirmasi tidak muncul, fokus ke nama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.getByText("Pilih tugas.")).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("jam selesai sebelum jam mulai: galat di jam selesai", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    onType("Jam mulai", "10:00");
    onType("Jam selesai", "09:00");
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Jam selesai harus sesudah jam mulai."),
    ).toBeTruthy();
  });

  test("tugas berulang, susun ulang, hapus baris, lalu POST dengan order 1..n", async () => {
    const listUrl = `${TEMPLATE_JADWAL_LIST_PATH}?bapel=1`;
    window.sessionStorage.setItem(
      `list-return:${TEMPLATE_JADWAL_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    onType("Nama", "  Ibadah   Syukur ");
    await onPick("bapelId", "Majelis Jemaat");
    onType("Jam mulai", "07:30");
    onType("Jam selesai", "10:00");
    await onPick("slots.0.roleId", "Liturgis");

    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas" }));
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("slots.1.roleId"),
    );
    await onPick("slots.1.roleId", "Pemusik");
    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas" }));
    await onPick("slots.2.roleId", "Pemusik");
    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas" }));
    await onPick("slots.3.roleId", "Multimedia");

    fireEvent.click(screen.getByRole("button", { name: "Naikkan tugas 4" }));
    await waitFor(() =>
      expect(roleLabels()).toEqual([
        "Liturgis",
        "Pemusik",
        "Multimedia",
        "Pemusik",
      ]),
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Naikkan tugas 3",
    );
    expect(screen.getByText("Tugas 4 dipindah ke posisi 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hapus tugas 2" }));
    await waitFor(() =>
      expect(roleLabels()).toEqual(["Liturgis", "Multimedia", "Pemusik"]),
    );
    expect(screen.getByText("Tugas 2 dihapus")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan data template jadwal ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "POST",
        body: {
          bapelId: 1,
          name: "Ibadah Syukur",
          startTime: "07:30",
          endTime: "10:00",
          detail: [
            { order: 1, rolePelayanId: 1 },
            { order: 2, rolePelayanId: 5 },
            { order: 3, rolePelayanId: 2 },
          ],
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${TEMPLATE_JADWAL_LIST_PATH}`),
    ).toBe("TMP_JDL_0001-0003");
  });
});

describe("ubah", () => {
  test("detail tak berurutan tampil berurutan; PUT mengirim urutan itu", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(
      await screen.findByText(
        "Apakah Anda ingin menyimpan perubahan data template jadwal ini?",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([TEMPLATE_JADWAL_LIST_PATH]));
    expect(calls[0]).toEqual({
      method: "PUT",
      body: {
        bapelId: 2,
        name: "Ibadah Pemuda",
        startTime: "17:00",
        endTime: "19:00",
        detail: [
          { order: 1, rolePelayanId: 3 },
          { order: 2, rolePelayanId: 2 },
          { order: 3, rolePelayanId: 5 },
        ],
      },
    });
  });

  test("409 nama ganda: galat di nama, fokus ke nama, tetap di form", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Nama Template Sudah Tersedia",
        issues: [{ path: "name", message: "Nama Template Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Template dengan nama ini sudah ada. Pakai nama lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("role terhapus di detail.N: galat di baris tugas itu", async () => {
    onMockApi({
      save: {
        status: 404,
        error: "Role Pelayan Tidak Ditemukan",
        issues: [
          {
            path: "detail.1.rolePelayanId",
            message: "Role Pelayan Tidak Ditemukan",
          },
        ],
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("slots.1.roleId"),
    );
    expect(
      screen.getByText("Tugas ini sudah dihapus. Pilih tugas lain."),
    ).toBeTruthy();
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

  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "TMP_JDL_0009-0009");

    await waitFor(() =>
      expect(
        screen.getByText("Data template jadwal tidak ditemukan"),
      ).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("Hapus → Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText(
        "Apakah Anda ingin menghapus data template jadwal ini?",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([TEMPLATE_JADWAL_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE", body: undefined }]);
  });
});
