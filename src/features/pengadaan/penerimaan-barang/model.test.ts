import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { addDays, todayJakarta } from "@/lib/date";
import type { AttachmentValue } from "@/types/attachment";

import {
  confirmTextOf,
  emptyReceiptForm,
  groupItems,
  linesOf,
  receiptFormSchema,
  stockOptionsOf,
  summaryTextOf,
  toFormIssues,
  toReceiptFormData,
  type ReceiptFormValues,
  type ReceiptLine,
} from "./model";
import type { OrderForReceipt, ReceiptItem } from "./types";

const named = (name: string) => ({ publicId: name, code: name, name });

const ORDER: OrderForReceipt = {
  id: 4,
  code: "PO-2026-0004",
  status: "PARTIALLY_RECEIVED",
  orderDate: "2026-09-26T00:00:00.000Z",
  currencyCode: "USD",
  exchangeRate: "15750",
  items: [
    {
      id: 11,
      name: "Mixer",
      description: "Impor",
      quantity: 2,
      unitPrice: "1041.5",
      unitId: 1,
      room: named("Gedung Gereja"),
      unit: named("Buah"),
      receivedQuantity: 0,
      remainingQuantity: 2,
    },
    {
      id: 12,
      name: "Kabel",
      description: "",
      quantity: 5,
      unitPrice: "10",
      unitId: 1,
      room: named("Gedung Gereja"),
      unit: named("Buah"),
      receivedQuantity: 5,
      remainingQuantity: 0,
    },
  ],
};

const lineOf = (patch: Partial<ReceiptLine> = {}): ReceiptLine => ({
  ...(linesOf(ORDER)[0] as ReceiptLine),
  ...patch,
});

const valuesOf = (
  items: ReceiptLine[],
  patch: Partial<ReceiptFormValues> = {},
): ReceiptFormValues => ({
  ...emptyReceiptForm(),
  purchaseOrderId: "4",
  orderDate: "2026-09-26",
  items,
  ...patch,
});

const messagesOf = (values: ReceiptFormValues) => {
  const result = receiptFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("baris dari pesanan", () => {
  test("hanya baris bersisa, jumlah = sisa, harga Rupiah = harga × kurs", () => {
    const lines = linesOf(ORDER);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      purchaseOrderItemId: "11",
      quantityReceived: "2",
      target: "",
      stockItemId: "",
      unitPriceIDR: 16_403_625,
      room: "Gedung Gereja",
    });
  });

  test("opsi persediaan: baru dulu, satuan lain nonaktif di akhir", () => {
    const options = stockOptionsOf(
      [
        {
          id: 7,
          code: "BRP-7",
          name: "Kertas",
          quantity: 3,
          unit: { id: 4, name: "Rim" },
        },
        {
          id: 8,
          code: "BRP-8",
          name: "Lilin",
          quantity: 12,
          unit: { id: 1, name: "Buah" },
        },
      ],
      lineOf(),
    );

    expect(options).toEqual([
      { value: "", label: "Barang persediaan baru di Gedung Gereja" },
      {
        value: "8",
        label: "Lilin",
        hint: "BRP-8 · stok 12 Buah",
        isDisabled: false,
      },
      { value: "7", label: "Kertas", hint: "Satuan Rim", isDisabled: true },
    ]);
  });
});

describe("skema", () => {
  test("jenis wajib, sisa, maks 50 barang, tanggal", () => {
    expect(messagesOf(valuesOf([lineOf()]))).toEqual({
      "items.0.target": "Pilih jadi barang atau barang persediaan",
    });
    expect(
      messagesOf(
        valuesOf([lineOf({ quantityReceived: "3", target: "STOCK" })]),
      ),
    ).toEqual({ "items.0.quantityReceived": "Melebihi sisa pesanan (2)" });
    expect(
      messagesOf(
        valuesOf([
          lineOf({ quantityReceived: "51", remaining: 60, target: "ASSET" }),
        ]),
      ),
    ).toEqual({ "items.0.quantityReceived": "Maksimal 50 barang per baris" });
    expect(
      messagesOf(
        valuesOf([lineOf({ target: "ASSET" })], {
          receivedDate: addDays(todayJakarta(), 1),
        }),
      ),
    ).toEqual({ receivedDate: "Tanggal terima tidak boleh di masa depan" });
    expect(
      messagesOf(
        valuesOf([lineOf({ target: "ASSET" })], { receivedDate: "2026-09-25" }),
      ),
    ).toEqual({
      receivedDate:
        "Tanggal terima tidak boleh sebelum tanggal pesanan (26 September 2026)",
    });
  });

  test("semua jumlah kosong → galat daftar, tanpa jenis wajib", () => {
    expect(messagesOf(valuesOf([lineOf({ quantityReceived: "" })]))).toEqual({
      items: "Isi jumlah yang diterima minimal di satu barang",
    });
    expect(messagesOf(valuesOf([], { purchaseOrderId: "" }))).toEqual({
      purchaseOrderId: "Pilih pesanan pembelian",
    });
  });
});

describe("payload", () => {
  test("multipart: hanya jumlah > 0, stockItemId null untuk baru, tanpa receivedBy", () => {
    const file = new File(["x"], "nota.pdf", { type: "application/pdf" });
    const attachment: AttachmentValue = {
      key: "k",
      name: "nota.pdf",
      mimeType: "application/pdf",
      url: "blob:x",
      showOnWebsite: false,
      file,
    };
    const body = toReceiptFormData(
      valuesOf(
        [
          lineOf({ target: "ASSET" }),
          lineOf({ purchaseOrderItemId: "12", quantityReceived: "" }),
          lineOf({ purchaseOrderItemId: "13", target: "STOCK" }),
          lineOf({
            purchaseOrderItemId: "14",
            target: "STOCK",
            stockItemId: "8",
          }),
        ],
        { receivedDate: "2026-09-28", note: "  ", image: [attachment] },
      ),
    );

    expect(body.get("purchaseOrderId")).toBe("4");
    expect(body.get("receivedDate")).toBe("2026-09-28");
    expect(body.has("note")).toBe(false);
    expect(body.has("receivedBy")).toBe(false);
    expect(JSON.parse(String(body.get("items")))).toEqual([
      { purchaseOrderItemId: 11, quantityReceived: 2, target: "ASSET" },
      {
        purchaseOrderItemId: 13,
        quantityReceived: 2,
        target: "STOCK",
        stockItemId: null,
      },
      {
        purchaseOrderItemId: 14,
        quantityReceived: 2,
        target: "STOCK",
        stockItemId: 8,
      },
    ]);
    expect(body.getAll("image")).toHaveLength(1);
  });

  test("galat server: nomor baris payload dipetakan ke baris form", () => {
    const values = valuesOf([
      lineOf({ quantityReceived: "" }),
      lineOf({ purchaseOrderItemId: "12", target: "ASSET" }),
    ]);
    const mapped = toFormIssues(
      new FetchError(400, "Melebihi", [
        { path: "items.0.quantityReceived", message: "Melebihi" },
        { path: "image", message: "Lampiran Maksimal 3" },
      ]),
      values,
    ) as FetchError;

    expect(mapped.issues.map((issue) => issue.path)).toEqual([
      "items.1.quantityReceived",
      "image",
    ]);
  });

  test("teks ringkasan dan konfirmasi final", () => {
    const lines = [
      lineOf({ target: "ASSET" }),
      lineOf({ target: "STOCK" }),
      lineOf({ quantityReceived: "" }),
    ];

    expect(summaryTextOf(lines)).toBe(
      "2 baris · 2 barang baru · 1 baris persediaan",
    );
    expect(confirmTextOf(lines)).toBe(
      "Apakah Anda ingin menyimpan penerimaan ini? 2 barang baru dan stok 1 barang persediaan akan tercatat. Penerimaan tidak bisa diubah atau dihapus.",
    );
    expect(confirmTextOf([lineOf({ target: "STOCK" })])).toBe(
      "Apakah Anda ingin menyimpan penerimaan ini? Stok 1 barang persediaan akan tercatat. Penerimaan tidak bisa diubah atau dihapus.",
    );
  });
});

test("halaman baca: N barang satu baris pesanan dikelompokkan", () => {
  const item = (
    id: number,
    lineId: number,
    asset: string | null,
  ): ReceiptItem => ({
    id,
    publicId: `p${id}`,
    quantityReceived: asset ? 1 : 10,
    purchaseOrderItemId: lineId,
    assetId: asset ? id : null,
    stockItemId: asset ? null : 3,
    purchaseOrderItem: {
      publicId: "x",
      name: asset ? "Kursi" : "Kertas",
      quantity: 40,
    },
    unitPrice: "215000",
    unitPriceIDR: "215000",
    unit: named(asset ? "Buah" : "Rim"),
    asset: asset ? { code: asset, name: "Kursi" } : null,
    stockItem: asset ? null : { code: "BRP-3", name: "Kertas" },
  });

  const groups = groupItems([
    item(1, 7, "AST-1"),
    item(2, 8, null),
    item(3, 7, "AST-2"),
  ]);

  expect(
    groups.map((group) => [group.name, group.quantity, group.assets.length]),
  ).toEqual([
    ["Kursi", 2, 2],
    ["Kertas", 10, 0],
  ]);
});
