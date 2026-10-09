import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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
import type { CashReceiptDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const query: { current: string } = { current: "" };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/finance/kas-masuk/baru",
  useSearchParams: () => new URLSearchParams(query.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { ReceiptFormScreen } = await import("./screen");

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(false);
});
afterAll(() => viewport.onRestore());

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  query.current = "";
  replaced.length = 0;
});

const ACCOUNT_DDL = [
  { id: 2, code: "1-100", name: "Kas", type: "ASSET", isActive: true },
  { id: 4, code: "1-200", name: "Bank BCA", type: "ASSET", isActive: true },
];

const SETTING_FILLED = [
  {
    key: "KAS_GATEWAY",
    account: { id: 6, code: "1-300", name: "Kas di Payment Gateway" },
  },
];

const detail = (next: Partial<CashReceiptDetail> = {}): CashReceiptDetail => ({
  id: 1,
  publicId: "bkm-0001",
  code: "BKM-2026-0001",
  receiptDate: "2026-09-29T00:00:00.000Z",
  description: "Sewa gedung",
  payer: "Keluarga Santoso",
  intoAccountId: 2,
  intoAccount: { id: 2, code: "1-100", name: "Kas" },
  bapel: null,
  method: "Tunai",
  reference: "BA-07/IX/2026",
  totalAmount: "3500000",
  status: "DRAFT",
  lines: [
    {
      publicId: "bkml-1",
      accountId: 20,
      account: { code: "4-200", name: "Sewa Gedung" },
      amount: "3500000",
      description: "Sewa aula",
    },
  ],
  journal: null,
  ...next,
});

type Options = {
  grants?: MenuAction[];
  search?: string;
  settings?: unknown[] | null;
  row?: CashReceiptDetail;
  publicId?: string;
  onSave?: (body: string) => Response;
};

const onRender = (options: Options = {}) => {
  const {
    grants = ["VIEW", "CREATE", "UPDATE"],
    search = "",
    settings = null,
    row,
    publicId,
    onSave,
  } = options;

  actions.current = grants;
  query.current = search;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (init?.method && onSave) {
      return Promise.resolve(onSave(String(init.body)));
    }
    if (url.includes("/ddl/account")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: ACCOUNT_DDL }),
      );
    }
    if (url.includes("/setelan-akuntansi")) {
      return settings === null
        ? Promise.resolve(
            Response.json(
              { status: 404, error: "Setelan Akuntansi Tidak Ditemukan" },
              { status: 404 },
            ),
          )
        : Promise.resolve(
            Response.json({
              status: 200,
              message: "ok",
              totalData: settings.length,
              totalPage: 1,
              data: settings,
            }),
          );
    }
    if (url.includes("/kas-masuk/")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: row ?? detail() }),
      );
    }

    return Promise.resolve(
      Response.json({
        status: 200,
        message: "ok",
        totalData: 0,
        totalPage: 0,
        data: [],
      }),
    );
  }) as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <ReceiptFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("ReceiptFormScreen", () => {
  test("tidak pernah mengucapkan Debit atau Kredit", async () => {
    const { container } = onRender();

    await screen.findByLabelText("Diterima dari");

    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(1);
  });

  test("tanpa CREATE form ditolak", () => {
    onRender({ grants: ["VIEW"] });

    expect(screen.getByText("Tidak bisa menambah kas masuk")).toBeTruthy();
  });

  test("pintasan pencairan mengisi dua baris dari setelan", async () => {
    onRender({ search: "pencairan=1", settings: SETTING_FILLED });

    expect(
      await screen.findByText("Catat Pencairan Payment Gateway"),
    ).toBeTruthy();
    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(2);
    expect(
      (screen.getByLabelText("Diterima dari") as HTMLInputElement).value,
    ).toBe("Payment gateway");
    expect(screen.getByText(/Nominal masuk ke bank = bruto/)).toBeTruthy();
  });

  test("setelan kosong tetap mengisi dua baris dan menautkan setelannya", async () => {
    onRender({ search: "pencairan=1", settings: null });

    expect(await screen.findByText(/Setelan akun penampung/)).toBeTruthy();
    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(2);
    expect(
      screen.getByRole("link", { name: "Isi Setelan Akuntansi" }),
    ).toBeTruthy();
  });

  test("kas masuk yang sudah diterima tidak bisa diubah", async () => {
    onRender({ publicId: "bkm-0001", row: detail({ status: "PAID" }) });

    expect(
      await screen.findByText("Kas masuk ini tidak bisa diubah"),
    ).toBeTruthy();
  });

  test("ubah draf memuat isian dari dokumennya", async () => {
    onRender({ publicId: "bkm-0001" });

    const payer = await screen.findByLabelText("Diterima dari");

    expect((payer as HTMLInputElement).value).toBe("Keluarga Santoso");
    expect(
      (screen.getByLabelText(/^Referensi/) as HTMLInputElement).value,
    ).toBe("BA-07/IX/2026");
    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(1);
    expect(screen.getByText("Ubah Kas Masuk")).toBeTruthy();
  });
});
