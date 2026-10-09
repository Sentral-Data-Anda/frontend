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

import { PENYUSUTAN_LIST_PATH, periodOptions } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/fixed-asset/depreciation/baru",
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

const { PenyusutanFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const [CURRENT, PREVIOUS] = periodOptions();

const toPeriod = (value: string) => ({
  year: Number(value.slice(0, 4)),
  month: Number(value.slice(5, 7)),
});

type Failure = { status: number; error: string; issues?: unknown[] };

const onMockApi = (options: { isEmpty?: boolean; failure?: Failure } = {}) => {
  const posted: unknown[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (init?.method === "POST") {
      posted.push(JSON.parse(String(init.body)));

      if (options.failure) {
        return Response.json(options.failure, {
          status: options.failure.status,
        });
      }

      return Response.json(
        {
          status: 201,
          message: "Berhasil Membuka Penyusutan",
          data: { code: "PNY-2026-0009" },
        },
        { status: 201 },
      );
    }
    if (url === "/api/v1/penyusutan?page=1&limit=1" && !options.isEmpty) {
      return Response.json({
        status: 200,
        message: "OK",
        totalData: 1,
        totalPage: 1,
        data: [{ code: "PNY-2026-0008", ...toPeriod(PREVIOUS.value) }],
      });
    }

    return Response.json(
      { status: 404, error: "Penyusutan Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return posted;
};

const onRenderForm = (granted: MenuAction[]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PenyusutanFormScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onSaveConfirmed = async () => {
  await screen.findByText(CURRENT.label);
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("buka periode", () => {
  test("tanpa CREATE: NoFormAccess, tanpa permintaan", () => {
    const posted = onMockApi();
    onRenderForm(["VIEW"]);

    expect(
      screen.getByText("Tidak bisa membuka periode penyusutan"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Penyusutan" })
        .getAttribute("href"),
    ).toBe(PENYUSUTAN_LIST_PATH);
    expect(posted).toEqual([]);
  });

  test("bawaan bulan sesudah periode terbaru; payload { year, month }; kembali dengan sorot", async () => {
    const posted = onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([PENYUSUTAN_LIST_PATH]));
    expect(posted).toEqual([toPeriod(CURRENT.value)]);
    expect(
      window.sessionStorage.getItem(`list-focus:${PENYUSUTAN_LIST_PATH}`),
    ).toBe("PNY-2026-0009");
  });

  test("daftar kosong: bawaan bulan berjalan", async () => {
    const posted = onMockApi({ isEmpty: true });
    onRenderForm(["VIEW", "CREATE"]);

    await onSaveConfirmed();

    await waitFor(() => expect(posted).toEqual([toPeriod(CURRENT.value)]));
  });

  test("400 urutan dari server: galat di field Periode", async () => {
    const message = "Posting Penyusutan Agustus 2026 Terlebih Dahulu";
    onMockApi({
      failure: {
        status: 400,
        error: message,
        issues: [{ path: "month", message }],
      },
    });
    onRenderForm(["VIEW", "CREATE"]);

    await onSaveConfirmed();

    await waitFor(() => expect(document.activeElement?.id).toBe("period"));
    expect(screen.getByText(message)).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("409 periode sudah ada: galat di field Periode", async () => {
    onMockApi({
      failure: { status: 409, error: "Penyusutan Untuk Periode Ini Sudah Ada" },
    });
    onRenderForm(["VIEW", "CREATE"]);

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Penyusutan Untuk Periode Ini Sudah Ada"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeNull();
  });
});
