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

import { MARRIAGE_LIST_PATH } from "../model";
import type { MarriageDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/pernikahan/baru",
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

const { MarriageFormScreen } = await import("./screen");
const { MarriageEndScreen } = await import("./end-screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const ID = "6f1c2a3e-0000-4000-8000-000000000001";

const DETAIL: MarriageDetail = {
  id: ID,
  husband: { jemaatCode: "JMT-0001", name: "Andreas Sitanggang" },
  wife: { jemaatCode: null, name: "Ruth Siregar" },
  marriedAt: "2012-06-16T00:00:00.000Z",
  marriedPlace: "GKI Sada",
  blessedHere: true,
  endedAt: null,
  endReason: null,
  endNote: null,
};

type Call = { method: string; url: string; body: unknown };

const onMockApi = (
  failure?: { status: number; error: string },
  detail: MarriageDetail = DETAIL,
) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.startsWith(`/api/v1/marriage/${ID}`) && method !== "GET") {
      calls.push({
        method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });

      if (failure) return Response.json(failure, { status: failure.status });

      return Response.json({
        status: 200,
        message: "Berhasil",
        data: { publicId: ID },
      });
    }
    if (url === `/api/v1/marriage/${ID}`) {
      return Response.json({ status: 200, message: "OK", data: detail });
    }

    return Response.json(
      { status: 404, error: "Data Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const wrap = (node: React.ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <Toast.Provider>{node}</Toast.Provider>
  </QueryClientProvider>
);

const onRenderForm = (granted: MenuAction[], id?: string) => {
  actions.current = granted;

  return render(wrap(<MarriageFormScreen id={id} />));
};

const onRenderLoadedEdit = async (granted: MenuAction[]) => {
  onRenderForm(granted, ID);

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Tempat", { exact: false }) as HTMLInputElement)
        .value,
    ).toBe("GKI Sada"),
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa mencatat pernikahan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], ID);

    expect(screen.getByText("Tidak bisa mengubah pernikahan")).toBeTruthy();
  });

  test("tambah tidak pernah punya tombol Hapus", () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE", "DELETE"]);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test("ubah tanpa DELETE: tombol Hapus tidak dirender", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("simpan", () => {
  test("form kosong: konfirmasi tidak muncul, fokus ke field suami", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);
    await waitFor(() =>
      expect(
        screen.getAllByPlaceholderText("Cari nama atau kode jemaat"),
      ).toHaveLength(2),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("husbandJemaatCode"),
    );
    expect(screen.getAllByText("Mohon Lengkapi Suami")).toHaveLength(1);
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });

  test("kembali ke daftar membawa filter dan menyorot baris", async () => {
    const listUrl = `${MARRIAGE_LIST_PATH}?status=AKTIF&page=2`;
    window.sessionStorage.setItem(`list-return:${MARRIAGE_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText(
      "Apakah Anda ingin menyimpan perubahan data pernikahan ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        url: `/api/v1/marriage/${ID}`,
        body: {
          husbandJemaatCode: "JMT-0001",
          husbandName: null,
          wifeJemaatCode: null,
          wifeName: "Ruth Siregar",
          marriedAt: "2012-06-16",
          marriedPlace: "GKI Sada",
          blessedHere: true,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${MARRIAGE_LIST_PATH}`),
    ).toBe(ID);
  });

  test("jemaat masih menikah: galat di field sisi yang namanya cocok", async () => {
    onMockApi(
      {
        status: 400,
        error:
          "Bethari Ayu Kusuma Masih Tercatat Dalam Pernikahan Yang Belum Berakhir. Akhiri Pernikahan Tersebut Terlebih Dahulu",
      },
      {
        ...DETAIL,
        wife: { jemaatCode: "JMT-0002", name: "Bethari Ayu Kusuma" },
      },
    );
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("wifeJemaatCode"),
    );
    expect(document.getElementById("husbandJemaatCode-error")).toBeNull();
  });

  test("id tidak dikenal: halaman data tidak ditemukan, bukan form kosong", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "tidak-ada");

    await screen.findByText("Data pernikahan tidak ditemukan");
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
  });
});

describe("hapus", () => {
  test("Hapus → konfirmasi → DELETE, kembali ke daftar", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await screen.findByText("Apakah Anda ingin menghapus data pernikahan ini?");
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([MARRIAGE_LIST_PATH]));
    expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
  });

  test("hapus gagal: galat tampil di form, tetap di layar", async () => {
    onMockApi({ status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit(["VIEW", "UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await screen.findByText("Pernikahan belum terhapus.");
    expect(screen.getByText("Kesalahan server.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});

describe("akhiri pernikahan", () => {
  test("form ubah yang aktif menautkan ke halaman akhiri", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(
      screen
        .getByRole("link", { name: "Akhiri pernikahan" })
        .getAttribute("href"),
    ).toBe(`/kejemaatan/pernikahan/${ID}/akhiri`);
  });

  test("form kotor: Akhiri nonaktif dengan keterangan", async () => {
    onMockApi();
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    fireEvent.change(screen.getByLabelText("Tempat", { exact: false }), {
      target: { value: "GKI Sada, Cimahi" },
    });

    const endButton = await screen.findByRole("button", {
      name: "Akhiri pernikahan",
    });
    expect((endButton as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.queryByRole("link", { name: "Akhiri pernikahan" }),
    ).toBeNull();
    expect(
      screen.getByText(/Simpan atau batalkan perubahan dulu/),
    ).toBeTruthy();
  });

  test("pernikahan yang sudah berakhir tidak menautkan ke akhiri", async () => {
    onMockApi(undefined, { ...DETAIL, endedAt: "2021-11-03T00:00:00.000Z" });
    await onRenderLoadedEdit(["VIEW", "UPDATE"]);

    expect(
      screen.queryByRole("link", { name: "Akhiri pernikahan" }),
    ).toBeNull();
  });

  test("tanpa UPDATE: layar akhiri tidak merender form", () => {
    actions.current = ["VIEW"];
    render(wrap(<MarriageEndScreen id={ID} />));

    expect(screen.getByText("Tidak bisa mengubah pernikahan")).toBeTruthy();
  });

  test("isian belum lengkap: fokus ke tanggal berakhir, tanpa konfirmasi", async () => {
    const calls = onMockApi();
    actions.current = ["VIEW", "UPDATE"];
    render(wrap(<MarriageEndScreen id={ID} />));
    await screen.findByText("Andreas Sitanggang & Ruth Siregar");

    fireEvent.change(screen.getByLabelText("Catatan", { exact: false }), {
      target: { value: "Catatan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("endedAt"));
    expect(screen.queryByText(/mengakhiri pernikahan ini/)).toBeNull();
    expect(calls).toEqual([]);
  });

  test("sudah berakhir: halaman keterangan tanpa form", async () => {
    onMockApi(undefined, { ...DETAIL, endedAt: "2021-11-03T00:00:00.000Z" });
    actions.current = ["VIEW", "UPDATE"];
    render(wrap(<MarriageEndScreen id={ID} />));

    await screen.findByText("Pernikahan ini sudah berakhir");
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Kembali ke Pernikahan" }),
    ).toBeTruthy();
  });

  test("alur sukses: PUT /end, sorot baris, kembali ke daftar", async () => {
    const listUrl = `${MARRIAGE_LIST_PATH}?status=AKTIF`;
    window.sessionStorage.setItem(`list-return:${MARRIAGE_LIST_PATH}`, listUrl);
    const calls = onMockApi();
    actions.current = ["VIEW", "UPDATE"];
    render(wrap(<MarriageEndScreen id={ID} />));
    await screen.findByText("Andreas Sitanggang & Ruth Siregar");

    const date = screen.getByLabelText("Tanggal berakhir");
    fireEvent.change(date, { target: { value: "01/02/2024" } });
    fireEvent.blur(date);
    fireEvent.click(screen.getByLabelText("Alasan"));
    fireEvent.click(await screen.findByRole("option", { name: "Cerai hidup" }));

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await screen.findByText("Apakah Anda ingin mengakhiri pernikahan ini?");
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(calls).toEqual([
      {
        method: "PUT",
        url: `/api/v1/marriage/${ID}/end`,
        body: {
          endedAt: "2024-02-01",
          endReason: "CERAI_HIDUP",
          endNote: null,
        },
      },
    ]);
    expect(
      window.sessionStorage.getItem(`list-focus:${MARRIAGE_LIST_PATH}`),
    ).toBe(ID);
  });
});
