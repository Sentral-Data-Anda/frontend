import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { kegiatanMock } from "../../../../../scripts/mock/handlers/kegiatan";
import { pendaftaranEventMock } from "../../../../../scripts/mock/handlers/pendaftaran-event";
import { REGISTRATION } from "../../../../../scripts/mock/kegiatan-store";
import { DDL_JEMAAT } from "../../../../../scripts/mock-dashboard";
import { PENDAFTARAN_LIST_PATH } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: new URLSearchParams() };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kegiatan/pendaftaran-event/baru",
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { PendaftaranFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const SNAPSHOT = structuredClone(REGISTRATION);
const posted: unknown[] = [];
const ddlCalls: string[] = [];

beforeEach(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (path === "/ddl/jemaat") {
      return Response.json({ status: 200, message: "OK", data: DDL_JEMAAT });
    }
    if (path === "/ddl/event") ddlCalls.push(url.search);
    if (method === "POST") posted.push(JSON.parse(String(init?.body)));

    const context = {
      request: new Request(url, { method, body: init?.body }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    return ((await pendaftaranEventMock(context)) ??
      (await kegiatanMock(context))) as Response;
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  REGISTRATION.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  window.sessionStorage.clear();
  delete process.env.MOCK_PENDAFTARAN_FULL;
  search.current = new URLSearchParams();
  replaced.length = 0;
  posted.length = 0;
  ddlCalls.length = 0;
});

const onRenderForm = (granted: MenuAction[], event = "") => {
  actions.current = granted;
  search.current = new URLSearchParams(event ? { event } : {});

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PendaftaranFormScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const ALL: MenuAction[] = ["VIEW", "CREATE", "DELETE"];

const onEventReady = (name: string) =>
  waitFor(() => expect(screen.getByLabelText("Event").textContent).toBe(name));

const onPickJemaat = async (name: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Buka pilihan" }));
  const item = await screen.findByRole("option", { name });
  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("daftarkan peserta", () => {
  test("tanpa CREATE: tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa mendaftarkan peserta")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Pendaftaran Event" })
        .getAttribute("href"),
    ).toBe(PENDAFTARAN_LIST_PATH);
    expect(screen.queryByLabelText("Event")).toBeNull();
  });

  test("?event= mengisi awal; jemaat tanpa nama/telepon; gratis → daftar terfilter + sorotan", async () => {
    onRenderForm(ALL, "4");
    await onEventReady("Bazar Natal");

    await onPickJemaat("Bethari Ayu Kusuma");
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(posted).toEqual([{ eventId: 4, jemaatId: 2 }]);
    expect(replaced[0]).toBe(`${PENDAFTARAN_LIST_PATH}?event=4`);
    expect(
      window.sessionStorage.getItem(`list-focus:${PENDAFTARAN_LIST_PATH}`),
    ).toBe("REG-2026-0015");
  });

  test("jemaat tanpa telepon: field Telepon muncul, kirim ulang membawanya", async () => {
    onRenderForm(ALL, "4");
    await onEventReady("Bazar Natal");
    expect(screen.queryByLabelText("Telepon")).toBeNull();

    await onPickJemaat("Josephine Tanuwijaya");
    await onSaveConfirmed();

    expect(
      await screen.findByText(
        "Nomor Telepon Jemaat Belum Tercatat, Mohon Isi Nomor Telepon",
      ),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Telepon"), {
      target: { value: "081255500010" },
    });
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(posted[1]).toEqual({
      eventId: 4,
      jemaatId: 10,
      participantPhone: "081255500010",
    });
  });

  test("jemaat ganda → galat di field Jemaat", async () => {
    onRenderForm(ALL, "4");
    await onEventReady("Bazar Natal");

    await onPickJemaat("Immanuel Saragih");
    await onSaveConfirmed();

    expect(
      await screen.findByText("Jemaat ini sudah terdaftar pada event tersebut"),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("kursi habis saat menyimpan → FormAlert dan pilihan event dimuat ulang", async () => {
    process.env.MOCK_PENDAFTARAN_FULL = "1";
    onRenderForm(ALL, "4");
    await onEventReady("Bazar Natal");
    const before = ddlCalls.length;

    await onPickJemaat("Bethari Ayu Kusuma");
    await onSaveConfirmed();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Kuota Event Ini Sudah Penuh (200 peserta)"),
    ).toBeTruthy();
    await waitFor(() => expect(ddlCalls.length).toBeGreaterThan(before));
  });

  test("event berbayar → halaman baca pendaftaran baru", async () => {
    onRenderForm(ALL, "2");
    await onEventReady("Retret Pemuda");
    expect(
      screen.getByText(
        "Event berbayar: peserta menerima tautan tagihan Rp 350.000 sesudah didaftarkan.",
      ),
    ).toBeTruthy();

    await onPickJemaat("Eleazar Panggabean");
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(replaced[0]).toBe(`${PENDAFTARAN_LIST_PATH}/REG-2026-0015`);
  });

  test("tamu: nama dan telepon diketik, jemaatId null", async () => {
    onRenderForm(ALL, "4");
    await onEventReady("Bazar Natal");

    fireEvent.click(screen.getByLabelText("Tamu"));
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Ruth Pardede" },
    });
    fireEvent.change(screen.getByLabelText("Telepon"), {
      target: { value: "082166554433" },
    });
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(posted).toEqual([
      {
        eventId: 4,
        jemaatId: null,
        participantName: "Ruth Pardede",
        participantPhone: "082166554433",
        participantEmail: null,
      },
    ]);
  });
});
