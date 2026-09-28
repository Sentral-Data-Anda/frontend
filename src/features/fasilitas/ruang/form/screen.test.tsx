import { Toast } from "@base-ui/react/toast";
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
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import { RUANG_LIST_PATH } from "../model";
import type { RoomDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/fasilitas/ruang/baru",
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

const { RuangFormScreen } = await import("./screen");

const CODE = "RM-0002";

const DETAIL: RoomDetail = {
  id: 2,
  publicId: "r2",
  code: CODE,
  name: "Aula Serbaguna",
  capacity: 150,
  isActive: true,
  mainImage: {
    publicId: "m2",
    name: "Aula depan",
    mimeType: "image/jpeg",
    size: 1,
    showOnWebsite: false,
    url: "http://media.test/m2.jpeg",
  },
  detailImage: ["Panggung", "Dapur"].map((name, index) => ({
    publicId: `d${index + 1}`,
    name,
    mimeType: "image/jpeg",
    size: 1,
    showOnWebsite: false,
    url: `http://media.test/d${index + 1}.jpeg`,
  })),
};

type Call = { method: string; url: string; body?: FormData };
type Failure = { status: number; error: string; issues?: unknown[] };

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;
let queryClient: QueryClient;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onMockApi = (options: { save?: Failure; remove?: Failure } = {}) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      calls.push({ method, url, body: init?.body as FormData | undefined });
      const failure = method === "DELETE" ? options.remove : options.save;

      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json(
        {
          status: method === "POST" ? 201 : 200,
          message: "Berhasil",
          data: { ...DETAIL, code: method === "POST" ? "RM-0007" : CODE },
        },
        { status: method === "POST" ? 201 : 200 },
      );
    }
    if (url === `/api/v1/room/${CODE}`) {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Ruang Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <RuangFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], CODE);

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    ),
  );
};

const onConfirmSave = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE / UPDATE: bukan form", () => {
    onMockApi();
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah ruang")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data ruang."),
    ).toBeTruthy();

    cleanup();
    onRenderForm(["VIEW", "CREATE"], CODE);
    expect(screen.getByText("Tidak bisa mengubah ruang")).toBeTruthy();
  });

  test("Hapus hanya di form ubah dengan DELETE", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });

  test("404: data ruang tidak ditemukan", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "RM-9999");

    expect(await screen.findByText("Data ruang tidak ditemukan")).toBeTruthy();
  });
});

describe("simpan", () => {
  test("tambah tanpa foto: POST, isActive 1, kembali ke daftar + sorot", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "ruang   doa" },
    });
    fireEvent.change(screen.getByLabelText("Kapasitas (orang)"), {
      target: { value: "2a0" },
    });
    await onConfirmSave();

    await waitFor(() => expect(replaced).toEqual([RUANG_LIST_PATH]));
    const body = calls[0].body!;
    expect(calls[0]).toMatchObject({ method: "POST", url: "/api/v1/room" });
    expect(body.get("name")).toBe("Ruang Doa");
    expect(body.get("capacity")).toBe("20");
    expect(body.get("isActive")).toBe("1");
    expect(body.has("keepFiles")).toBe(false);
    expect(body.has("mainImage")).toBe(false);
    expect(window.sessionStorage.getItem(`list-focus:${RUANG_LIST_PATH}`)).toBe(
      "RM-0007",
    );
  });

  test("ubah: nonaktifkan + lepas satu foto detail → isActive 0, keepFiles sisanya", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("radio", { name: "Nonaktif" }));
    fireEvent.click(screen.getByRole("button", { name: "Hapus Dapur" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText(
      "Apakah Anda ingin menyimpan perubahan data ruang ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([RUANG_LIST_PATH]));
    const body = calls[0].body!;
    expect(calls[0]).toMatchObject({
      method: "PUT",
      url: `/api/v1/room/${CODE}`,
    });
    expect(body.get("isActive")).toBe("0");
    expect(JSON.parse(String(body.get("keepFiles")))).toEqual([
      { publicId: "d1", showOnWebsite: false },
    ]);
    expect(body.has("mainImage")).toBe(false);
    expect(body.has("image")).toBe(false);
  });

  test("nama kembar (409) → galat di field nama, tidak kembali", async () => {
    onMockApi({
      save: {
        status: 409,
        error: "Ruang Sudah Tersedia",
        issues: [{ path: "name", message: "Ruang Sudah Tersedia" }],
      },
    });
    await onRenderLoadedEdit();
    await onConfirmSave();

    expect(
      await screen.findByText(
        "Ruang dengan nama ini sudah ada. Pakai nama lain.",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(replaced).toEqual([]);
  });

  test("galat 500: galat tingkat form, isian tetap", async () => {
    onMockApi({ save: { status: 500, error: "Kesalahan server." } });
    await onRenderLoadedEdit();
    await onConfirmSave();

    await screen.findByText("Data belum tersimpan. Coba simpan lagi.");
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      DETAIL.name,
    );
  });
});

describe("hapus", () => {
  test("masih dipakai: FormAlert menyebut alasan dan menyarankan Nonaktif", async () => {
    const calls = onMockApi({
      remove: {
        status: 400,
        error:
          "Ruang Tidak Dapat Dihapus Karena Masih Memiliki 2 Peminjaman Mendatang",
      },
    });
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText(/Riwayat pemakaiannya tetap tersimpan/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(await screen.findByText("Ruang belum terhapus.")).toBeTruthy();
    expect(
      screen.getByText(
        "Ruang Tidak Dapat Dihapus Karena Masih Memiliki 2 Peminjaman Mendatang. Bila ruang ini tidak dipinjamkan lagi, ubah statusnya menjadi Nonaktif lalu simpan.",
      ),
    ).toBeTruthy();
    expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
    expect(replaced).toEqual([]);
  });

  test("berhasil: kembali ke daftar", async () => {
    onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([RUANG_LIST_PATH]));
  });
});
