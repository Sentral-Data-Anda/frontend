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

import { HARI_LIBUR_LIST_PATH, RECURRING_HINT } from "../model";
import type { Holiday } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/settings/holiday/baru",
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

const { HolidayFormScreen } = await import("./screen");

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
        <HolidayFormScreen id={id} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah hari libur")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "13");

    expect(screen.getByText("Tidak bisa mengubah hari libur")).toBeTruthy();
  });

  test("form tambah tidak punya Hapus, walau memegang DELETE; hint berulang tampil", () => {
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.getByLabelText("Nama")).toBeTruthy();
    expect(screen.getByText(RECURRING_HINT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("form ubah: Hapus hanya dengan DELETE", () => {
    onRenderForm(["VIEW", "UPDATE"], "13");
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRenderForm(["VIEW", "UPDATE", "DELETE"], "13");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
  });
});

const DETAIL: Holiday = {
  id: 13,
  publicId: "a",
  date: "1985-09-27T00:00:00.000Z",
  name: "HUT Gereja",
  type: "GEREJA",
  isRecurring: true,
};

type Failure = { status: number; error: string };

const onMockApi = (failure: { save?: Failure } = {}) => {
  const calls: { method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/v1/hari-libur/13" && method === "PUT") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      if (failure.save) {
        return Response.json(failure.save, { status: failure.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Memperbarui Hari Libur",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/hari-libur/13" && method === "DELETE") {
      calls.push({ method });

      return Response.json({
        status: 200,
        message: "Berhasil Menghapus Hari Libur",
        data: DETAIL,
      });
    }
    if (url === "/api/v1/hari-libur" && method === "POST") {
      calls.push({ method, body: JSON.parse(String(init?.body)) });

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuat Hari Libur",
          data: { ...DETAIL, id: 15, name: "Tahun Baru Imlek" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/hari-libur/13") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json(
      { status: 404, error: "Hari Libur Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderLoadedEdit = async (granted: MenuAction[] = ["UPDATE"]) => {
  onRenderForm(["VIEW", ...granted], "13");

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "HUT Gereja",
    ),
  );
};

describe("simpan", () => {
  test("isian kosong: konfirmasi tidak muncul, fokus ke tanggal", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("date"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("Ya mengirim PUT, kembali ke daftar dengan filter dan sorot", async () => {
    const listUrl = `${HARI_LIBUR_LIST_PATH}?tahun=2026&tipe=GEREJA`;
    window.sessionStorage.setItem(
      `list-return:${HARI_LIBUR_LIST_PATH}`,
      listUrl,
    );
    const calls = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data hari libur ini?",
        ),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        body: {
          date: "1985-09-27",
          name: "HUT Gereja",
          type: "GEREJA",
          isRecurring: true,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${HARI_LIBUR_LIST_PATH}`),
    ).toBe("13");
  });

  test("ganda (409 be-sada): galat di field nama", async () => {
    onMockApi({ save: { status: 409, error: "Hari Libur Sudah Tersedia" } });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(
      screen.getByText(
        "Nama ini sudah dipakai hari libur lain di tanggal yang sama.",
      ),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

describe("tambah", () => {
  test("Ya mengirim POST dengan tanggal ISO dan boolean, lalu sorot baris baru", async () => {
    const calls = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    const date = screen.getByLabelText("Tanggal");
    fireEvent.change(date, { target: { value: "06/02/2027" } });
    fireEvent.blur(date);
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: " Tahun  Baru Imlek " },
    });
    fireEvent.click(screen.getByLabelText("Tipe"));
    fireEvent.click(await screen.findByRole("option", { name: "Nasional" }));

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([HARI_LIBUR_LIST_PATH]));
    expect(calls).toEqual([
      {
        method: "POST",
        body: {
          date: "2027-02-06",
          name: "Tahun Baru Imlek",
          type: "NASIONAL",
          isRecurring: false,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${HARI_LIBUR_LIST_PATH}`),
    ).toBe("15");
  });
});

describe("id tidak dikenal dan hapus", () => {
  test("404 detail: layar tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "999");

    await waitFor(() =>
      expect(screen.getByText("Data hari libur tidak ditemukan")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("Ya menghapus lalu kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(
        screen.getByText("Apakah Anda ingin menghapus data hari libur ini?"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([HARI_LIBUR_LIST_PATH]));
    expect(calls).toEqual([{ method: "DELETE" }]);
  });
});
