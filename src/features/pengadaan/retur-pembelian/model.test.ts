import { describe, expect, test } from "bun:test";

import {
  isCancellable,
  isCompletable,
  isEditable,
  isOverReturned,
  lineValueText,
  returnFormSchema,
  returnTotalText,
  toReturnApiFilters,
  toReturnForm,
  toReturnLine,
  toReturnPayload,
  type ReturnFormValues,
  type ReturnLine,
} from "./model";
import type { PurchaseReturn, ReceiptForReturn, ReceiptLine } from "./types";

const line = (over: Partial<ReturnLine> = {}): ReturnLine => ({
  goodsReceiptItemId: "7",
  name: "Kertas HVS A4",
  unit: "rim",
  unitPrice: "52500",
  quantityReceived: 10,
  target: "STOCK",
  quantity: "2",
  reason: "",
  ...over,
});

const values = (over: Partial<ReturnFormValues> = {}): ReturnFormValues => ({
  goodsReceiptCode: "GRN-2026-0001",
  returnDate: "2026-10-12",
  reason: "Kertas tiba basah",
  items: [line()],
  ...over,
});

const parse = (input: ReturnFormValues) => returnFormSchema.safeParse(input);

const messagesOf = (input: ReturnFormValues) => {
  const result = parse(input);

  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
};

describe("skema retur", () => {
  test("isian lengkap lolos", () => {
    expect(parse(values()).success).toBe(true);
  });

  test("penerimaan, tanggal, dan alasan wajib", () => {
    const messages = messagesOf(
      values({ goodsReceiptCode: "", returnDate: "", reason: "   " }),
    );

    expect(messages).toEqual([
      { path: "goodsReceiptCode", message: "Pilih penerimaan barang" },
      { path: "returnDate", message: "Isi tanggal retur" },
      { path: "reason", message: "Isi alasan retur" },
    ]);
  });

  test("alasan dibatasi 250 karakter, sama dengan be-sada", () => {
    expect(parse(values({ reason: "a".repeat(250) })).success).toBe(true);
    expect(messagesOf(values({ reason: "a".repeat(251) }))).toEqual([
      { path: "reason", message: "Alasan maksimal 250 karakter" },
    ]);
  });

  test("alasan baris juga dibatasi 250 karakter", () => {
    expect(
      messagesOf(values({ items: [line({ reason: "b".repeat(251) })] })),
    ).toEqual([
      { path: "items.0.reason", message: "Alasan baris maksimal 250 karakter" },
    ]);
  });

  test("tanpa baris sama sekali ditolak", () => {
    expect(messagesOf(values({ items: [] }))).toEqual([
      {
        path: "items",
        message: "Muat baris penerimaan, lalu isi jumlah yang diretur",
      },
    ]);
  });

  test("jumlah bulat dan tidak melebihi yang diterima", () => {
    expect(messagesOf(values({ items: [line({ quantity: "0" })] }))).toEqual([
      { path: "items", message: "Isi jumlah pada baris yang dikembalikan" },
      { path: "items.0.quantity", message: "Isi jumlah, minimal 1" },
    ]);
    expect(messagesOf(values({ items: [line({ quantity: "1.5" })] }))).toEqual([
      { path: "items", message: "Isi jumlah pada baris yang dikembalikan" },
      { path: "items.0.quantity", message: "Jumlah harus bilangan bulat" },
    ]);
    expect(messagesOf(values({ items: [line({ quantity: "11" })] }))).toEqual([
      {
        path: "items.0.quantity",
        message: "Jumlah retur melebihi jumlah diterima (10)",
      },
    ]);
  });

  // Satu penerimaan bisa punya dua puluh baris dan hanya satu yang pulang:
  // baris berjumlah kosong berarti tidak dikembalikan, bukan baris bergalat.
  test("jumlah kosong bukan galat baris, tapi minimal satu harus terisi", () => {
    expect(
      parse(values({ items: [line(), line({ quantity: "" })] })).success,
    ).toBe(true);
    expect(messagesOf(values({ items: [line({ quantity: "" })] }))).toEqual([
      { path: "items", message: "Isi jumlah pada baris yang dikembalikan" },
    ]);
  });
});

describe("payload", () => {
  test("tanggal YYYY-MM-DD, id baris numerik, alasan kosong jadi null", () => {
    expect(toReturnPayload(values(), 41)).toEqual({
      goodsReceiptId: 41,
      returnDate: "2026-10-12",
      reason: "Kertas tiba basah",
      items: [{ goodsReceiptItemId: 7, quantity: 2, reason: null }],
    });
  });

  test("baris berjumlah kosong tidak dikirim", () => {
    const payload = toReturnPayload(
      values({
        items: [
          line({ goodsReceiptItemId: "7", quantity: "2" }),
          line({ goodsReceiptItemId: "8", quantity: "" }),
        ],
      }),
      41,
    );

    expect(payload.items).toEqual([
      { goodsReceiptItemId: 7, quantity: 2, reason: null },
    ]);
  });

  test("spasi berlebih dirapatkan, bukan dikirim apa adanya", () => {
    const payload = toReturnPayload(
      values({
        reason: "  Kertas   tiba   basah  ",
        items: [line({ reason: "  sudut   lecek " })],
      }),
      1,
    );

    expect(payload.reason).toBe("Kertas tiba basah");
    expect(payload.items[0]?.reason).toBe("sudut lecek");
  });
});

describe("nilai retur", () => {
  // be-sada menjumlah dulu lalu membulatkan sekali; membulatkan tiap baris
  // memberi 0.03 untuk kasus di bawah, bukan 0.02.
  test("dibulatkan sekali di akhir, bukan per baris", () => {
    const lines = [
      line({ quantity: "1", unitPrice: "0.0050", quantityReceived: 10 }),
      line({ quantity: "1", unitPrice: "0.0050", quantityReceived: 10 }),
      line({ quantity: "1", unitPrice: "0.0050", quantityReceived: 10 }),
    ];

    expect(returnTotalText(lines, "1")).toBe("0.02");
  });

  test("kurs pesanan dipakai, bukan satu rupiah per unit asing", () => {
    const lines = [line({ quantity: "2", unitPrice: "12.5000" })];

    expect(returnTotalText(lines, "16250.500000")).toBe("406262.50");
  });

  test("baris yang belum diisi dilewati, total tetap terbaca", () => {
    const lines = [line({ quantity: "2" }), line({ quantity: "" })];

    expect(returnTotalText(lines, "1")).toBe("105000");
  });

  test("nilai per baris memakai ketiga faktornya", () => {
    expect(lineValueText(line({ quantity: "2", unitPrice: "12.5" }), "2")).toBe(
      "50",
    );
    expect(lineValueText(line({ quantity: "" }), "2")).toBeNull();
  });
});

describe("baris penerimaan menjadi baris retur", () => {
  const receiptLine = (over: Partial<ReceiptLine> = {}): ReceiptLine => ({
    id: 7,
    publicId: "gri-7",
    quantityReceived: 10,
    assetId: null,
    stockItemId: 3,
    purchaseOrderItem: { name: "Kertas HVS A4" },
    unitPrice: "52500",
    unit: { publicId: "u-1", code: "RIM", name: "rim" },
    asset: null,
    stockItem: { code: "BRP-003", name: "Kertas HVS A4" },
    ...over,
  });

  test("jumlah mulai kosong supaya orang mengisinya sendiri", () => {
    expect(toReturnLine(receiptLine())).toEqual({
      goodsReceiptItemId: "7",
      name: "Kertas HVS A4",
      unit: "rim",
      unitPrice: "52500",
      quantityReceived: 10,
      target: "STOCK",
      quantity: "",
      reason: "",
    });
  });

  test("baris aset dikenali sebagai aset, bukan persediaan", () => {
    expect(
      toReturnLine(receiptLine({ assetId: 12, stockItemId: null })).target,
    ).toBe("ASSET");
  });

  test("baris tanpa aset dan tanpa persediaan tidak mengarang jenis", () => {
    expect(
      toReturnLine(receiptLine({ assetId: null, stockItemId: null })).target,
    ).toBe("");
  });
});

describe("retur tersimpan menjadi nilai form", () => {
  const saved: PurchaseReturn = {
    publicId: "ret-1",
    code: "RTR-2026-0001",
    status: "DRAFT",
    returnDate: "2026-10-12T00:00:00.000Z",
    reason: "Kertas tiba basah",
    totalIDR: "105000",
    approvedAt: null,
    createdAt: "2026-10-12T03:00:00.000Z",
    supplier: { publicId: "s-1", code: "SUP-001", name: "Toko Agape" },
    goodsReceipt: {
      publicId: "grn-1",
      code: "GRN-2026-0001",
      receivedDate: "2026-09-01T00:00:00.000Z",
    },
    items: [
      {
        publicId: "ri-1",
        goodsReceiptItemId: 7,
        quantity: 2,
        reason: "sudut lecek",
        goodsReceiptItem: {
          publicId: "gri-7",
          quantityReceived: 10,
          assetId: null,
          stockItemId: 3,
          purchaseOrderItem: { name: "Kertas HVS A4", unitPrice: "52500" },
        },
      },
    ],
  };

  test("terisi tanpa menunggu rincian penerimaan", () => {
    expect(toReturnForm(saved)).toEqual({
      goodsReceiptCode: "GRN-2026-0001",
      returnDate: "2026-10-12",
      reason: "Kertas tiba basah",
      items: [
        {
          goodsReceiptItemId: "7",
          name: "Kertas HVS A4",
          unit: "",
          unitPrice: "52500",
          quantityReceived: 10,
          target: "STOCK",
          quantity: "2",
          reason: "sudut lecek",
        },
      ],
    });
  });

  test("satuan dilengkapi begitu rincian penerimaan termuat", () => {
    const receipt: ReceiptForReturn = {
      id: 41,
      publicId: "grn-1",
      code: "GRN-2026-0001",
      receivedDate: "2026-09-01T00:00:00.000Z",
      purchaseOrder: {
        code: "PO-2026-0001",
        currencyCode: "IDR",
        exchangeRate: "1",
        supplier: { publicId: "s-1", code: "SUP-001", name: "Toko Agape" },
      },
      items: [
        {
          id: 7,
          publicId: "gri-7",
          quantityReceived: 10,
          assetId: null,
          stockItemId: 3,
          purchaseOrderItem: { name: "Kertas HVS A4" },
          unitPrice: "52500",
          unit: { publicId: "u-1", code: "RIM", name: "rim" },
          asset: null,
          stockItem: null,
        },
      ],
    };

    expect(toReturnForm(saved, receipt).items[0]?.unit).toBe("rim");
  });
});

describe("aturan status", () => {
  const row = (over: Partial<PurchaseReturn>) =>
    ({ status: "DRAFT", approvedAt: null, ...over }) as PurchaseReturn;

  test("hanya draf yang bisa diubah", () => {
    expect(isEditable(row({ status: "DRAFT" }))).toBe(true);
    expect(isEditable(row({ status: "SUBMITTED" }))).toBe(false);
  });

  // Status SUBMITTED saja tidak cukup: `approvedAt` ditulis hook persetujuan,
  // dan `complete` di be-sada menolak tanpa itu.
  test("selesai hanya setelah disetujui, bukan sekadar diajukan", () => {
    expect(isCompletable(row({ status: "SUBMITTED" }))).toBe(false);
    expect(
      isCompletable(
        row({ status: "SUBMITTED", approvedAt: "2026-10-13T03:00:00.000Z" }),
      ),
    ).toBe(true);
    expect(
      isCompletable(
        row({ status: "COMPLETED", approvedAt: "2026-10-13T03:00:00.000Z" }),
      ),
    ).toBe(false);
  });

  test("selesai dan dibatalkan tidak bisa dibatalkan lagi", () => {
    expect(isCancellable(row({ status: "DRAFT" }))).toBe(true);
    expect(isCancellable(row({ status: "SUBMITTED" }))).toBe(true);
    expect(isCancellable(row({ status: "COMPLETED" }))).toBe(false);
    expect(isCancellable(row({ status: "CANCELLED" }))).toBe(false);
  });
});

describe("filter dan pesan server", () => {
  test("supplier di URL menjadi supplierId be-sada", () => {
    expect(toReturnApiFilters({ supplier: "4" })).toEqual({ supplierId: "4" });
    expect(toReturnApiFilters({})).toEqual({ supplierId: "" });
  });

  test("penolakan sisa retur dikenali dari pesan server", () => {
    expect(
      isOverReturned(
        "Jumlah Retur Untuk Kertas HVS A4 Melebihi Jumlah Yang Diterima (diterima 10, sudah diretur 9)",
      ),
    ).toBe(true);
    expect(isOverReturned("Retur Ini Sudah Dibatalkan")).toBe(false);
  });
});
