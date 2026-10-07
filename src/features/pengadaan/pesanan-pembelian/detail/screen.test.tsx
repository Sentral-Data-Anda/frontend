import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
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

import { MENU } from "@/config/menu";

import { receivedQuantityOf } from "../../../../../scripts/mock/pengadaan-store";
import { onStubViewport } from "../../../../../tests/viewport";
import {
  ALL,
  accessOf,
  grants,
  onStubOrderFetch,
  orderAt,
  renderWithQuery,
  restoreOrders,
  type Call,
} from "../fixtures";
import { ORDER_LIST_PATH } from "../model";

const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/pengadaan/pesanan-pembelian/x",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: accessOf,
}));

const { OrderDetailScreen } = await import("./screen");

const calls: Call[] = [];
const override: { current: ((call: Call) => Response | null) | null } = {
  current: null,
};
let restoreFetch: () => void;
let viewport: ReturnType<typeof onStubViewport>;

const PARTIAL = 2;
const USD = 3;
const KURSI = 5;

beforeAll(() => {
  viewport = onStubViewport(true);
  restoreFetch = onStubOrderFetch(calls, override);
});

afterAll(() => {
  viewport.onRestore();
  restoreFetch();
});

afterEach(() => {
  cleanup();
  viewport.onResize(true);
  restoreOrders();
  calls.length = 0;
  replaced.length = 0;
  override.current = null;
});

const OPERATOR = {
  [MENU.PESANAN_PEMBELIAN]: ALL,
  [MENU.PENERIMAAN_BARANG]: ["VIEW", "CREATE"] as typeof ALL,
};

const onRender = (granted: Record<string, typeof ALL>, index: number) => {
  grants.current = granted;
  renderWithQuery(<OrderDetailScreen code={orderAt(index).code} />);

  return screen.findByRole("region", { name: "Ringkasan pesanan" });
};

const actionNames = () => {
  const region = screen.queryByRole("region", { name: "Aksi pesanan" });

  return region
    ? [
        ...within(region).queryAllByRole("button"),
        ...within(region).queryAllByRole("link"),
      ].map((node) => node.textContent)
    : [];
};

const onConfirmYes = async () =>
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ya",
    }),
  );

describe("aksi per status × izin", () => {
  test("Dipesan tanpa penerimaan: catat, ubah, batalkan, hapus; tanpa tutup", async () => {
    await onRender(OPERATOR, KURSI);

    expect(actionNames().sort()).toEqual(
      ["Batalkan", "Catat penerimaan", "Hapus", "Ubah"].sort(),
    );
    expect(
      screen
        .getByRole("link", { name: "Catat penerimaan" })
        .getAttribute("href"),
    ).toBe(`/pengadaan/penerimaan-barang/baru?pesanan=${orderAt(KURSI).code}`);
  });

  test("Diterima sebagian: catat penerimaan dan tutup saja", async () => {
    await onRender(OPERATOR, PARTIAL);

    expect(actionNames().sort()).toEqual(["Catat penerimaan", "Tutup pesanan"]);
  });

  test("lihat saja (bendahara): tanpa aksi", async () => {
    await onRender({ [MENU.PESANAN_PEMBELIAN]: ["VIEW"] }, KURSI);

    expect(screen.queryByRole("region", { name: "Aksi pesanan" })).toBeNull();
  });

  test("tanpa CREATE penerimaan: tanpa Catat penerimaan", async () => {
    await onRender({ [MENU.PESANAN_PEMBELIAN]: ALL }, PARTIAL);

    expect(actionNames()).toEqual(["Tutup pesanan"]);
  });

  test("tanpa VIEW: keadaan akses", () => {
    grants.current = {};
    renderWithQuery(<OrderDetailScreen code={orderAt(KURSI).code} />);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Pesanan Pembelian"),
    ).toBeTruthy();
  });
});

describe("isi halaman", () => {
  test("melebihi perkiraan memakai angka server (tanpa pesanan ini dua kali)", async () => {
    await onRender(OPERATOR, KURSI);

    expect(
      screen.getByText(
        /menjadi Rp 8\.600\.000, melebihi perkiraan yang disetujui Rp 8\.000\.000 \(\+7,5%\)\.$/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        (_content, node) =>
          node?.tagName === "P" &&
          node.textContent ===
            `Pembayaran ke supplier dicatat di Kas Keluar. Tulis kode ${orderAt(KURSI).code} di Referensi.`,
      ),
    ).toBeTruthy();
  });

  test("USD: total asing utama + ≈ Rp dengan kurs beku", async () => {
    const summary = await onRender(OPERATOR, USD);

    expect(within(summary).getByText("USD 1.041,00")).toBeTruthy();
    expect(
      within(summary).getByText(/^≈ Rp 16\.395\.750 · kurs 15\.750 · /),
    ).toBeTruthy();
    expect(within(summary).getByText(/^USD · 15\.750 per /)).toBeTruthy();
  });

  test("HP: Diterima sebagian, sisa per baris di meta", async () => {
    viewport.onResize(false);
    await onRender(OPERATOR, PARTIAL);

    const [first] = orderAt(PARTIAL).items;
    const received = receivedQuantityOf(first?.id ?? 0);
    expect(
      screen.getByText(
        (content) =>
          content.startsWith(`Dipesan ${first?.quantity} `) &&
          content.includes(
            ` · diterima ${received} · sisa ${(first?.quantity ?? 0) - received} · `,
          ),
      ),
    ).toBeTruthy();
  });
});

describe("aksi", () => {
  test("tutup: konfirmasi menyebut sisa, PUT /tutup, lalu ditutup", async () => {
    await onRender(OPERATOR, PARTIAL);
    const order = orderAt(PARTIAL);
    const remaining = order.items.reduce(
      (sum, item) => sum + item.quantity - receivedQuantityOf(item.id),
      0,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tutup pesanan" }));
    expect(
      await screen.findByText(
        `Apakah Anda ingin menutup pesanan ini? ${remaining} barang yang belum datang tidak ditunggu lagi.`,
      ),
    ).toBeTruthy();
    await onConfirmYes();

    expect(
      await screen.findByText(`(ditutup, ${remaining} tidak datang)`),
    ).toBeTruthy();
    expect(
      calls.filter((call) => call.method === "PUT").map((call) => call.path),
    ).toEqual([`/pesanan-pembelian/${order.code}/tutup`]);
  });

  test("batalkan: teks khusus, lalu Dibatalkan tanpa aksi", async () => {
    await onRender(OPERATOR, KURSI);

    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    expect(
      await screen.findByText(
        "Apakah Anda ingin membatalkan pesanan ini? Supplier perlu diberi tahu sendiri.",
      ),
    ).toBeTruthy();
    await onConfirmYes();

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Batalkan" })).toBeNull(),
    );
    expect(screen.getByText("Dibatalkan")).toBeTruthy();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toContain(
      `PUT /pesanan-pembelian/${orderAt(KURSI).code}/batal`,
    );
  });

  test("hapus: DELETE lalu kembali ke daftar", async () => {
    await onRender(OPERATOR, KURSI);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await onConfirmYes();

    await waitFor(() => expect(replaced).toEqual([ORDER_LIST_PATH]));
    expect(calls.some((call) => call.method === "DELETE")).toBe(true);
  });

  test("aksi gagal: galat tampil, halaman tetap", async () => {
    override.current = (call) =>
      call.method === "PUT"
        ? Response.json(
            { status: 400, error: "Pesanan Ini Sudah Ada Penerimaan Barang" },
            { status: 400 },
          )
        : null;
    await onRender(OPERATOR, KURSI);

    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    await onConfirmYes();

    expect(await screen.findByText("Pesanan belum dibatalkan.")).toBeTruthy();
    expect(
      screen.getByText("Pesanan Ini Sudah Ada Penerimaan Barang"),
    ).toBeTruthy();
  });
});
