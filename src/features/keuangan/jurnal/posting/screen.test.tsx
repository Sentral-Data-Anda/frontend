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

import { monthOptions, todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { onStubViewport } from "../../../../../tests/viewport";
import type { PostingResult } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/finance/journal-entry/posting-persembahan",
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

const { PostingPersembahanScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
});

const CLEAN: PostingResult = { posted: 3, skipped: 2, refused: [] };

const REFUSED: PostingResult = {
  posted: 1,
  skipped: 0,
  refused: [
    {
      code: "PSB-202603-001",
      reason: "Tipe Persembahan Khusus Belum Memiliki Akun",
      reasonCode: "OFFERING_TYPE_NO_ACCOUNT",
    },
    {
      code: "PSB-202603-002",
      reason: "Setelan Akuntansi KAS_GATEWAY Belum Diisi",
      reasonCode: "SETTING_EMPTY",
    },
    {
      code: "PSB-202603-003",
      reason: "Alasan baru yang belum dikenal klien",
      reasonCode: "SOMETHING_NEW",
    },
  ],
};

const onMockApi = (result: PostingResult) => {
  const calls: { url: string; body: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith("/api/v1/ddl/")) {
      return Response.json({
        status: 200,
        totalData: 0,
        totalPage: 0,
        data: [],
      });
    }

    const isDryRun = url.includes("dryRun=1");

    calls.push({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    return Response.json(
      {
        status: isDryRun ? 200 : 201,
        message: isDryRun ? "Berhasil Memeriksa" : "Berhasil Memposting",
        data: result,
      },
      { status: isDryRun ? 200 : 201 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderPosting = (
  granted: MenuAction[],
  result: PostingResult = CLEAN,
) => {
  actions.current = granted;

  const calls = onMockApi(result);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PostingPersembahanScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const postButton = () =>
  screen.getByRole("button", { name: "Posting" }) as HTMLButtonElement;

const onPreview = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Lihat pratinjau/ }));
  await waitFor(() => expect(postButton().disabled).toBe(false));
};

const FULL: MenuAction[] = ["VIEW", "CREATE"];

describe("PostingPersembahanScreen", () => {
  test("tombol posting mati sebelum pratinjau dijalankan, dengan alasannya tertulis", () => {
    onRenderPosting(FULL);

    expect(postButton().disabled).toBe(true);
    expect(
      screen.getAllByText(/Jalankan pratinjau dulu/).length,
    ).toBeGreaterThan(0);
  });

  test("pratinjau mengirim dryRun=1 dan tidak menulis apa pun", async () => {
    const calls = onRenderPosting(FULL);

    await onPreview();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("dryRun=1");
  });

  test("tiga angka pratinjau terbaca, dan dilewati bukan galat", async () => {
    onRenderPosting(FULL);
    await onPreview();

    expect(screen.getByText("Akan diposting")).toBeTruthy();
    expect(screen.getByText("Dilewati")).toBeTruthy();
    expect(
      screen.getByText(/sudah pernah diposting — bukan galat/),
    ).toBeTruthy();
    expect(screen.getByText("Ditolak")).toBeTruthy();
    expect(screen.getByText("tidak ada yang ditolak")).toBeTruthy();
  });

  test("mengubah rentang mengosongkan pratinjau dan mematikan posting lagi", async () => {
    onRenderPosting(FULL);
    await onPreview();

    const options = monthOptions();
    const current = options.findIndex(
      (option) => option.value === todayJakarta().slice(0, 7),
    );
    const next = options[current + 1];
    const trigger = screen.getByLabelText("Bulan persembahan");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await screen.findByRole("option", { name: next.label });
    fireEvent.keyDown(document.activeElement ?? trigger, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement ?? trigger, { key: "Enter" });

    await waitFor(() => expect(trigger.textContent).toContain(next.label));
    expect(postButton().disabled).toBe(true);
    expect(screen.queryByText("Akan diposting")).toBeNull();
  });

  test("alasan penolakan dirender dengan tautan perbaikannya, per kode", async () => {
    onRenderPosting(FULL, REFUSED);
    await onPreview();

    const typeLink = screen.getAllByRole("link", {
      name: "Buka Tipe Persembahan",
    })[0];
    const settingLink = screen.getAllByRole("link", {
      name: "Buka Setelan Akuntansi",
    })[0];

    expect(typeLink.getAttribute("href")).toBe("/finance/tipe-persembahan");
    expect(settingLink.getAttribute("href")).toBe(
      "/finance/accounting-setting",
    );
  });

  test("kode yang tidak dikenali menampilkan pesan server tanpa menebak tautan", async () => {
    onRenderPosting(FULL, REFUSED);
    await onPreview();

    expect(
      screen.getAllByText("Alasan baru yang belum dikenal klien").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Buka Akun/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Periode Fiskal/ })).toBeNull();
  });

  test("posting sungguhan berjalan sesudah konfirmasi, lalu pratinjau diminta ulang", async () => {
    const calls = onRenderPosting(FULL);

    await onPreview();
    fireEvent.click(postButton());

    await waitFor(() =>
      expect(screen.getByText(/akan membukukan/)).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls).toHaveLength(2));

    expect(calls[1].url).not.toContain("dryRun");
    await waitFor(() => expect(postButton().disabled).toBe(true));
  });

  test("tanpa izin create jurnal, layar menolak", () => {
    onRenderPosting(["VIEW"]);

    expect(screen.getByText("Tidak bisa memposting persembahan")).toBeTruthy();
  });
});
