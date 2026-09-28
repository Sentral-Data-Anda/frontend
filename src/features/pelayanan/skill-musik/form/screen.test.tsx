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

import { SKILL_MUSIK_LIST_PATH } from "../model";
import type { SkillMusik } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pelayanan/skill-musik/baru",
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

const { SkillMusikFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <SkillMusikFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah alat musik")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data skill musik."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Skill Musik" })
        .getAttribute("href"),
    ).toBe(SKILL_MUSIK_LIST_PATH);
    expect(screen.queryByLabelText("Nama alat")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "5");

    expect(screen.getByText("Tidak bisa mengubah alat musik")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama alat")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "5");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "5");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: SkillMusik = { id: 5, name: "Biola" };

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure; remove?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/musik-skill/5" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Skill Musik",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/musik-skill/5" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Skill Musik",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/musik-skill" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Skill Musik",
          data: { id: 6, name: "Saksofon" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/musik-skill/5") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Skill Musik Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "5");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama alat") as HTMLInputElement).value).toBe(
      "Biola",
    ),
  );
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
    expect(screen.getByText("Isi nama alat musik, mis. Gitar.")).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT, kembali ke daftar yang sama dan menyorot barisnya", async () => {
    const listUrl = `${SKILL_MUSIK_LIST_PATH}?search=bio&page=2`;
    window.sessionStorage.setItem(
      `list-return:${SKILL_MUSIK_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.change(screen.getByLabelText("Nama alat"), {
      target: { value: "BIOLA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data alat musik ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([{ method: "PUT", body: { name: "BIOLA" } }]);
    expect(
      window.sessionStorage.getItem(`list-focus:${SKILL_MUSIK_LIST_PATH}`),
    ).toBe("5");
  });

  test("nama ganda (409): galat di field nama", async () => {
    onMockApi({ save: { status: 409, error: "Skill Musik Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText(
        "Alat musik dengan nama ini sudah ada. Pakai nama lain.",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("nama ganda lewat 404 be-sada lama: tetap galat di field nama", async () => {
    onMockApi({ save: { status: 404, error: "Skill Musik Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText(
          "Alat musik dengan nama ini sudah ada. Pakai nama lain.",
        ),
      ).toBeTruthy(),
    );
    expect(screen.queryByText("Data alat musik tidak ditemukan")).toBeNull();
  });

  test("galat 500: pesan di FormAlert, isian tetap, fokus ke Simpan", async () => {
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
    expect((screen.getByLabelText("Nama alat") as HTMLInputElement).value).toBe(
      "Biola",
    );
  });
});

describe("tambah", () => {
  test("Ya mengirim POST bernama normal, kembali ke daftar dan sorot baris baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama alat"), {
      target: { value: "  saksofon  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menyimpan data alat musik ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([SKILL_MUSIK_LIST_PATH]));
    expect(calls).toEqual([{ method: "POST", body: { name: "Saksofon" } }]);
    expect(
      window.sessionStorage.getItem(`list-focus:${SKILL_MUSIK_LIST_PATH}`),
    ).toBe("6");
  });
});

describe("id tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "999");

    await waitFor(() =>
      expect(screen.getByText("Data alat musik tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama alat")).toBeNull();
  });
});

describe("hapus", () => {
  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data alat musik ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([SKILL_MUSIK_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada di FormAlert, tetap di form", async () => {
    const message =
      "Skill Musik Tidak Dapat Dihapus Karena Masih Digunakan oleh Pelayan";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Alat musik belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
