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

import {
  PURCHASE_REQUEST,
  TODAY,
} from "../../../../../scripts/mock/pengadaan-store";
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
import { orderHref } from "../model";

const replaced: string[] = [];
const search = { current: new URLSearchParams() };

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/procurement/purchase-order/baru",
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: accessOf,
}));

const { OrderFormScreen } = await import("./screen");

const calls: Call[] = [];
const override: { current: ((call: Call) => Response | null) | null } = {
  current: null,
};
let restoreFetch: () => void;
let viewport: ReturnType<typeof onStubViewport>;

const requestNamed = (purpose: string) => {
  const row = PURCHASE_REQUEST.find((item) => item.purpose === purpose);

  if (!row) throw new Error(purpose);

  return row;
};

const RETRET = requestNamed("Perlengkapan retret pemuda Oktober");
const KURSI = requestNamed("Kursi lipat tambahan untuk aula");

beforeAll(() => {
  viewport = onStubViewport(false);
  restoreFetch = onStubOrderFetch(calls, override);
});

afterAll(() => {
  viewport.onRestore();
  restoreFetch();
});

afterEach(() => {
  cleanup();
  restoreOrders();
  calls.length = 0;
  replaced.length = 0;
  override.current = null;
  search.current = new URLSearchParams();
  window.sessionStorage.clear();
});

const onRender = (
  granted: Record<string, typeof ALL>,
  options: { code?: string; permintaan?: string } = {},
) => {
  grants.current = granted;
  search.current = new URLSearchParams(
    options.permintaan ? { permintaan: options.permintaan } : {},
  );

  return renderWithQuery(<OrderFormScreen code={options.code} />);
};

const cards = () =>
  within(screen.getByRole("list", { name: "Barang dipesan" })).getAllByRole(
    "listitem",
  );

const valueOf = (id: string) =>
  (document.getElementById(id) as HTMLInputElement).value;

const onPickSelect = async (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  const item = (await screen.findAllByRole("option", { name: option })).at(
    -1,
  ) as HTMLElement;

  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onPickCombobox = async (index: number, option: RegExp) => {
  fireEvent.click(
    screen.getAllByRole("button", { name: "Buka pilihan" })[
      index
    ] as HTMLElement,
  );
  const item = await screen.findByRole("option", { name: option });

  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const posted = () => calls.filter((call) => call.method !== "GET");

describe("izin", () => {
  test("tanpa CREATE: keadaan tidak bisa menambah", () => {
    onRender({ [MENU.PURCHASE_ORDER]: ["VIEW"] });

    expect(
      screen.getByText("Tidak bisa menambah pesanan pembelian"),
    ).toBeTruthy();
  });

  test("ubah pesanan Diterima sebagian: tidak bisa diubah", async () => {
    onRender({ [MENU.PURCHASE_ORDER]: ALL }, { code: orderAt(2).code });

    expect(await screen.findByText("Pesanan tidak bisa diubah")).toBeTruthy();
  });
});

describe("tambah dari tautan permintaan", () => {
  test("barang disalin sekali dengan harga perkiraan IDR; simpan → halaman pesanan", async () => {
    onRender(
      {
        [MENU.PURCHASE_ORDER]: ALL,
        [MENU.PURCHASE_REQUEST]: ["VIEW"],
      },
      { permintaan: RETRET.code.toLowerCase() },
    );

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(valueOf("items.0.name")).toBe("Tenda dome kapasitas 6 orang");
    expect(valueOf("items.0.unitPrice")).toBe("950.000");
    expect(valueOf("items.1.quantity")).toBe("20");
    expect(valueOf("items.1.description")).toBe(RETRET.purpose);
    expect(screen.getByText(/2 barang · Total Rp 5\.500\.000/)).toBeTruthy();

    await onPickCombobox(1, /Toko Buku Agape/);
    for (const index of [1, 2]) {
      await onPickSelect(`Satuan barang ${index}`, "Buah");
      await onPickSelect(`Tipe barang barang ${index}`, "Mebel");
      await onPickSelect(`Ruang simpan barang ${index}`, "Aula Serbaguna");
    }

    await onSaveConfirmed();
    await waitFor(() => expect(replaced).toHaveLength(1));

    const [call] = posted();
    const body = call?.body as {
      orderDate: string;
      currencyCode: string;
      purchaseRequestId: number;
      items: { unitPrice: number; quantity: number }[];
    };

    expect(call?.method).toBe("POST");
    expect(body.orderDate).toBe(TODAY);
    expect(body.currencyCode).toBe("IDR");
    expect(body.purchaseRequestId).toBe(RETRET.id);
    expect(body.items.map((item) => item.unitPrice)).toEqual([950_000, 85_000]);
    expect(replaced[0]).toStartWith(orderHref("PO-"));
  });

  test("tanpa VIEW permintaan: permintaan terisi, barang tidak disalin", async () => {
    onRender({ [MENU.PURCHASE_ORDER]: ALL }, { permintaan: RETRET.code });

    expect(
      await screen.findByText("Tambah barang yang dibeli satu per satu."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Salin barang dari permintaan" }),
    ).toBeNull();
  });

  test("salin hanya ditawarkan saat daftar kosong", async () => {
    onRender(
      {
        [MENU.PURCHASE_ORDER]: ALL,
        [MENU.PURCHASE_REQUEST]: ["VIEW"],
      },
      { permintaan: RETRET.code },
    );

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(
      screen.queryByRole("button", { name: "Salin barang dari permintaan" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Hapus Tenda/ }));
    fireEvent.click(screen.getByRole("button", { name: /Hapus Matras/ }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Salin barang dari permintaan",
      }),
    );

    await waitFor(() => expect(cards()).toHaveLength(2));
  });

  test("melebihi perkiraan: dibandingkan dalam Rupiah dengan pesanan lain", async () => {
    onRender(
      {
        [MENU.PURCHASE_ORDER]: ALL,
        [MENU.PURCHASE_REQUEST]: ["VIEW"],
      },
      { permintaan: KURSI.code },
    );

    expect(
      await screen.findByText(
        `Total pesanan dari permintaan ${KURSI.code} menjadi Rp 16.600.000, melebihi perkiraan yang disetujui Rp 8.000.000 (+107,5%). Pesanan tetap bisa disimpan.`,
      ),
    ).toBeTruthy();
  });
});

describe("kurs pratinjau", () => {
  test("USD: kurs terbaru + total ganda; tanpa kurs pratinjau belum ada ≈ Rp", async () => {
    onRender({ [MENU.PURCHASE_ORDER]: ALL });

    await onPickSelect("Mata uang", "USD — Dolar Amerika");

    expect(
      await screen.findByText(/^Kurs 15\.800 · .* \(Mata Uang\)$/),
    ).toBeTruthy();
    expect(screen.queryByText(/Kurs terakhir/)).toBeNull();
  });

  test("SGD: kurs lebih dari 7 hari → peringatan, tautan hanya untuk CURRENCY CREATE", async () => {
    onRender({
      [MENU.PURCHASE_ORDER]: ALL,
      [MENU.CURRENCY]: ["VIEW", "CREATE"],
    });

    await onPickSelect("Mata uang", "SGD — Dolar Singapura");

    expect(
      await screen.findByText(
        /Kurs terakhir .*Perbarui di Mata Uang bila sudah berubah\./,
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Buka Mata Uang" }).getAttribute("href"),
    ).toBe("/finance/currency/SGD");
  });

  test("EUR tanpa kurs: galat + tautan bergerbang; simpan tetap aktif", async () => {
    onRender({
      [MENU.PURCHASE_ORDER]: ALL,
      [MENU.CURRENCY]: ["VIEW", "CREATE"],
    });

    await onPickSelect("Mata uang", "EUR — Euro");

    expect(
      await screen.findByText(/Belum ada kurs EUR untuk tanggal ini\./),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Isi kurs di Mata Uang" }),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  test("EUR tanpa kurs, persona tanpa CURRENCY CREATE: tanpa tautan", async () => {
    onRender({
      [MENU.PURCHASE_ORDER]: ALL,
      [MENU.CURRENCY]: ["VIEW"],
    });

    await onPickSelect("Mata uang", "EUR — Euro");

    expect(
      await screen.findByText(/Belum ada kurs EUR untuk tanggal ini\./),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Isi kurs di Mata Uang" }),
    ).toBeNull();
  });
});

describe("ubah pesanan Dipesan", () => {
  const KURSI_ORDER = 5;

  test("peringatan memakai pesanan lain saja (tanpa pesanan ini)", async () => {
    onRender(
      { [MENU.PURCHASE_ORDER]: ALL },
      { code: orderAt(KURSI_ORDER).code },
    );

    expect(
      await screen.findByText(
        /menjadi Rp 8\.600\.000, melebihi perkiraan yang disetujui Rp 8\.000\.000 \(\+7,5%\)/,
      ),
    ).toBeTruthy();
  });

  test("galat server items.0.roomId → kartu yang benar dan fokus", async () => {
    override.current = (call) =>
      call.method === "PUT"
        ? Response.json(
            {
              status: 400,
              error: "Ruang Tidak Aktif",
              issues: [
                { path: "items.0.roomId", message: "Ruang Tidak Aktif" },
              ],
            },
            { status: 400 },
          )
        : null;
    onRender(
      { [MENU.PURCHASE_ORDER]: ALL },
      { code: orderAt(KURSI_ORDER).code },
    );

    await waitFor(() => expect(cards()).toHaveLength(1));
    await onSaveConfirmed();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("items.0.roomId"),
    );
    expect(document.getElementById("items.0.roomId-error")?.textContent).toBe(
      "Ruang Tidak Aktif",
    );
  });

  test("galat kurs dari server → field Mata uang", async () => {
    override.current = (call) =>
      call.method === "PUT"
        ? Response.json(
            {
              status: 400,
              error:
                "Belum Ada Kurs EUR Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu",
              issues: [
                {
                  path: "currencyCode",
                  message:
                    "Belum Ada Kurs EUR Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu",
                },
              ],
            },
            { status: 400 },
          )
        : null;
    onRender(
      { [MENU.PURCHASE_ORDER]: ALL },
      { code: orderAt(KURSI_ORDER).code },
    );

    await waitFor(() => expect(cards()).toHaveLength(1));
    await onSaveConfirmed();

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("currencyCode"),
    );
    expect(
      document.getElementById("currencyCode-error")?.textContent,
    ).toContain("Belum Ada Kurs EUR");
  });

  test("simpan gagal 500: galat tingkat form, isian tetap", async () => {
    override.current = (call) =>
      call.method === "PUT"
        ? Response.json(
            { status: 500, error: "Internal Server Error" },
            { status: 500 },
          )
        : null;
    onRender(
      { [MENU.PURCHASE_ORDER]: ALL },
      { code: orderAt(KURSI_ORDER).code },
    );

    await waitFor(() => expect(cards()).toHaveLength(1));
    await onSaveConfirmed();

    expect(
      await screen.findByText("Data belum tersimpan. Coba simpan lagi."),
    ).toBeTruthy();
    expect(valueOf("items.0.unitPrice")).toBe("215.000");
  });
});
