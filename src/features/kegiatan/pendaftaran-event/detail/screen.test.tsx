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

import { pendaftaranEventMock } from "../../../../../scripts/mock/handlers/pendaftaran-event";
import { REGISTRATION } from "../../../../../scripts/mock/kegiatan-store";
import { PENDAFTARAN_LIST_PATH } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];
const requested: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kegiatan/pendaftaran-event/REG-2026-0001",
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

const { PendaftaranDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const SNAPSHOT = structuredClone(REGISTRATION);

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    requested.push(`${method} ${path}`);

    return (await pendaftaranEventMock({
      request: new Request(url, { method }),
      url,
      path,
      method,
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
  REGISTRATION.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  requested.length = 0;
  replaced.length = 0;
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
});

const onRender = (granted: MenuAction[], code: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PendaftaranDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const ALL: MenuAction[] = ["VIEW", "CREATE", "DELETE"];

const onPanel = (name: string) => screen.findByRole("region", { name });

describe("halaman baca", () => {
  test("menunggu pembayaran: tautan tagihan, Salin tautan ke clipboard, tanpa tombol batal", async () => {
    const copied: string[] = [];

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void copied.push(text) },
      configurable: true,
    });
    onRender(ALL, "REG-2026-0001");

    const payment = await onPanel("Pembayaran");

    expect(payment.textContent).toContain("Menunggu pembayaran");
    expect(payment.textContent).toContain("Rp 350.000");
    expect(
      screen.getByRole("link", { name: "Buka" }).getAttribute("href"),
    ).toBe("https://checkout-staging.xendit.co/web/mock-1");

    fireEvent.click(screen.getByRole("button", { name: "Salin tautan" }));
    await waitFor(() =>
      expect(copied).toEqual(["https://checkout-staging.xendit.co/web/mock-1"]),
    );
    expect(
      screen.getByText(
        "Menunggu pembayaran. Kursi kembali sendiri bila tagihan kedaluwarsa.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Batalkan pendaftaran" }),
    ).toBeNull();
  });

  test("lunas dan kedaluwarsa: tanpa tautan, alasan tanpa tombol", async () => {
    onRender(ALL, "REG-2026-0002");

    expect((await onPanel("Pembayaran")).textContent).toContain("Lunas");
    expect(screen.queryByRole("button", { name: "Salin tautan" })).toBeNull();
    expect(
      screen.getByText("Pengembalian dana ditangani di luar sistem."),
    ).toBeTruthy();

    cleanup();
    onRender(ALL, "REG-2026-0003");

    expect((await onPanel("Pembayaran")).textContent).toContain("Kedaluwarsa");
    expect(screen.getByText("Pendaftaran ini sudah tidak aktif.")).toBeTruthy();
    expect(screen.getByText("yohana@example.com")).toBeTruthy();
  });

  test("gratis terkonfirmasi: batalkan lewat konfirmasi → DELETE dan kembali ke daftar", async () => {
    onRender(ALL, "REG-2026-0008");

    await onPanel("Pendaftaran");
    expect(screen.queryByRole("region", { name: "Pembayaran" })).toBeNull();
    expect(screen.getByText("081210000004")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan pendaftaran" }),
    );
    expect(
      await screen.findByText(
        "Apakah Anda ingin membatalkan pendaftaran ini? Kursinya akan kembali tersedia.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([PENDAFTARAN_LIST_PATH]));
    expect(requested).toContain("DELETE /pendaftaran-event/REG-2026-0008");
  });

  test("tanpa DELETE: aksi batal dan alasannya tidak dirender", async () => {
    onRender(["VIEW"], "REG-2026-0008");

    await onPanel("Pendaftaran");
    expect(screen.queryByRole("region", { name: "Pembatalan" })).toBeNull();
  });

  test("tagihan belum terbit: Buat ulang tagihan (CREATE) menerbitkan tautan", async () => {
    const pending = REGISTRATION.find((row) => row.id === 1);

    if (pending?.payment) pending.payment.invoiceUrl = null;
    onRender(["VIEW"], "REG-2026-0001");

    expect(await screen.findByText("Hubungi administrator.")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Buat ulang tagihan" }),
    ).toBeNull();

    cleanup();
    onRender(ALL, "REG-2026-0001");

    fireEvent.click(
      await screen.findByRole("button", { name: "Buat ulang tagihan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByRole("button", { name: "Salin tautan" }),
    ).toBeTruthy();
    expect(requested).toContain(
      "POST /pendaftaran-event/REG-2026-0001/invoice",
    );
  });

  test("404: tidak ditemukan; tanpa VIEW: tanpa akses dan tanpa memanggil be-sada", async () => {
    onRender(["VIEW"], "REG-2026-9999");
    expect(
      await screen.findByText("Data pendaftaran tidak ditemukan"),
    ).toBeTruthy();

    cleanup();
    requested.length = 0;
    onRender([], "REG-2026-0001");
    expect(
      screen.getByText("Anda tidak memiliki akses ke Pendaftaran Event"),
    ).toBeTruthy();
    expect(requested).toEqual([]);
  });
});
