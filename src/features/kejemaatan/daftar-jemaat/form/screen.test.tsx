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

import { JEMAAT_LIST_PATH } from "../model";
import type { JemaatDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/daftar-jemaat/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
  }),
}));

const { JemaatFormScreen } = await import("./screen");

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
        <JemaatFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "JMT-0042");

    expect(screen.getByText("Tidak bisa mengubah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("dengan CREATE: form tambah dirender", () => {
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });

  test("dengan UPDATE: form ubah dirender", () => {
    onRenderForm(["VIEW", "UPDATE"], "JMT-0042");

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });
});

const DETAIL: JemaatDetail = {
  code: "JMT-0042",
  name: "Maria Sitompul",
  gender: "P",
  birthPlace: "Bandung",
  birthDate: "1990-05-12T00:00:00.000Z",
  email: null,
  phone: null,
  bloodType: null,
  lastEducation: null,
  statusMarital: null,
  professionId: null,
  ethnicGroupId: null,
  zoneChurchId: null,
  codeInduk: null,
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Merdeka 10",
  typeJemaat: "SIMPATISAN",
  statusJemaat: "AKTIF",
  keluargaId: null,
  roleInFamily: null,
  keluargaAsalId: null,
  joinedAt: null,
  additional: [],
};

const onMockApi = (saveFailure?: { status: number; error: string }) => {
  const saves: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/v1/jemaat/JMT-0042" && init?.method === "PUT") {
      saves.push(url);

      if (saveFailure) {
        return Response.json(saveFailure, { status: saveFailure.status });
      }

      return Response.json({
        status: 200,
        message: "Tersimpan",
        data: { code: "JMT-0042" },
      });
    }
    if (url === "/api/v1/jemaat/JMT-0042") {
      return Response.json({ status: 200, message: "OK", data: DETAIL });
    }

    return Response.json({
      status: 200,
      message: "OK",
      data: [],
      totalData: 0,
      totalPage: 0,
    });
  }) as typeof fetch;

  return saves;
};

const onRenderLoadedEdit = async () => {
  onRenderForm(["VIEW", "UPDATE"], "JMT-0042");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama lengkap") as HTMLInputElement).value,
    ).toBe("Maria Sitompul"),
  );
};

describe("konfirmasi sebelum simpan", () => {
  test("Simpan membuka konfirmasi; Tidak menutupnya tanpa memanggil API", async () => {
    const saves = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data jemaat ini?",
        ),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Konfirmasi Tindakan")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tidak" }));

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(
      screen.queryByText(
        "Apakah Anda ingin menyimpan perubahan data jemaat ini?",
      ),
    ).toBeNull();
    expect(saves).toEqual([]);
    expect(replaced).toEqual([]);
  });

  test("form tidak valid: konfirmasi tidak muncul, fokus ke field galat pertama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});

describe("fokus sesudah simpan ditolak server", () => {
  test("pesan yang dikenal: fokus ke field-nya", async () => {
    onMockApi({ status: 400, error: "Email Sudah Tersedia" });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("email"));
  });

  test("galat tanpa field: fokus ke Simpan, bukan body", async () => {
    onMockApi({ status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
  });
});

describe("kembali ke daftar setelah simpan (test wajib 8)", () => {
  test("membawa filter terakhir dan menandai baris yang baru disimpan", async () => {
    const listUrl = `${JEMAAT_LIST_PATH}?status=TIDAK_AKTIF&page=3`;
    window.sessionStorage.setItem(`list-return:${JEMAAT_LIST_PATH}`, listUrl);
    const saves = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(saves).toHaveLength(1);
    expect(
      window.sessionStorage.getItem(`list-focus:${JEMAAT_LIST_PATH}`),
    ).toBe("JMT-0042");
  });
});
