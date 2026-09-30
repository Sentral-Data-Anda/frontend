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

import type { Persembahan } from "../types";

const actions: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/keuangan/persembahan/PSB-2026-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = actions.current[slug] ?? [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { PersembahanDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  actions.current = {};
});

const ROW: Persembahan = {
  id: 1,
  publicId: "psb-0001",
  code: "PSB-2026-0001",
  typePersembahan: {
    id: 3,
    code: "TPS-0003",
    name: "Persembahan Bulanan",
    hasPeriod: true,
  },
  jemaat: { id: 4, code: "JMT-0004", name: "Debora Manurung" },
  donorName: null,
  period: "2026-09-01T00:00:00.000Z",
  amount: "1250000",
  receiveMethod: "TUNAI",
  receivedDate: "2026-09-27T00:00:00.000Z",
  receivedBy: { name: "Maria Hutapea" },
  ibadah: { id: 3, code: "IBD-0003", date: "2026-09-27T00:00:00.000Z" },
  status: "ACTIVE",
  voidReason: null,
  voidedAt: null,
  voidedBy: null,
  reversalJournal: null,
  journal: { publicId: "jrn-0002", code: "JRN-2026-0002", status: "POSTED" },
};

type Failure = { status: number; error: string; code?: string };

const onMockApi = (row: Persembahan = ROW, failure?: Failure) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const state = { current: row };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method === "GET") {
      return Response.json({ status: 200, message: "OK", data: state.current });
    }

    calls.push({ method, url, body: JSON.parse(String(init?.body ?? "{}")) });

    if (failure) return Response.json(failure, { status: failure.status });

    state.current = {
      ...state.current,
      status: "VOID",
      voidReason: "Terhitung dua kali.",
      voidedAt: "2026-09-30T04:00:00.000Z",
      voidedBy: { name: "Maria Hutapea" },
      journal: {
        publicId: "jrn-0002",
        code: "JRN-2026-0002",
        status: "REVERSED",
      },
      reversalJournal: {
        publicId: "jrn-0007",
        code: "JRN-2026-0007",
        status: "POSTED",
      },
    };

    return Response.json({
      status: 200,
      message: "Berhasil Membatalkan Persembahan",
      data: state.current,
    });
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: Record<string, MenuAction[]>) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PersembahanDetailScreen code="PSB-2026-0001" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onVoid = async (reason: string) => {
  fireEvent.change(await screen.findByLabelText("Alasan pembatalan"), {
    target: { value: reason },
  });
  fireEvent.click(screen.getByRole("button", { name: "Batalkan persembahan" }));
};

describe("gerbang izin", () => {
  test("tanpa VIEW: keadaan akses, tanpa permintaan", () => {
    const calls = onMockApi();
    onRender({});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Persembahan"),
    ).toBeTruthy();
    expect(calls).toEqual([]);
  });

  test("tanpa DELETE: tombol Batalkan tidak dirender", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(
      (await screen.findAllByText("PSB-2026-0001")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Batalkan persembahan" }),
    ).toBeNull();
    expect(screen.queryByLabelText("Alasan pembatalan")).toBeNull();
  });
});

describe("ringkasan", () => {
  test("diterima oleh dirender sebagai nama, bukan angka", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(await screen.findByText("Maria Hutapea")).toBeTruthy();
  });

  test("periode tampil sebagai bulan; entri jurnal bertaut bila punya akses", async () => {
    onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW"], JURNAL: ["VIEW"] });

    expect(await screen.findByText("September 2026")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /JRN-2026-0002/ }).getAttribute("href"),
    ).toBe("/keuangan/jurnal/jrn-0002");
  });

  test("pemberi anonim tampil Anonim, bukan sel kosong", async () => {
    onMockApi({ ...ROW, jemaat: null, donorName: null });
    onRender({ PERSEMBAHAN: ["VIEW"] });

    expect(await screen.findByText("Anonim")).toBeTruthy();
  });
});

describe("batalkan", () => {
  test("alasan wajib: tanpa alasan tidak ada permintaan", async () => {
    const calls = onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW", "DELETE"] });

    fireEvent.click(
      await screen.findByRole("button", { name: "Batalkan persembahan" }),
    );

    expect(screen.getByText("Tulis alasan pembatalan")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
    expect(calls).toEqual([]);
  });

  test("dengan alasan: konfirmasi menyebut pembalikan, lalu POST /void", async () => {
    const calls = onMockApi();
    onRender({ PERSEMBAHAN: ["VIEW", "DELETE"], JURNAL: ["VIEW"] });

    await onVoid("Terhitung dua kali.");

    expect(
      screen.getByText(/Entri jurnalnya akan dibalik dengan tanggal hari ini/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/v1/persembahan/PSB-2026-0001/void",
      body: { voidReason: "Terhitung dua kali." },
    });

    expect(
      await screen.findByText(/Dibatalkan oleh Maria Hutapea/),
    ).toBeTruthy();
    expect(screen.getByText(/Terhitung dua kali./)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /entri pembalik JRN-2026-0007/ })
        .getAttribute("href"),
    ).toBe("/keuangan/jurnal/jrn-0007");
  });

  test("tanpa JURNAL VIEW: pembatalan terbaca, tanpa tautan pembalik", async () => {
    onMockApi({
      ...ROW,
      status: "VOID",
      voidReason: "Terhitung dua kali.",
      voidedAt: "2026-09-30T04:00:00.000Z",
      voidedBy: { name: "Maria Hutapea" },
      journal: {
        publicId: "jrn-0002",
        code: "JRN-2026-0002",
        status: "REVERSED",
      },
      reversalJournal: {
        publicId: "jrn-0007",
        code: "JRN-2026-0007",
        status: "POSTED",
      },
    });
    onRender({ PERSEMBAHAN: ["VIEW", "DELETE"] });

    expect(
      await screen.findByText(/Entri jurnalnya sudah dibalik/),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /entri pembalik/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Batalkan persembahan" }),
    ).toBeNull();
  });

  test("bulan tertutup: ditolak, persembahan tetap Aktif, tautan periode", async () => {
    onMockApi(ROW, {
      status: 400,
      error: "Periode Fiskal September 2026 Sudah Ditutup",
      code: "PERIOD_CLOSED",
    });
    onRender({ PERSEMBAHAN: ["VIEW", "DELETE"], PERIODE_FISKAL: ["VIEW"] });

    await onVoid("Terhitung dua kali.");
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Periode Fiskal September 2026 Sudah Ditutup"),
    ).toBeTruthy();
    expect(
      screen.getByText("Persembahan belum dibatalkan dan masih Aktif."),
    ).toBeTruthy();
    expect(screen.getByText("Aktif")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat periode fiskal" })
        .getAttribute("href"),
    ).toBe("/keuangan/periode-fiskal");
    expect(
      screen.getByRole("button", { name: "Batalkan persembahan" }),
    ).toBeTruthy();
  });
});
