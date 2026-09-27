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
import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";

import type { Session } from "@/features/auth";
import type { MenuAction, MenuNode } from "@/types/menu";

import { ROLE_USER_LIST_PATH } from "../model";
import type { MenuOption, RoleUserDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const isTable: { current: boolean } = { current: true };
const replaced: string[] = [];

const node = (slug: string, action: MenuAction[]): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action,
  children: [],
});

const ADMIN: Session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: "Administrator", isAdmin: true },
  jemaat: null,
  menu: [],
};

const OPERATOR: Session = {
  ...ADMIN,
  roleUser: { name: "Operator Sistem", isAdmin: false },
  menu: [
    node("ROLE_USER", ["VIEW", "CREATE", "UPDATE", "DELETE"]),
    node("KELUARGA", ["VIEW"]),
  ],
};

const session: { current: Session } = { current: ADMIN };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pengaturan/role-user/baru",
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

const originalMatchMedia = window.matchMedia;

window.matchMedia = ((query: string) => ({
  matches: isTable.current,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
})) as unknown as typeof window.matchMedia;

const { RoleUserFormScreen } = await import("./screen");
const { SessionProvider } = await import("@/features/auth");

const leaf = (slug: string, name: string, list: MenuAction[], order = 1) => ({
  slug,
  name,
  order,
  isGroup: false,
  actions: list,
  children: [],
});

const OPTIONS: MenuOption[] = [
  {
    ...leaf("KEJEMAATAN", "Kejemaatan", []),
    isGroup: true,
    children: [
      leaf(
        "DAFTAR_JEMAAT",
        "Daftar Jemaat",
        ["VIEW", "CREATE", "UPDATE", "DELETE"],
        1,
      ),
      leaf("KELUARGA", "Keluarga", ["VIEW", "CREATE", "UPDATE", "DELETE"], 2),
    ],
  },
  {
    ...leaf("PENGATURAN", "Pengaturan", [], 2),
    isGroup: true,
    children: [
      leaf("ROLE_USER", "Role User", ["VIEW", "CREATE", "UPDATE", "DELETE"]),
    ],
  },
];

const DETAIL: RoleUserDetail = {
  id: 3,
  publicId: "r3",
  name: "Operator Sistem",
  isAdmin: false,
  userCount: 0,
  menuAccess: [
    { action: "VIEW", menu: { slug: "KELUARGA" } },
    { action: "VIEW", menu: { slug: "ROLE_USER" } },
  ],
};

type Failure = { status: number; error: string; issues?: unknown[] };

const originalFetch = globalThis.fetch;

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  session.current = ADMIN;
  isTable.current = true;
});

const onMockApi = (
  failure: { save?: Failure; remove?: Failure } = {},
  detail: RoleUserDetail = DETAIL,
) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/role/menu-options") {
      return Response.json({ status: 200, message: "OK", data: OPTIONS });
    }
    if (method === "POST" || method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menyimpan Role",
        data: { ...detail, id: method === "POST" ? 9 : detail.id },
      });
    }
    if (method === "DELETE") {
      calls.push({ method });

      if (failure.remove) {
        return Response.json(failure.remove, { status: failure.remove.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Role",
        data: detail,
      });
    }
    if (url === `/api/v1/role/${detail.id}`) {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "Role Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SessionProvider session={session.current}>
        <Toast.Provider>
          <RoleUserFormScreen id={id} />
        </Toast.Provider>
      </SessionProvider>
    </QueryClientProvider>,
  );
};

const box = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

const onRenderLoaded = async (granted: MenuAction[], id?: string) => {
  onRenderForm(["VIEW", ...granted], id);

  await waitFor(() =>
    expect(screen.getByLabelText("Semua izin Kejemaatan")).toBeTruthy(),
  );
  if (id) {
    await waitFor(() =>
      expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
        DETAIL.name,
      ),
    );
  }
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE / UPDATE: bukan form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);
    expect(screen.getByText("Tidak bisa menambah role")).toBeTruthy();

    cleanup();
    onRenderForm(["VIEW", "CREATE"], "3");
    expect(screen.getByText("Tidak bisa mengubah role")).toBeTruthy();
  });

  test("Hapus hanya di form ubah dengan DELETE", async () => {
    onMockApi();
    await onRenderLoaded(["CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoaded(["UPDATE"], "3");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoaded(["UPDATE", "DELETE"], "3");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("404 detail: FormNotFound, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "99");

    await waitFor(() =>
      expect(screen.getByText("Data role tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});

describe("matriks", () => {
  test("tabel desktop dan pill HP dari data yang sama", async () => {
    onMockApi();
    await onRenderLoaded(["UPDATE"], "3");

    expect(box("Lihat Keluarga").checked).toBe(true);
    expect(box("Tambah Keluarga").checked).toBe(false);
    expect(screen.getAllByRole("table")).toHaveLength(2);

    cleanup();
    isTable.current = false;
    await onRenderLoaded(["UPDATE"], "3");

    const pills = within(screen.getByRole("group", { name: "Aksi Keluarga" }));
    expect((pills.getByLabelText("Lihat") as HTMLInputElement).checked).toBe(
      true,
    );
    expect((pills.getByLabelText("Tambah") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  test("centang Tambah ikut mencentang Lihat; ringkasan dan tri-state grup", async () => {
    onMockApi();
    await onRenderLoaded(["CREATE"]);

    fireEvent.click(box("Tambah Daftar Jemaat"));

    expect(box("Lihat Daftar Jemaat").checked).toBe(true);
    expect(box("Semua izin Kejemaatan").indeterminate).toBe(true);
    expect(screen.getByText("1 dari 2 menu")).toBeTruthy();

    fireEvent.click(box("Semua izin Kejemaatan"));
    expect(box("Semua izin Kejemaatan").checked).toBe(true);
    expect(box("Hapus Keluarga").checked).toBe(true);
  });

  test("aktor non-admin: aksi yang tidak dipegang disabled, Akses penuh terkunci", async () => {
    session.current = OPERATOR;
    onMockApi();
    await onRenderLoaded(["CREATE"]);

    expect(box("Lihat Keluarga").disabled).toBe(false);
    expect(box("Tambah Keluarga").disabled).toBe(true);
    expect(box("Lihat Daftar Jemaat").disabled).toBe(true);
    expect(box("Tambah Keluarga").closest("label")?.title).toBe(
      "Anda tidak memegang izin ini",
    );
    expect(
      screen.getByText("Hanya administrator yang dapat mengubah akses penuh."),
    ).toBeTruthy();
  });

  test("aktor non-admin: grup tanpa aksi yang bisa diberikan terlipat, tetap bisa dibuka", async () => {
    const detailsOf = (name: string) =>
      screen.getByText(name).closest("details") as HTMLDetailsElement;

    session.current = {
      ...OPERATOR,
      menu: [node("ROLE_USER", ["VIEW", "CREATE", "UPDATE", "DELETE"])],
    };
    onMockApi();

    for (const isWide of [true, false]) {
      cleanup();
      isTable.current = isWide;
      await onRenderLoaded(["CREATE"]);

      expect(detailsOf("Kejemaatan").open).toBe(false);
      expect(detailsOf("Pengaturan").open).toBe(isWide);
    }

    fireEvent.click(detailsOf("Kejemaatan").querySelector("summary")!);
    await waitFor(() => expect(detailsOf("Kejemaatan").open).toBe(true));
  });

  test("role berizin di luar aktor: hanya-baca, tanpa Simpan dan Hapus", async () => {
    session.current = OPERATOR;
    onMockApi(
      {},
      {
        ...DETAIL,
        menuAccess: [{ action: "UPDATE", menu: { slug: "KELUARGA" } }],
      },
    );
    await onRenderLoaded(["UPDATE", "DELETE"], "3");

    expect(
      screen.getByText(
        "Role ini memuat izin yang tidak Anda miliki; hanya administrator yang dapat mengubahnya.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("role milik sendiri: info sesi", async () => {
    session.current = {
      ...ADMIN,
      roleUser: { name: "Operator Sistem", isAdmin: true },
    };
    onMockApi();
    await onRenderLoaded(["UPDATE"], "3");

    expect(screen.getByText(/Anda memakai role ini/)).toBeTruthy();
  });
});

describe("simpan", () => {
  test("tanpa izin: galat di bagian izin, dialog tidak muncul", async () => {
    onMockApi();
    await onRenderLoaded(["CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Tamu Gereja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("access"));
    expect(
      screen.getByText("Pilih minimal satu izin, atau jadikan Akses penuh."),
    ).toBeTruthy();
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT utuh, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${ROLE_USER_LIST_PATH}?search=op`;
    window.sessionStorage.setItem(
      `list-return:${ROLE_USER_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoaded(["UPDATE"], "3");

    fireEvent.click(box("Ubah Keluarga"));
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          name: "Operator Sistem",
          isAdmin: false,
          menuAccess: [
            { slug: "ROLE_USER", actions: ["VIEW"] },
            { slug: "KELUARGA", actions: ["VIEW", "UPDATE"] },
          ],
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${ROLE_USER_LIST_PATH}`),
    ).toBe("3");
  });

  test("issue menuAccess → FormAlert", async () => {
    onMockApi({
      save: {
        status: 400,
        error: "Validasi gagal",
        issues: [
          {
            path: "menuAccess.0.actions",
            message: "Aksi RESET tidak tersedia untuk menu Keluarga",
          },
        ],
      },
    });
    await onRenderLoaded(["UPDATE"], "3");
    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Aksi RESET tidak tersedia untuk menu Keluarga"),
      ).toBeTruthy(),
    );
    expect(document.activeElement?.textContent).toBe("Simpan");
  });

  test("403 → FormAlert pesan server", async () => {
    const message =
      "Anda Tidak Dapat Memberikan Hak Akses Yang Tidak Anda Miliki: KELUARGA UPDATE";
    onMockApi({ save: { status: 403, error: message } });
    await onRenderLoaded(["UPDATE"], "3");
    await onSaveConfirmed();

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(replaced).toEqual([]);
  });

  test("Role Sudah Tersedia → field nama", async () => {
    onMockApi({ save: { status: 404, error: "Role Sudah Tersedia" } });
    await onRenderLoaded(["UPDATE"], "3");
    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.getByText("Nama ini sudah dipakai role lain.")).toBeTruthy();
  });
});

describe("hapus", () => {
  test("masih dipakai: pesan be-sada di FormAlert, fokus ke Hapus", async () => {
    const message =
      "Role Masih Digunakan Oleh 2 Akun. Pindahkan Akun Tersebut Terlebih Dahulu";
    onMockApi({ remove: { status: 400, error: message } });
    await onRenderLoaded(["UPDATE", "DELETE"], "3");

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Hapus"),
    );
    expect(replaced).toEqual([]);
  });
});
