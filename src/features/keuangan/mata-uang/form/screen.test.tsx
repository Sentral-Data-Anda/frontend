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
import type { ReactNode } from "react";

import type { MenuAction } from "@/types/menu";

import type { Currency, Rate } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/mata-uang/baru",
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

const { CurrencyFormScreen } = await import("./screen");
const { RateFormScreen } = await import("./rate-screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const USD: Currency = {
  id: 2,
  publicId: "c-2",
  code: "USD",
  name: "Dolar Amerika",
  symbol: "US$",
  isBase: false,
  latestRate: { rate: "15800", rateDate: "2026-09-27T00:00:00.000Z" },
};

const IDR: Currency = {
  ...USD,
  id: 1,
  code: "IDR",
  name: "Rupiah",
  symbol: "Rp",
  isBase: true,
  latestRate: null,
};

const RATE: Rate = {
  id: 4,
  publicId: "r-4",
  currencyCode: "USD",
  rateDate: "2026-09-27T00:00:00.000Z",
  rate: "15800.500000",
  source: "MANUAL",
  currency: { publicId: "c-2", code: "USD", name: "Dolar Amerika" },
};

type Call = { url: string; method: string; body?: unknown };

const onMockApi = (routes: Record<string, () => Response>) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    return (
      routes[`${method} ${url}`]?.() ??
      Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 })
    );
  }) as typeof fetch;

  return calls;
};

const ok =
  (data: unknown, message = "Berhasil") =>
  () =>
    Response.json({ status: 200, message, data });

const onRender = (granted: MenuAction[], node: ReactNode) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>{node}</Toast.Provider>
    </QueryClientProvider>,
  );
};

const onConfirmSave = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("form mata uang", () => {
  test("tanpa CREATE tidak merender form", () => {
    onRender(["VIEW"], <CurrencyFormScreen />);

    expect(screen.getByText("Tidak bisa menambah mata uang")).toBeTruthy();
    expect(screen.queryByLabelText("Kode")).toBeNull();
  });

  test("kode diketik jadi huruf besar; 409 jatuh ke field kode", async () => {
    const calls = onMockApi({
      "POST /api/v1/mata-uang": () =>
        Response.json(
          {
            status: 409,
            error: "Mata Uang Sudah Tersedia",
            issues: [{ path: "code", message: "Mata Uang Sudah Tersedia" }],
          },
          { status: 409 },
        ),
    });
    onRender(["VIEW", "CREATE"], <CurrencyFormScreen />);

    fireEvent.change(screen.getByLabelText("Kode"), {
      target: { value: "usd" },
    });
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Dolar" },
    });
    fireEvent.change(screen.getByLabelText("Simbol"), {
      target: { value: "$" },
    });
    expect((screen.getByLabelText("Kode") as HTMLInputElement).value).toBe(
      "USD",
    );

    await onConfirmSave();

    expect(
      await screen.findByText("Kode ini sudah dipakai mata uang lain"),
    ).toBeTruthy();
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      code: "USD",
      name: "Dolar",
      symbol: "$",
    });
  });

  test("ubah: kode dikunci dan tetap dikirim; simpan menuju halaman mata uang", async () => {
    const calls = onMockApi({
      "GET /api/v1/mata-uang/USD": ok(USD),
      "PUT /api/v1/mata-uang/USD": ok(USD, "Berhasil Mengubah Mata Uang"),
    });
    onRender(["VIEW", "UPDATE"], <CurrencyFormScreen code="USD" />);

    await waitFor(() =>
      expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
        "Dolar Amerika",
      ),
    );
    expect((screen.getByLabelText("Kode") as HTMLInputElement).disabled).toBe(
      true,
    );

    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Dolar AS" },
    });
    await onConfirmSave();

    await waitFor(() => expect(replaced).toEqual(["/keuangan/mata-uang/USD"]));
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({
      code: "USD",
      name: "Dolar AS",
      symbol: "US$",
    });
  });
});

describe("form kurs", () => {
  test("IDR: keadaan Rupiah tidak punya kurs, tanpa form", async () => {
    onMockApi({ "GET /api/v1/mata-uang/IDR": ok(IDR) });
    onRender(["VIEW", "CREATE"], <RateFormScreen code="IDR" />);

    expect(await screen.findByText("Rupiah tidak punya kurs")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
  });

  test("tambah: kirim MANUAL dengan kode halaman; 409 jatuh ke tanggal kurs", async () => {
    const calls = onMockApi({
      "GET /api/v1/mata-uang/usd": ok(USD),
      "POST /api/v1/mata-uang/kurs": () =>
        Response.json(
          {
            status: 409,
            error: "Kurs Untuk Tanggal Dan Sumber Ini Sudah Ada",
            issues: [
              {
                path: "rateDate",
                message: "Kurs Untuk Tanggal Dan Sumber Ini Sudah Ada",
              },
            ],
          },
          { status: 409 },
        ),
    });
    onRender(["VIEW", "CREATE"], <RateFormScreen code="usd" />);

    await screen.findByText("USD — Dolar Amerika");
    fireEvent.change(screen.getByLabelText("Kurs (Rp per 1 USD)"), {
      target: { value: "15.900,25" },
    });
    await onConfirmSave();

    expect(
      await screen.findByText(
        "Kurs tanggal ini sudah ada. Ubah kurs itu di daftar kurs.",
      ),
    ).toBeTruthy();
    const body = calls.find((call) => call.method === "POST")?.body as Record<
      string,
      string
    >;
    expect(body.currencyCode).toBe("USD");
    expect(body.rate).toBe("15900.25");
    expect(body.source).toBe("MANUAL");
  });

  test("ubah: tanggal baca saja, kurs diisi tanpa nol berlebih", async () => {
    onMockApi({
      "GET /api/v1/mata-uang/USD": ok(USD),
      "GET /api/v1/mata-uang/kurs/4": ok(RATE),
    });
    onRender(["VIEW", "UPDATE"], <RateFormScreen code="USD" id="4" />);

    const rate = screen.getByLabelText(
      "Kurs (Rp per 1 USD)",
    ) as HTMLInputElement;
    await waitFor(() => expect(rate.value).toBe("15.800,5"));
    expect(
      screen.getByText(
        "Tanggal tidak bisa diubah. Hapus kurs ini lalu tambah yang baru bila tanggalnya salah.",
      ),
    ).toBeTruthy();
    expect(
      (document.getElementById("rateDate") as HTMLInputElement).disabled,
    ).toBe(true);
  });

  test("tanpa UPDATE: ubah kurs tidak merender form", () => {
    onRender(["VIEW", "CREATE"], <RateFormScreen code="USD" id="4" />);

    expect(screen.getByText("Tidak bisa mengubah kurs")).toBeTruthy();
  });
});
