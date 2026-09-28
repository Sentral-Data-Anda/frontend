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

import { ibadahLinkedTo } from "../../../../../scripts/mock/handlers/ibadah";
import { jadwalPelayanMock } from "../../../../../scripts/mock/handlers/jadwal-pelayan";
import { JADWAL_PELAYAN } from "../../../../../scripts/mock/pelayanan-store";

const actions: { current: MenuAction[] } = { current: [] };
const requested: string[] = [];

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { JadwalPelayanDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    requested.push(path);

    return (await jadwalPelayanMock({
      request: new Request(url),
      url,
      path,
      method: "GET",
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    })) as Response;
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  requested.length = 0;
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
});

const codeOf = (id: number) =>
  JADWAL_PELAYAN.find((row) => row.id === id)?.code ?? "";

const onRender = (granted: MenuAction[], code: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JadwalPelayanDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("halaman baca", () => {
  test("petugas urut, kelompok, kosong, ibadah yang menaut", async () => {
    onRender(["VIEW"], codeOf(1));

    const panel = await screen.findByRole("region", { name: "Petugas" });
    const rows = panel.querySelectorAll("li");

    expect(rows).toHaveLength(8);
    expect(rows[0].textContent).toContain("LiturgisAndreas Sitanggang");
    expect(rows[4].textContent).toContain("Paduan Suara Efrata");
    expect(rows[4].textContent).toContain("Kelompok");
    expect(rows[7].textContent).toContain("Belum diisi");
    expect(screen.getByText("7 dari 8 terisi")).toBeTruthy();
    for (const ibadah of ibadahLinkedTo(1)) {
      expect(
        screen.getByText(`${ibadah.typeIbadah.name} · ${ibadah.startTime}`),
      ).toBeTruthy();
    }
  });

  test("VIEW saja: tombol WhatsApp ada, Ubah dan Salin tidak", async () => {
    onRender(["VIEW"], codeOf(2));

    await screen.findByRole("region", { name: "Petugas" });
    expect(
      screen.getByRole("button", { name: "Salin untuk WhatsApp" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Salin dari jadwal ini" }),
    ).toBeNull();
    expect(screen.getByText("Belum ditaut ke ibadah")).toBeTruthy();
  });

  test("UPDATE dan CREATE: Ubah dan Salin menaut ke formnya", async () => {
    onRender(["VIEW", "UPDATE", "CREATE"], codeOf(2));

    await screen.findByRole("region", { name: "Petugas" });
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(`/pelayanan/jadwal-pelayan/${codeOf(2)}/ubah`);
    expect(
      screen
        .getByRole("link", { name: "Salin dari jadwal ini" })
        .getAttribute("href"),
    ).toBe(`/pelayanan/jadwal-pelayan/baru?salin=${codeOf(2)}`);
  });

  test("clipboard berhasil: teks tersalin tanpa dialog", async () => {
    const copied: string[] = [];

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void copied.push(text) },
      configurable: true,
    });
    onRender(["VIEW"], codeOf(2));

    fireEvent.click(
      await screen.findByRole("button", { name: "Salin untuk WhatsApp" }),
    );

    await waitFor(() => expect(copied).toHaveLength(1));
    expect(copied[0].split("\n")[0]).toBe("*Pelayan Ibadah Minggu I*");
    expect(screen.queryByLabelText("Teks jadwal untuk WhatsApp")).toBeNull();
  });

  test("404: tidak ditemukan; tanpa VIEW: tanpa akses dan tanpa memanggil be-sada", async () => {
    onRender(["VIEW"], "JDL_9999");
    expect(
      await screen.findByText("Data jadwal pelayan tidak ditemukan"),
    ).toBeTruthy();

    cleanup();
    requested.length = 0;
    onRender([], codeOf(2));
    expect(
      screen.getByText("Anda tidak memiliki akses ke Jadwal Pelayan"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });
});
