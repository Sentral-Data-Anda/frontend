import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { KELUARGA_LIST_PATH } from "../model";
import type { Keluarga, KeluargaMember } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/keluarga/create",
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

const { KeluargaFormScreen } = await import("./screen");

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
        <KeluargaFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /create tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah keluarga")).toBeTruthy();
    expect(document.getElementById("zoneChurchId")).toBeNull();
  });

  test("tanpa UPDATE: rute /edit tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "KK-0007");

    expect(screen.getByText("Tidak bisa mengubah keluarga")).toBeTruthy();
    expect(document.getElementById("zoneChurchId")).toBeNull();
  });

  test("form tambah tidak punya Hapus walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(document.getElementById("zoneChurchId")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah tanpa DELETE: tidak ada Hapus", () => {
    onRenderForm(["VIEW", "UPDATE"], "KK-0007");

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

const DETAIL: Keluarga = {
  id: 7,
  publicId: "10000000-0000-4000-8000-000000000007",
  code: "KK-0007",
  name: "Saragih",
  zoneChurchId: null,
  worshipsHere: true,
  zoneChurch: null,
  _count: { members: 0 },
};

const onMockApi = (failure?: {
  method: "PUT" | "DELETE";
  status: number;
  error: string;
}) => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/keluarga/KK-0007" && method !== "GET") {
      calls.push(method);

      if (failure?.method === method) {
        return Response.json(failure, { status: failure.status });
      }

      return Response.json({ status: 200, message: "Beres", data: DETAIL });
    }
    if (url === "/api/v1/keluarga/KK-0007") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({ status: 200, message: "OK", data: [] });
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "KK-0007");

  // The household is labelled by its head, so that label appearing is the
  // signal that the detail has arrived and the form is filled.
  await waitFor(() => expect(screen.getByText("Kel. Saragih")).toBeTruthy());
};

describe("simpan", () => {
  test("tambah tanpa kepala keluarga: konfirmasi tidak muncul", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await screen.findByText("Tentukan tepat satu kepala keluarga.");
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("kembali ke daftar membawa filter dan menandai baris", async () => {
    const listUrl = `${KELUARGA_LIST_PATH}?search=sar&page=2`;
    window.sessionStorage.setItem(`list-return:${KELUARGA_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText(
      "Apakah Anda ingin menyimpan perubahan data keluarga ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual(["PUT"]);
    expect(
      window.sessionStorage.getItem(`list-focus:${KELUARGA_LIST_PATH}`),
    ).toBe("KK-0007");
  });

  test("wilayah ditolak server: galat dan fokus mendarat di field wilayah", async () => {
    onMockApi({
      method: "PUT",
      status: 404,
      error: "Wilayah Gereja Tidak Ditemukan",
    });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await screen.findByText(
      "Wilayah ini sudah tidak ada; pilih ulang dari daftar.",
    );
    expect(
      document.getElementById("zoneChurchId")?.getAttribute("aria-invalid"),
    ).toBe("true");
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("zoneChurchId"),
    );
    expect(replaced).toEqual([]);
  });

  test("galat 500: FormAlert tampil, fokus ke Simpan, tetap di form", async () => {
    onMockApi({ method: "PUT", status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Kesalahan server.")).toBeTruthy();
    expect(
      screen.getByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
    expect(replaced).toEqual([]);
  });
});

describe("hapus", () => {
  test("Hapus bertanya dulu; Ya memanggil DELETE lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    const buttons = screen.getAllByRole("button");
    expect(buttons.at(-3)?.textContent).toBe("Hapus");

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await screen.findByText("Apakah Anda ingin menghapus data keluarga ini?");
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([KELUARGA_LIST_PATH]));
    expect(calls).toEqual(["DELETE"]);
  });

  test("masih punya anggota: pesan be-sada tampil, tetap di form", async () => {
    const error =
      "Keluarga Tidak Dapat Dihapus Karena Masih Memiliki 3 Anggota Aktif";
    onMockApi({ method: "DELETE", status: 400, error });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(await screen.findByText(error)).toBeTruthy();
    expect(screen.getByText("Keluarga belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

const MEMBERS: KeluargaMember[] = [
  {
    id: "m1",
    role: "KEPALA_KELUARGA",
    jemaatCode: "JMT-0001",
    name: "Yosua Saragih",
    gender: "L",
    birthDate: null,
    startedAt: null,
    endedAt: null,
    endReason: null,
    endNote: null,
  },
  {
    id: "m2",
    role: "PASANGAN",
    jemaatCode: "JMT-0002",
    name: "Ruth Saragih",
    gender: "P",
    birthDate: null,
    startedAt: null,
    endedAt: null,
    endReason: null,
    endNote: null,
  },
  {
    id: "m3",
    role: "ANAK",
    jemaatCode: "JMT-0003",
    name: "Samuel Saragih",
    gender: "L",
    birthDate: null,
    startedAt: null,
    endedAt: null,
    endReason: null,
    endNote: null,
  },
  {
    id: "m4",
    role: "ANAK",
    jemaatCode: "JMT-0004",
    name: "Debora Saragih",
    gender: "P",
    birthDate: null,
    startedAt: null,
    endedAt: "2026-01-01T00:00:00.000Z",
    endReason: "MENIKAH",
    endNote: null,
  },
];

const onMockMembers = () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith("/api/v1/keluarga/KK-0007/member") && method === "GET") {
      return Response.json({ status: 200, message: "OK", data: MEMBERS });
    }
    if (url.startsWith("/api/v1/ddl/keluarga")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [
          { id: 3, code: "KK-0003", name: "Budi Siregar", isActive: true },
          { id: 4, code: "KK-0004", name: null, isActive: true },
        ],
      });
    }
    if (url.startsWith("/api/v1/keluarga/KK-0007")) {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({ status: 200, message: "OK", data: [] });
  }) as typeof fetch;
};

const onOpenEnd = async (index: number) => {
  onMockMembers();
  await onRenderLoadedEdit();

  fireEvent.click(screen.getAllByRole("button", { name: "Akhiri" })[index]);

  await screen.findByText(/^Akhiri keanggotaan /);

  return screen.getByRole("alertdialog");
};

const onSubmitEnd = (dialog: HTMLElement) =>
  fireEvent.click(within(dialog).getByRole("button", { name: "Akhiri" }));

const hasText = async (dialog: HTMLElement, text: string) => {
  try {
    await within(dialog).findByText(text);
    return true;
  } catch {
    return false;
  }
};

const onPickOption = (option: HTMLElement) => {
  fireEvent.pointerDown(option);
  fireEvent.mouseDown(option);
  fireEvent.pointerUp(option);
  fireEvent.mouseUp(option);
  fireEvent.click(option);
};

const onPick = async (name: string) => {
  onPickOption(await screen.findByRole("option", { name }));
};

const onSplitCouple = async (dialog: HTMLElement) => {
  fireEvent.click(
    within(dialog).getByRole("combobox", { name: "Alasan berakhir" }),
  );
  await onPick("Cerai hidup");

  fireEvent.click(
    await within(dialog).findByRole("combobox", {
      name: /^Keanggotaan /,
    }),
  );
  await onPick("Ya, tutup keanggotaannya juga");
};

describe("akhiri keanggotaan", () => {
  test("kepala keluar: pengganti wajib, hanya yang tetap ditawarkan", async () => {
    const dialog = await onOpenEnd(0);

    // Dying is the default reason and asks for nobody; leaving does.
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: "Alasan berakhir" }),
    );
    await onPick("Memisahkan diri, mendaftarkan KK sendiri");

    expect(
      Boolean(within(dialog).queryByText("Kepala keluarga pengganti")),
    ).toBe(true);

    onSubmitEnd(dialog);

    expect(
      await hasText(
        dialog,
        "Pilih kepala keluarga pengganti. Keluarga selalu terdaftar atas nama seseorang.",
      ),
    ).toBe(true);
    expect(await hasText(dialog, "Tanggal berakhir wajib diisi.")).toBe(true);

    fireEvent.click(
      within(dialog).getByRole("combobox", {
        name: "Kepala keluarga pengganti",
      }),
    );

    await screen.findByRole("option", { name: /Ruth Saragih/ });

    const offered = screen
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(offered).toContain("Ruth Saragih — Pasangan");
    expect(offered).toContain("Samuel Saragih — Anak");
    expect(offered).not.toContain("Yosua Saragih — Kepala keluarga");
    expect(offered).not.toContain("Debora Saragih — Anak");
  });

  test("anak keluar: tidak ada isian kepala pengganti", async () => {
    const dialog = await onOpenEnd(2);

    expect(
      Boolean(within(dialog).queryByText("Kepala keluarga pengganti")),
    ).toBe(false);
  });

  test("pasangan cerai hidup: pasangan ditanya, anak dibagi, pengganti wajib", async () => {
    const dialog = await onOpenEnd(1);

    await onSplitCouple(dialog);

    expect(Boolean(within(dialog).queryByText("Pembagian anak"))).toBe(true);
    expect(
      Boolean(within(dialog).queryByText("Kepala keluarga pengganti")),
    ).toBe(true);

    onSubmitEnd(dialog);

    expect(
      await hasText(dialog, "Tentukan Samuel Saragih ikut keluarga yang mana."),
    ).toBe(true);
    expect(
      await hasText(
        dialog,
        "Pilih kepala keluarga pengganti. Keluarga selalu terdaftar atas nama seseorang.",
      ),
    ).toBe(true);

    fireEvent.click(
      within(dialog).getByRole("combobox", {
        name: "Kepala keluarga pengganti",
      }),
    );

    await screen.findByRole("option", { name: /Samuel Saragih/ });

    expect(
      screen
        .getAllByRole("option")
        .map((option) => option.textContent)
        .includes("Yosua Saragih — Kepala keluarga"),
    ).toBe(false);
  });

  test("kepala meninggal: pengganti tidak diminta, keluarga boleh tanpa kepala", async () => {
    const dialog = await onOpenEnd(0);

    fireEvent.click(
      within(dialog).getByRole("combobox", { name: "Alasan berakhir" }),
    );
    await onPick("Meninggal");

    expect(
      Boolean(within(dialog).queryByText("Kepala keluarga pengganti")),
    ).toBe(false);

    onSubmitEnd(dialog);

    expect(await hasText(dialog, "Tanggal berakhir wajib diisi.")).toBe(true);
    expect(
      await hasText(
        dialog,
        "Pilih kepala keluarga pengganti. Keluarga selalu terdaftar atas nama seseorang.",
      ),
    ).toBe(false);
  });

  test("anak pindah ke keluarga lain: isian pengganti hilang", async () => {
    const dialog = await onOpenEnd(1);

    await onSplitCouple(dialog);

    fireEvent.click(
      within(dialog).getByRole("combobox", { name: "Samuel Saragih" }),
    );
    const offered = screen
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(offered).toContain("Kel. Budi Siregar");
    expect(offered).toContain("KK-0004 (belum ada kepala keluarga)");

    await onPick("Kel. Budi Siregar");

    expect(
      Boolean(within(dialog).queryByText("Kepala keluarga pengganti")),
    ).toBe(false);
  });
});

describe("peran bawaan baris anggota", () => {
  const roleOf = (index: number) =>
    document.getElementById(`members.${index}.roleInFamily`);

  const onAddRow = () =>
    fireEvent.click(screen.getByRole("button", { name: "Tambah anggota" }));

  const onOfferedRoles = async (index: number) => {
    fireEvent.click(roleOf(index)!);
    await screen.findByRole("option", { name: "Anak" });

    return screen.getAllByRole("option").map((option) => option.textContent);
  };

  test("keluarga baru: baris pertama kepala keluarga, sesudahnya anak", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    onAddRow();
    expect(roleOf(0)?.textContent).toBe("Kepala keluarga");

    onAddRow();
    expect(roleOf(1)?.textContent).toBe("Anak");
  });

  test("kepala sudah dipegang satu baris: baris lain tidak menawarkannya", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    onAddRow();
    onAddRow();

    expect(await onOfferedRoles(1)).toEqual(["Pasangan", "Anak"]);
  });

  test("baris pemegang kepala tetap boleh berganti peran", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    onAddRow();

    expect(await onOfferedRoles(0)).toEqual([
      "Kepala keluarga",
      "Pasangan",
      "Anak",
    ]);
  });

  test("keluarga lama yang sudah punya kepala: baris baru langsung anak", async () => {
    onMockMembers();
    await onRenderLoadedEdit();

    onAddRow();

    expect(roleOf(0)?.textContent).toBe("Anak");
    expect(await onOfferedRoles(0)).toEqual(["Pasangan", "Anak"]);
  });
});
