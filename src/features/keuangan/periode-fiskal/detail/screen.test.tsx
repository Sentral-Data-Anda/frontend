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
import type { FiscalPeriodDetail } from "../types";

const access: { current: Record<string, MenuAction[]> } = { current: {} };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/finance/fiscal-period/3",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = access.current[slug] ?? [];

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { PeriodDetailScreen } = await import("./screen");

const OPEN: FiscalPeriodDetail = {
  id: "fp-2026-3",
  year: 2026,
  month: 3,
  label: "Maret 2026",
  status: "OPEN",
  startDate: "2026-03-01T00:00:00.000Z",
  endDate: "2026-03-31T00:00:00.000Z",
  closedBy: null,
  closedAt: null,
  reopenedBy: null,
  reopenedAt: null,
  reopenReason: null,
  draftCount: 0,
  unpostedPersembahanCount: 0,
  unpaidApprovedExpenseCount: 0,
};

const REASON =
  "Koreksi pencatatan kolekte 8 Maret yang tertukar tipe persembahannya, disetujui majelis pada rapat 20 April.";

const REOPENED: FiscalPeriodDetail = {
  ...OPEN,
  reopenedBy: { name: "Bendahara" },
  reopenedAt: "2026-04-20T04:00:00.000Z",
  reopenReason: REASON,
  closedBy: { name: "Bendahara" },
  closedAt: "2026-04-01T09:00:00.000Z",
};

const CLOSED: FiscalPeriodDetail = {
  ...OPEN,
  status: "CLOSED",
  closedBy: { name: "Bendahara" },
  closedAt: "2026-04-01T09:00:00.000Z",
};

const calls: string[] = [];
const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

const onMockApi = (period: FiscalPeriodDetail, failure?: Response) => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      calls.push(`${method} ${String(input)} ${init?.body ?? ""}`.trim());

      if (failure) return failure.clone();

      return Response.json({ status: 200, message: "Berhasil", data: period });
    }

    return Response.json({ status: 200, message: "OK", data: period });
  }) as typeof fetch;
};

beforeAll(() => {
  viewport = onStubViewport(true);
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  calls.length = 0;
});

const onRender = (
  period: FiscalPeriodDetail,
  granted: Record<string, MenuAction[]> = {
    FISCAL_PERIOD: ["VIEW", "UPDATE"],
    JOURNAL_ENTRY: ["VIEW", "CREATE"],
    KAS_KELUAR: ["VIEW"],
  },
  failure?: Response,
) => {
  access.current = granted;
  onMockApi(period, failure);

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PeriodDetailScreen id="3" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onLoaded = () => screen.findByRole("heading", { name: "Maret 2026" });

describe("izin", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender(OPEN, {});

    expect(
      screen.getByText("Anda tidak memiliki akses ke Fiscal Period"),
    ).toBeTruthy();
  });

  test("tanpa UPDATE: tanpa tombol tutup atau buka kembali", async () => {
    onRender(OPEN, { FISCAL_PERIOD: ["VIEW"] });
    await onLoaded();

    expect(screen.queryByRole("button", { name: "Tutup buku" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Buka kembali" })).toBeNull();
  });
});

describe("tutup buku", () => {
  test("konfirmasi menyebut akibatnya, lalu memanggil tutup", async () => {
    onRender(OPEN);
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Tutup buku" }));

    expect(
      await screen.findByText(
        "Apakah Anda ingin menutup buku Maret 2026? Sesudah ditutup, tidak ada entri jurnal yang bisa ditulis ke bulan ini.",
      ),
    ).toBeTruthy();
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(calls).toEqual(["PUT /api/v1/periode-fiskal/3/tutup"]),
    );
  });

  test("draf jurnal: peringatan dan tautan ke jurnal bulan ini", async () => {
    onRender({ ...OPEN, draftCount: 2, unpostedPersembahanCount: 3 });
    await onLoaded();

    expect(
      screen.getByText(/2 entri jurnal bulan ini masih draf/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat draf jurnal" })
        .getAttribute("href"),
    ).toBe("/finance/journal-entry?status=DRAFT&year=2026&month=3");
    expect(
      screen.getByRole("link", { name: "Posting persembahan" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tutup buku" }));

    expect(
      await screen.findByText(
        /Bulan ini masih punya 2 entri draf, 3 persembahan belum diposting\./,
      ),
    ).toBeTruthy();
  });

  test("tanpa izin jurnal: peringatan tetap tampil tanpa tautan", async () => {
    onRender({ ...OPEN, draftCount: 2 }, { FISCAL_PERIOD: ["VIEW", "UPDATE"] });
    await onLoaded();

    expect(
      screen.getByText(/2 entri jurnal bulan ini masih draf/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Lihat draf jurnal" }),
    ).toBeNull();
  });

  test("penolakan berurutan tampil apa adanya dan menautkan tahunnya", async () => {
    onRender(
      OPEN,
      {
        FISCAL_PERIOD: ["VIEW", "UPDATE"],
        JOURNAL_ENTRY: ["VIEW"],
        KAS_KELUAR: ["VIEW"],
      },
      Response.json(
        { status: 400, error: "Tutup Februari 2026 Terlebih Dahulu" },
        { status: 400 },
      ),
    );
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Tutup buku" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Tutup Februari 2026 Terlebih Dahulu"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat periode tahun 2026" })
        .getAttribute("href"),
    ).toBe("/finance/fiscal-period?tahun=2026");
  });
});

describe("buka kembali", () => {
  test("alasan wajib diisi sebelum permintaan dikirim", async () => {
    onRender(CLOSED);
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Buka kembali" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Buka kembali" }),
    );

    expect(await screen.findByText("Alasan wajib diisi")).toBeTruthy();
    expect(calls).toEqual([]);
  });

  test("alasan terisi dikirim ke server", async () => {
    onRender(CLOSED);
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Buka kembali" }));
    await screen.findByText("Buka kembali buku");

    fireEvent.change(screen.getByLabelText("Alasan"), {
      target: { value: " Koreksi kolekte " },
    });
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Buka kembali" })
        .at(-1) as HTMLElement,
    );

    await waitFor(() =>
      expect(calls).toEqual([
        'PUT /api/v1/periode-fiskal/3/buka {"reopenReason":"Koreksi kolekte"}',
      ]),
    );
  });

  test("alasan tersimpan tampil penuh di halaman", async () => {
    onRender(REOPENED);
    await onLoaded();

    expect(screen.getByText(REASON)).toBeTruthy();
    expect(screen.getByText("Alasan dibuka kembali")).toBeTruthy();
  });
});
