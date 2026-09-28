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

import { ROLE_PELAYAN_LIST_PATH } from "../model";
import type { RolePelayan } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pelayanan/role-pelayan/baru",
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

const { RolePelayanFormScreen } = await import("./screen");

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
        <RolePelayanFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah role pelayan")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data role pelayan."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Role Pelayan" })
        .getAttribute("href"),
    ).toBe(ROLE_PELAYAN_LIST_PATH);
    expect(screen.queryByLabelText("Nama tugas")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm(["VIEW", "CREATE"], "7");

    expect(screen.getByText("Tidak bisa mengubah role pelayan")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama tugas")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "7");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "7");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: RolePelayan = { id: 7, name: "Kolektan" };

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

    if (url === "/api/v1/role-pelayan/7" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Role Pelayan",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/role-pelayan/7" && method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Role Pelayan",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/role-pelayan" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Role Pelayan",
          data: { id: 8, name: "Pembaca Warta" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/role-pelayan/7") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Role Pelayan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "7");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama tugas") as HTMLInputElement).value,
    ).toBe("Kolektan"),
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
    expect(screen.getByText("Isi nama tugas, mis. Liturgis.")).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT, kembali ke daftar yang sama dan menyorot barisnya", async () => {
    const listUrl = `${ROLE_PELAYAN_LIST_PATH}?search=kol&page=2`;
    window.sessionStorage.setItem(
      `list-return:${ROLE_PELAYAN_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.change(screen.getByLabelText("Nama tugas"), {
      target: { value: "KOLEKTAN" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data role pelayan ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([{ method: "PUT", body: { name: "KOLEKTAN" } }]);
    expect(
      window.sessionStorage.getItem(`list-focus:${ROLE_PELAYAN_LIST_PATH}`),
    ).toBe("7");
  });

  test("nama ganda (409): galat di field nama", async () => {
    onMockApi({ save: { status: 409, error: "Role Pelayan Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText("Tugas dengan nama ini sudah ada. Pakai nama lain."),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("nama ganda (409 dengan issue name): galat tetap di field nama", async () => {
    const error = "Role Pelayan Sudah Tersedia";
    onMockApi({
      save: { status: 409, error, issues: [{ path: "name", message: error }] },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByLabelText("Nama tugas").getAttribute("aria-invalid"),
    ).toBe("true");
    expect(
      screen.queryByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeNull();
  });

  test("nama ganda lewat 404 be-sada lama: tetap galat di field nama", async () => {
    onMockApi({ save: { status: 404, error: "Role Pelayan Sudah Tersedia" } });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Tugas dengan nama ini sudah ada. Pakai nama lain."),
      ).toBeTruthy(),
    );
    expect(screen.queryByText("Data role pelayan tidak ditemukan")).toBeNull();
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
    expect(
      (screen.getByLabelText("Nama tugas") as HTMLInputElement).value,
    ).toBe("Kolektan");
  });
});

describe("tambah", () => {
  test("Ya mengirim POST bernama normal, kembali ke daftar dan sorot baris baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama tugas"), {
      target: { value: "  pembaca   warta " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menyimpan data role pelayan ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([ROLE_PELAYAN_LIST_PATH]));
    expect(calls).toEqual([
      { method: "POST", body: { name: "Pembaca Warta" } },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${ROLE_PELAYAN_LIST_PATH}`),
    ).toBe("8");
  });
});

describe("id tidak dikenal", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "999");

    await waitFor(() =>
      expect(
        screen.getByText("Data role pelayan tidak ditemukan"),
      ).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama tugas")).toBeNull();
  });
});

describe("hapus", () => {
  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data role pelayan ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([ROLE_PELAYAN_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });

  test("masih dipakai (400): pesan be-sada di FormAlert, tetap di form", async () => {
    const message =
      "Role Pelayan Tidak Dapat Dihapus Karena Masih Digunakan oleh Jadwal Pelayan";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(screen.getByText("Role pelayan belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

describe("role Pemusik (dipakai sistem)", () => {
  const onRenderPemusik = async (granted: MenuAction[]) => {
    globalThis.fetch = (async () =>
      Response.json({
        status: 200,
        message: "OK",
        data: { id: 2, name: "Pemusik" },
      })) as unknown as typeof fetch;
    onRenderForm(["VIEW", ...granted], "2");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Nama tugas") as HTMLInputElement).value,
      ).toBe("Pemusik"),
    );
  };

  test("nama hanya-baca dengan alasannya; tanpa Hapus dan Simpan, hanya Kembali", async () => {
    await onRenderPemusik(["UPDATE", "DELETE"]);

    const name = screen.getByLabelText("Nama tugas") as HTMLInputElement;
    expect(name.readOnly).toBe(true);
    expect(
      screen.getByText(
        "Nama ini dipakai sistem untuk memilih pemain per alat musik di Jadwal Pelayan, jadi tidak bisa diubah.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Batal" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
    expect(replaced).toEqual([ROLE_PELAYAN_LIST_PATH]);
  });

  test("Enter di field tidak membuka konfirmasi simpan", async () => {
    await onRenderPemusik(["UPDATE"]);

    fireEvent.submit(screen.getByLabelText("Nama tugas").closest("form")!);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});
