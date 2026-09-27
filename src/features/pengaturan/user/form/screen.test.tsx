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

import { SessionProvider, type Session } from "@/features/auth";
import type { MenuAction } from "@/types/menu";

import { USER_LIST_PATH } from "../model";
import type { UserDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/pengaturan/user/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
    isCanReset: actions.current.includes("RESET"),
  }),
}));

const { UserFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const LIST_URL = `${USER_LIST_PATH}?status=ACTIVE`;
const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE", "RESET"];

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const sessionOf = (isAdmin: boolean): Session => ({
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: isAdmin ? "Administrator" : "Operator Sistem", isAdmin },
  jemaat: null,
  menu: [],
});

const DETAIL: UserDetail = {
  publicId: "p",
  code: "USR-0007",
  username: "A-0007",
  status: "ACTIVE",
  lastLogin: null,
  roleUser: { id: 3, name: "Operator Sistem", isAdmin: false },
  jemaat: { code: "JMT-0007", name: "Gabriel Tampubolon" },
};

const ADMIN_ROLE = { id: 1, name: "Administrator", isAdmin: true };
const OPERATOR_ONLY = [{ id: 3, name: "Operator Sistem" }];
const CREDENTIAL = {
  code: "USR-0036",
  name: "Andreas Sitanggang",
  username: "A-0001",
  password: "Sada-qv9t97",
};

type Failure = { status: number; error: string };

type Api = {
  detail?: UserDetail;
  assignable?: { id: number; name: string }[];
  failure?: Failure;
};

const onMockApi = (api: Api = {}) => {
  const { detail = DETAIL, assignable = OPERATOR_ONLY, failure } = api;
  const calls: string[] = [];
  const bodies: unknown[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    calls.push(`${method} ${url}`);

    if (method !== "GET") {
      if (init?.body) bodies.push(JSON.parse(String(init.body)));
      if (failure) return Response.json(failure, { status: failure.status });

      const message = url.includes("/reset/")
        ? "Berhasil Memperbarui Data User"
        : method === "DELETE"
          ? "Berhasil Menghapus Data User"
          : "Berhasil";

      return Response.json({ status: 200, message, data: CREDENTIAL });
    }
    if (url.startsWith("/api/v1/ddl/role-user?assignable=1")) {
      return assignable.length === 0
        ? Response.json(
            { status: 404, error: "Data Tidak Ditemukan" },
            { status: 404 },
          )
        : Response.json({ status: 200, message: "OK", data: assignable });
    }
    if (url.startsWith("/api/v1/ddl/jemaat?register=0")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 1, code: "JMT-0001", name: "Andreas Sitanggang" }],
      });
    }
    if (url === `/api/v1/user/${detail.code}`) {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "User Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return { calls, bodies };
};

const onRenderForm = (
  granted: MenuAction[],
  options: { code?: string; isAdmin?: boolean } = {},
) => {
  actions.current = granted;
  window.sessionStorage.setItem(`list-return:${USER_LIST_PATH}`, LIST_URL);

  return render(
    <SessionProvider session={sessionOf(options.isAdmin ?? false)}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Toast.Provider>
          <UserFormScreen code={options.code} />
        </Toast.Provider>
      </QueryClientProvider>
    </SessionProvider>,
  );
};

const onRenderDetail = async (
  granted: MenuAction[],
  isAdmin = false,
  code = DETAIL.code,
) => {
  onRenderForm(granted, { code, isAdmin });
  await screen.findByText("A-0007");
  await waitFor(() =>
    expect(screen.queryByText("Memuat data akun…")).toBeNull(),
  );
};

const onConfirmYes = async (trigger: string) => {
  fireEvent.click(screen.getByRole("button", { name: trigger }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const onFillCreate = async () => {
  await waitFor(() =>
    expect((screen.getByLabelText("Jemaat") as HTMLInputElement).disabled).toBe(
      false,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Buka pilihan" }));
  fireEvent.click(
    await screen.findByRole("option", { name: "Andreas Sitanggang" }),
  );
  fireEvent.click(screen.getByLabelText("Role"));
  fireEvent.click(
    await screen.findByRole("option", { name: "Operator Sistem" }),
  );
};

const isButton = (name: string) =>
  screen.queryByRole("button", { name }) !== null;

describe("tambah akun", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah akun")).toBeTruthy();
    expect(screen.queryByLabelText("Jemaat")).toBeNull();
  });

  test("non-admin dengan CREATE: form tampil, opsi role dari assignable=1", async () => {
    const { calls } = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.getByLabelText("Jemaat")).toBeTruthy();
    await waitFor(() =>
      expect(calls).toContain("GET /api/v1/ddl/role-user?assignable=1"),
    );
  });

  test("tidak ada role assignable: FormAlert dan Simpan nonaktif", async () => {
    onMockApi({ assignable: [] });
    onRenderForm(["VIEW", "CREATE"]);

    const notice = await screen.findByText(
      "Tidak ada role yang boleh Anda berikan.",
    );

    expect(notice.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Simpan" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("simpan: POST, kredensial tampil sekali, Salin, Selesai kembali ke daftar", async () => {
    const writeText = mock(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const { calls, bodies } = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await onFillCreate();
    await onConfirmYes("Simpan");

    expect(await screen.findByText("Akun berhasil dibuat")).toBeTruthy();
    expect(screen.getByText(CREDENTIAL.password)).toBeTruthy();
    expect(bodies).toEqual([{ jemaatId: 1, roleUserId: 3 }]);
    expect(calls).toContain("POST /api/v1/user");
    expect(replaced).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Salin" }));
    await screen.findByRole("button", { name: "Tersalin" });
    expect(writeText).toHaveBeenCalledWith(CREDENTIAL.password);

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));

    await waitFor(() => expect(replaced).toEqual([LIST_URL]));
    expect(screen.queryByText(CREDENTIAL.password)).toBeNull();
    expect(window.sessionStorage.getItem(`list-focus:${USER_LIST_PATH}`)).toBe(
      CREDENTIAL.code,
    );
  });

  test("kode induk kosong: galat di field Jemaat", async () => {
    onMockApi({
      failure: {
        status: 400,
        error:
          "Mohon Lengkapi Kode Induk Jemaat Untuk Keperluan Pendaftaran Akun",
      },
    });
    onRenderForm(["VIEW", "CREATE"]);

    await onFillCreate();
    await onConfirmYes("Simpan");

    expect(
      await screen.findByText(
        "Jemaat ini belum punya kode induk. Lengkapi dulu di Daftar Jemaat.",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("jemaatId"));
  });

  test("403 hak akses: FormAlert dengan pesan server", async () => {
    const error =
      "Anda Tidak Dapat Memberikan Role Dengan Hak Akses Melebihi Milik Anda";
    onMockApi({ failure: { status: 403, error } });
    onRenderForm(["VIEW", "CREATE"]);

    await onFillCreate();
    await onConfirmYes("Simpan");

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(screen.getByText(error)).toBeTruthy();
  });
});

describe("detail akun: gerbang", () => {
  test("akun dapat dikelola: Reset, Nonaktifkan, Simpan tampil", async () => {
    onMockApi();
    await onRenderDetail(ALL);

    expect(isButton("Reset password")).toBe(true);
    expect(isButton("Nonaktifkan")).toBe(true);
    expect(isButton("Simpan")).toBe(true);
    expect(isButton("Aktifkan kembali")).toBe(false);
  });

  test("tanpa RESET/DELETE: aksi akun tidak dirender", async () => {
    onMockApi();
    await onRenderDetail(["VIEW", "UPDATE"]);

    expect(isButton("Reset password")).toBe(false);
    expect(isButton("Nonaktifkan")).toBe(false);
  });

  test("akun di atas hak aktor: role terkunci, tanpa aksi, tanpa Simpan", async () => {
    onMockApi({ detail: { ...DETAIL, roleUser: ADMIN_ROLE } });
    await onRenderDetail(ALL);

    expect(
      screen.getByText(
        "Role akun ini melebihi hak akses Anda; hanya administrator yang dapat mengubahnya.",
      ),
    ).toBeTruthy();
    expect((screen.getByLabelText("Role") as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(isButton("Reset password")).toBe(false);
    expect(isButton("Nonaktifkan")).toBe(false);
    expect(isButton("Simpan")).toBe(false);
    expect(isButton("Kembali")).toBe(true);
  });

  test("akun sendiri: tanpa Reset/Nonaktifkan, dengan petunjuk", async () => {
    onMockApi({ detail: { ...DETAIL, code: "U-0001" } });
    await onRenderDetail(ALL, false, "U-0001");

    expect(
      screen.getByText("Ini akun Anda. Ganti password lewat menu Akun."),
    ).toBeTruthy();
    expect(isButton("Reset password")).toBe(false);
    expect(isButton("Nonaktifkan")).toBe(false);
  });

  test("akun nonaktif: Aktifkan kembali hanya untuk admin", async () => {
    const detail = { ...DETAIL, status: "DEACTIVATED" as const };
    onMockApi({ detail });
    await onRenderDetail(ALL);

    expect(isButton("Aktifkan kembali")).toBe(false);
    expect(
      screen.getByText(
        "Akun ini nonaktif. Hanya administrator yang dapat mengaktifkannya kembali.",
      ),
    ).toBeTruthy();

    cleanup();
    onMockApi({ detail });
    await onRenderDetail(ALL, true);

    expect(isButton("Aktifkan kembali")).toBe(true);
    expect(isButton("Reset password")).toBe(false);
  });

  test("kode tidak dikenal: FormNotFound", async () => {
    onMockApi();
    onRenderForm(ALL, { code: "USR-9999" });

    expect(await screen.findByText("Data akun tidak ditemukan")).toBeTruthy();
    expect(isButton("Nonaktifkan")).toBe(false);
  });
});

describe("detail akun: aksi", () => {
  test("nonaktifkan: konfirmasi, DELETE, kembali ke daftar", async () => {
    const { calls } = onMockApi();
    await onRenderDetail(ALL);

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    expect(
      await screen.findByText(
        "Nonaktifkan akun Gabriel Tampubolon? Pemiliknya tidak bisa masuk lagi dan semua sesinya keluar.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([LIST_URL]));
    expect(calls).toContain("DELETE /api/v1/user/USR-0007");
  });

  test("reset: konfirmasi, PUT reset, dialog kredensial", async () => {
    const { calls } = onMockApi();
    await onRenderDetail(ALL);

    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText(
        "Reset password akun Gabriel Tampubolon? Semua sesi akun ini akan keluar.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Password berhasil direset")).toBeTruthy();
    expect(screen.getByText(CREDENTIAL.password)).toBeTruthy();
    expect(calls).toContain("PUT /api/v1/user/reset/USR-0007");
  });

  test("ubah role: PUT membawa roleUserId", async () => {
    const { bodies } = onMockApi({
      assignable: [...OPERATOR_ONLY, { id: 2, name: "Sekretariat" }],
    });
    await onRenderDetail(ALL);

    fireEvent.click(screen.getByLabelText("Role"));
    const option = await screen.findByRole("option", { name: "Sekretariat" });
    fireEvent.pointerDown(option);
    fireEvent.click(option);
    await onConfirmYes("Simpan");

    await waitFor(() => expect(replaced).toEqual([LIST_URL]));
    expect(bodies).toEqual([{ jemaatId: 0, roleUserId: 2 }]);
  });
});
