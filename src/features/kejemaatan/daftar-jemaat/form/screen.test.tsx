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

describe("kembali ke daftar setelah simpan (test wajib 8)", () => {
  const detail: JemaatDetail = {
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

  test("membawa filter terakhir dan menandai baris yang baru disimpan", async () => {
    const listUrl = `${JEMAAT_LIST_PATH}?status=TIDAK_AKTIF&page=3`;
    window.sessionStorage.setItem(`list-return:${JEMAAT_LIST_PATH}`, listUrl);

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);

      if (url === "/api/v1/jemaat/JMT-0042" && init?.method === "PUT") {
        return Response.json({
          status: 200,
          message: "Tersimpan",
          data: { code: "JMT-0042" },
        });
      }
      if (url === "/api/v1/jemaat/JMT-0042") {
        return Response.json({ status: 200, message: "OK", data: detail });
      }

      return Response.json({
        status: 200,
        message: "OK",
        data: [],
        totalData: 0,
        totalPage: 0,
      });
    }) as typeof fetch;

    onRenderForm(["VIEW", "UPDATE"], "JMT-0042");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Nama lengkap") as HTMLInputElement).value,
      ).toBe("Maria Sitompul"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(
      window.sessionStorage.getItem(`list-focus:${JEMAAT_LIST_PATH}`),
    ).toBe("JMT-0042");
  });
});
