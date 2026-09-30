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
import type { JournalEntryDetail, JournalLine } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
  usePathname: () => "/keuangan/jurnal/jrn-1",
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

const { JournalDetailScreen } = await import("./screen");

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

const line = (debit: string, credit: string, id: number): JournalLine => ({
  id: `jln-${id}`,
  publicId: `jln-${id}`,
  accountId: id,
  account: { id, code: `1-${id}00`, name: `Akun ${id}`, type: "ASSET" },
  debit,
  credit,
  description: null,
});

const ENTRY: JournalEntryDetail = {
  id: "jrn-1",
  publicId: "jrn-1",
  code: "JRN-2026-0001",
  entryDate: "2026-01-05T00:00:00.000Z",
  description: "Biaya listrik",
  status: "DRAFT",
  sourceType: "MANUAL",
  source: { type: "MANUAL", id: null },
  reversalOfId: null,
  isReversal: false,
  fiscalPeriod: { year: 2026, month: 1, status: "OPEN" },
  postedBy: null,
  postedAt: null,
  reversalOf: null,
  reversedBy: null,
  lines: [line("500000", "0", 2), line("0", "500000", 14)],
};

const onMockApi = (entry: JournalEntryDetail) => {
  globalThis.fetch = (async (input: RequestInfo | URL) =>
    String(input).startsWith("/api/v1/ddl/")
      ? Response.json({ status: 200, totalData: 0, totalPage: 0, data: [] })
      : Response.json({
          status: 200,
          message: "OK",
          data: entry,
        })) as typeof fetch;
};

const onRenderDetail = (
  granted: MenuAction[],
  entry: JournalEntryDetail = ENTRY,
) => {
  actions.current = granted;
  onMockApi(entry);

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JournalDetailScreen publicId="jrn-1" />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onLoaded = async () =>
  waitFor(() => expect(screen.getByText("JRN-2026-0001")).toBeTruthy());

const FULL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

describe("JournalDetailScreen", () => {
  test("draf seimbang bisa diposting", async () => {
    onRenderDetail(FULL);
    await onLoaded();

    expect(
      (screen.getByRole("button", { name: "Posting" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  test("draf tidak seimbang: tombol posting disabled dengan alasannya tertulis", async () => {
    onRenderDetail(FULL, {
      ...ENTRY,
      lines: [line("500000", "0", 2), line("0", "450000", 14)],
    });
    await onLoaded();

    const post = screen.getByRole("button", {
      name: "Posting",
    }) as HTMLButtonElement;

    expect(post.disabled).toBe(true);
    expect(screen.getByText(/Belum bisa diposting/)).toBeTruthy();
    expect(post.getAttribute("aria-describedby")).toBe("posting-blocked");
  });

  test("konfirmasi hapus draf berkata dihapus permanen", async () => {
    onRenderDetail(FULL);
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() =>
      expect(screen.getByText(/dihapus permanen/)).toBeTruthy(),
    );
  });

  test("entri diposting menawarkan Balikkan, bukan Hapus", async () => {
    onRenderDetail(FULL, {
      ...ENTRY,
      status: "POSTED",
      postedBy: { name: "Bendahara" },
      postedAt: "2026-01-06T02:00:00.000Z",
    });
    await onLoaded();

    expect(screen.getByRole("button", { name: "Balikkan" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Posting" })).toBeNull();
  });

  test("entri pembalik tidak menawarkan Balikkan", async () => {
    onRenderDetail(FULL, {
      ...ENTRY,
      status: "POSTED",
      isReversal: true,
      reversalOfId: 5,
      reversalOf: {
        publicId: "jrn-5",
        code: "JRN-2026-0005",
        entryDate: "2026-01-02T00:00:00.000Z",
      },
    });
    await onLoaded();

    expect(screen.queryByRole("button", { name: "Balikkan" })).toBeNull();
    expect(screen.getByText("Pembalikan dari")).toBeTruthy();
  });

  test("entri yang sudah dibalik menandai pembaliknya dan tidak bisa dibalik lagi", async () => {
    onRenderDetail(FULL, {
      ...ENTRY,
      status: "REVERSED",
      reversedBy: {
        publicId: "jrn-6",
        code: "JRN-2026-0006",
        entryDate: "2026-01-08T00:00:00.000Z",
      },
    });
    await onLoaded();

    expect(screen.getByText("Dibalik oleh")).toBeTruthy();
    expect(screen.getByText("JRN-2026-0006")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Balikkan" })).toBeNull();
  });

  test("dialog balikkan menanyakan tanggal pembalikan sendiri", async () => {
    onRenderDetail(FULL, { ...ENTRY, status: "POSTED" });
    await onLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Balikkan" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Tanggal pembalikan")).toBeTruthy(),
    );
  });

  test("tanpa izin tulis, tidak ada aksi status yang dirender", async () => {
    onRenderDetail(["VIEW"]);
    await onLoaded();

    expect(screen.queryByRole("button", { name: "Posting" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });

  test("tanpa izin lihat, halaman menolak dengan pesan akses", async () => {
    onRenderDetail([]);

    await waitFor(() =>
      expect(
        screen.getByText("Anda tidak memiliki akses ke Jurnal"),
      ).toBeTruthy(),
    );
  });
});
