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

import { setelanPersetujuanMock } from "../../../../../scripts/mock/handlers/setelan-persetujuan";
import { ddlRows } from "../../../../../scripts/mock-dashboard";
import { SETELAN_LIST_PATH } from "../model";
import type { SetelanItem, SetelanPayload } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/persetujuan/setelan-persetujuan/baru",
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

const { SetelanFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const KAS_KECIL = "00000000-0000-4000-8000-000000000001";
const KAS_BESAR = "00000000-0000-4000-8000-000000000002";
const KAS_LAMA = "00000000-0000-4000-8000-000000000008";

type Planned = { status: number; body: Record<string, unknown> };

const onMockApi = (
  options: { write?: Planned; detail?: Partial<SetelanItem> } = {},
) => {
  const reads: string[] = [];
  const writes: { method: string; body?: SetelanPayload }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      writes.push({
        method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const planned = options.write ?? {
        status: 200,
        body: {
          status: 200,
          message: "Berhasil Memperbarui Alur Persetujuan",
          data: { publicId: "saved-id" },
        },
      };

      return Response.json(planned.body, { status: planned.status });
    }

    reads.push(`${path}${url.search}`);

    if (path.startsWith("/ddl/") && path !== "/ddl/jabatan-jemaat") {
      return Response.json({
        status: 200,
        message: "OK",
        data: ddlRows(path.slice(5), url.searchParams),
      });
    }

    const response = await setelanPersetujuanMock({
      request: new Request(url),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    });

    if (options.detail && response?.ok && path !== "/ddl/jabatan-jemaat") {
      const body = await response.json();

      return Response.json({
        ...body,
        data: { ...body.data, ...options.detail },
      });
    }

    return response ?? Response.json({}, { status: 404 });
  }) as typeof fetch;

  return { reads, writes };
};

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <SetelanFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const nameInput = () => screen.getByLabelText("Nama alur") as HTMLInputElement;

const onRenderLoadedEdit = async (
  granted: MenuAction[],
  id: string,
  name: string,
) => {
  onRenderForm(granted, id);
  await waitFor(() => expect(nameInput().value).toBe(name));
};

const onConfirmYes = async (trigger: string) => {
  fireEvent.click(screen.getByRole("button", { name: trigger }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const button = (name: string) =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

describe("gerbang izin", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah alur")).toBeTruthy();
    expect(screen.queryByLabelText("Nama alur")).toBeNull();
  });

  test("ubah tanpa UPDATE: hanya-baca, tanpa Simpan, susun, dan tambah", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW"], KAS_KECIL, "Kas keluar kecil");

    expect(
      screen.getByText("Peran Anda hanya bisa melihat alur ini."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Kembali" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Tambah tahap/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /tahap 1$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).toBeNull();
    expect(nameInput().closest("fieldset")?.disabled).toBe(true);
  });

  test("Nonaktifkan hanya dengan DELETE dan alur aktif", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "DELETE"], KAS_KECIL, "Kas keluar kecil");

    expect(screen.getByRole("button", { name: "Nonaktifkan" })).toBeTruthy();

    cleanup();
    await onRenderLoadedEdit(["VIEW", "DELETE"], KAS_LAMA, "Kas keluar lama");

    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).toBeNull();
  });

  test("404 detail: FormNotFound", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "tidak-ada");

    expect(
      await screen.findByText("Data alur persetujuan tidak ditemukan"),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Nama alur")).toBeNull();
  });
});

describe("tahapan", () => {
  test("form baru mulai satu tahap; hapus mati; tambah sampai 10", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(button("Hapus tahap 1").disabled).toBe(true);
    expect(button("Naikkan tahap 1").disabled).toBe(true);

    for (let count = 1; count < 10; count += 1) {
      fireEvent.click(button("Tambah tahap"));
    }

    await screen.findByText("Tahap 10");
    expect(button("Tambah tahap").disabled).toBe(true);
    expect(screen.getByText("Maksimal 10 tahap.")).toBeTruthy();
    expect(button("Turunkan tahap 10").disabled).toBe(true);

    fireEvent.click(button("Hapus tahap 10"));
    await waitFor(() => expect(screen.queryByText("Tahap 10")).toBeNull());
    expect(button("Tambah tahap").disabled).toBe(false);
  });

  test("turunkan mengubah urutan payload, fokus ikut, diumumkan", async () => {
    const { writes } = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"], KAS_BESAR, "Kas keluar besar");

    fireEvent.click(button("Turunkan tahap 1"));

    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toBe(
        "Naikkan tahap 2",
      ),
    );
    expect(screen.getByText("Tahap 1 dipindah ke posisi 2")).toBeTruthy();

    await onConfirmYes("Simpan");

    await waitFor(() => expect(replaced).toEqual([SETELAN_LIST_PATH]));
    expect(writes[0]?.method).toBe("PUT");
    expect(writes[0]?.body?.tiers).toEqual([
      { roleUserId: 5, roleName: null, bapelId: null },
      { roleUserId: 4, roleName: null, bapelId: null },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${SETELAN_LIST_PATH}`),
    ).toBe("saved-id");
  });
});

describe("nama jabatan", () => {
  test("opsi per BP tahap; ganti BP mengosongkan nama; tanpa buat baru", async () => {
    const { reads } = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByLabelText("Jabatan komisi"));
    await waitFor(() => expect(reads).toContain("/ddl/jabatan-jemaat"));

    const jabatan = screen.getByLabelText("Nama jabatan") as HTMLInputElement;
    fireEvent.focus(jabatan);
    fireEvent.input(jabatan, {
      target: { value: "Jabatan baru" },
      inputType: "insertText",
    });
    await screen.findByText("Tidak ada yang cocok");
    expect(screen.queryByRole("option", { name: /^Tambah/ })).toBeNull();

    fireEvent.input(jabatan, {
      target: { value: "Ket" },
      inputType: "insertText",
    });
    fireEvent.click(await screen.findByRole("option", { name: "Ketua" }));
    await waitFor(() => expect(jabatan.value).toBe("Ketua"));

    fireEvent.click(document.getElementById("tiers.0.bapelId") as HTMLElement);
    const diakonia = await screen.findByRole("option", {
      name: "Komisi Diakonia",
    });
    fireEvent.pointerDown(diakonia);
    fireEvent.click(diakonia);

    await waitFor(() =>
      expect(reads).toContain("/ddl/jabatan-jemaat?bapelId=6"),
    );
    await waitFor(() => expect(jabatan.value).toBe(""));
  });

  test("nilai tersimpan yang tak dipegang siapa pun tetap tampil + hint", async () => {
    onMockApi({
      detail: {
        steps: [
          {
            publicId: "s1",
            order: 1,
            approverRoleUserId: null,
            approverRoleUser: null,
            approverRoleName: "Penatua Senior",
            approverBapelId: 1,
            approverBapel: {
              publicId: "b1",
              code: "BPL-1",
              name: "Majelis Jemaat",
            },
          },
        ],
      },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE"], KAS_KECIL, "Kas keluar kecil");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Nama jabatan") as HTMLInputElement).value,
      ).toBe("Penatua Senior"),
    );
    expect(
      await screen.findByText(
        "Saat ini tidak ada yang memegang jabatan ini; tahap akan menunggu sampai ada.",
      ),
    ).toBeTruthy();
  });
});

describe("simpan gagal", () => {
  test("409 tumpang tindih: galat di Nominal minimal, fokus ke sana", async () => {
    onMockApi({
      write: {
        status: 409,
        body: {
          status: 409,
          error:
            "Sudah ada alur persetujuan aktif untuk jenis dokumen dan bapel ini pada rentang nominal yang bertumpang tindih.",
        },
      },
    });
    await onRenderLoadedEdit(["VIEW", "UPDATE"], KAS_KECIL, "Kas keluar kecil");

    await onConfirmYes("Simpan");

    expect(
      await screen.findByText(
        /Rentang ini bertumpang tindih dengan alur aktif/,
      ),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("minAmount"));
    expect(replaced).toEqual([]);
  });

  test("form kosong: tanpa konfirmasi, fokus ke galat pertama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(button("Simpan"));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.getByText("Isi nama alur.")).toBeTruthy();
    expect(screen.getByText("Pilih role penanda tangan.")).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});

describe("nonaktifkan", () => {
  test("Ya memanggil DELETE lalu kembali ke daftar dengan baris tersorot", async () => {
    const { writes } = onMockApi({
      write: {
        status: 200,
        body: {
          status: 200,
          message: "Berhasil Menonaktifkan Alur Persetujuan",
        },
      },
    });
    await onRenderLoadedEdit(
      ["VIEW", "UPDATE", "DELETE"],
      KAS_KECIL,
      "Kas keluar kecil",
    );

    await onConfirmYes("Nonaktifkan");

    await waitFor(() => expect(replaced).toEqual([SETELAN_LIST_PATH]));
    expect(writes.map((write) => write.method)).toEqual(["DELETE"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${SETELAN_LIST_PATH}`),
    ).toBe(KAS_KECIL);
  });
});
