import { describe, expect, test } from "bun:test";

import {
  invoiceFormSchema,
  isRetractable,
  itemsSumText,
  orderItemsToForm,
  outstandingOf,
  toInvoicePayload,
  toPaymentPayload,
  type InvoiceFormValues,
  type InvoiceItemValues,
} from "./model";
import type { OrderItemOption } from "./types";

const item = (
  overrides: Partial<InvoiceItemValues> = {},
): InvoiceItemValues => ({
  name: "Kendaraan operasional",
  amountForeign: "1000000",
  accountId: "61",
  purchaseOrderItemId: "",
  ...overrides,
});

const form = (
  overrides: Partial<InvoiceFormValues> = {},
): InvoiceFormValues => ({
  supplierInvoiceNumber: "FK/2026/1",
  supplierId: "1",
  purchaseOrderId: "",
  expenseAccountId: "",
  invoiceDate: "2026-03-05",
  dueDate: "2026-03-20",
  currencyCode: "IDR",
  totalForeignCurrency: "1000000",
  items: [],
  ...overrides,
});

const issuesOf = (overrides: Partial<InvoiceFormValues>) => {
  const parsed = invoiceFormSchema.safeParse(form(overrides));

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

describe("invoiceFormSchema", () => {
  test("jatuh tempo sebelum tanggal faktur ditolak di field jatuh tempo", () => {
    expect(issuesOf({ dueDate: "2026-03-01" })).toEqual(["dueDate"]);
  });

  test("jatuh tempo sama dengan tanggal faktur lolos", () => {
    expect(issuesOf({ dueDate: "2026-03-05" })).toEqual([]);
  });

  test("total nol atau kurang ditolak", () => {
    expect(issuesOf({ totalForeignCurrency: "0" })).toEqual([
      "totalForeignCurrency",
    ]);
  });
});

describe("toInvoicePayload", () => {
  /**
   * Picker kosong dikirim sebagai NULL, bukan dihilangkan. Server membedakan
   * null (kosongkan) dari field yang tidak dikirim (biarkan apa adanya) --
   * dihilangkan, akun yang dikosongkan tidak akan pernah terkosongkan.
   */
  test("pesanan dan akun kosong jadi null, bukan field yang hilang", () => {
    const payload = toInvoicePayload(form());

    expect(payload).toMatchObject({
      purchaseOrderId: null,
      expenseAccountId: null,
    });
    expect("expenseAccountId" in payload).toBe(true);
  });

  test("picker terisi jadi angka", () => {
    expect(
      toInvoicePayload(form({ purchaseOrderId: "7", expenseAccountId: "24" })),
    ).toMatchObject({ purchaseOrderId: 7, expenseAccountId: 24 });
  });

  /**
   * Akun header dan rincian tidak boleh terisi bersamaan -- server menolaknya.
   * Layarnya menyembunyikan field itu begitu ada rincian, jadi yang terkirim
   * bukan pilihan yang dibuang diam-diam.
   */
  test("akun header dikosongkan saat ada rincian", () => {
    const payload = toInvoicePayload(
      form({ expenseAccountId: "24", items: [item()] }),
    );

    expect(payload.expenseAccountId).toBeNull();
    expect(payload.items).toEqual([
      {
        name: "Kendaraan operasional",
        amountForeign: 1000000,
        accountId: 61,
        purchaseOrderItemId: null,
      },
    ]);
  });

  test("baris pesanan terisi jadi angka", () => {
    expect(
      toInvoicePayload(form({ items: [item({ purchaseOrderItemId: "101" })] }))
        .items[0],
    ).toMatchObject({ purchaseOrderItemId: 101 });
  });
});

describe("rincian faktur", () => {
  test("jumlah rincian yang sama dengan total lolos", () => {
    expect(
      issuesOf({
        totalForeignCurrency: "1000000",
        items: [
          item({ amountForeign: "900000" }),
          item({ amountForeign: "100000" }),
        ],
      }),
    ).toEqual([]);
  });

  test("jumlah rincian yang tidak sama dengan total ditolak di rincian", () => {
    expect(
      issuesOf({
        totalForeignCurrency: "1000000",
        items: [item({ amountForeign: "900000" })],
      }),
    ).toEqual(["items"]);
  });

  test("nominal rincian nol atau kurang ditolak", () => {
    expect(
      issuesOf({
        totalForeignCurrency: "1000000",
        items: [item({ amountForeign: "0" })],
      }),
    ).toContain("items.0.amountForeign");
  });

  /**
   * Empat desimal, bukan sen: nominal rincian boleh pecahan mata uang asing,
   * dan menjumlahkannya dalam sen akan menolak faktur yang sebenarnya pas.
   */
  test("menjumlahkan empat desimal tanpa lewat float", () => {
    expect(
      issuesOf({
        totalForeignCurrency: "300.0003",
        items: [
          item({ amountForeign: "100.0001" }),
          item({ amountForeign: "100.0001" }),
          item({ amountForeign: "100.0001" }),
        ],
      }),
    ).toEqual([]);
  });

  test("ringkasan jumlah rincian memangkas nol di belakang", () => {
    expect(itemsSumText([item({ amountForeign: "100.5000" })])).toBe("100.5");
    expect(itemsSumText([item({ amountForeign: "100" })])).toBe("100");
    expect(itemsSumText([])).toBe("0");
  });
});

describe("outstandingOf", () => {
  /**
   * Dihitung dalam SEN, tidak pernah lewat float: pada nominal besar sisa nol
   * akan terbaca sebagai angka kecil positif, dan tombol Catat pembayaran
   * tidak pernah hilang untuk faktur yang sudah lunas.
   */
  test("lunas penuh menyisakan nol", () => {
    expect(
      outstandingOf({ totalIDR: "12000000.00", paidAmountIDR: "12000000.00" }),
    ).toBe("0");
  });

  test("dibayar sebagian menyisakan selisihnya", () => {
    expect(
      outstandingOf({ totalIDR: "12000000.00", paidAmountIDR: "4000000.00" }),
    ).toBe("8000000");
  });

  test("tidak pernah negatif walau pembayaran melebihi tagihan", () => {
    expect(outstandingOf({ totalIDR: "100.00", paidAmountIDR: "250.00" })).toBe(
      "0",
    );
  });

  test("menjaga sen, bukan membulatkannya", () => {
    expect(outstandingOf({ totalIDR: "100.75", paidAmountIDR: "50.25" })).toBe(
      "50.50",
    );
  });
});

describe("isRetractable", () => {
  // Server menolak batal dan hapus begitu ada pembayaran. Layar yang
  // menawarkannya hanya mengajari orang bahwa tombolnya kadang tak berarti.
  test("faktur tanpa pembayaran masih bisa ditarik kembali", () => {
    expect(isRetractable({ payments: [] })).toBe(true);
  });

  test("faktur yang sudah ada pembayarannya tidak bisa", () => {
    expect(isRetractable({ payments: [{}] })).toBe(false);
  });
});

describe("toPaymentPayload", () => {
  test("teks kosong dikirim sebagai null, bukan string kosong", () => {
    expect(
      toPaymentPayload({
        paymentDate: "2026-03-20",
        amountIDR: "4000000",
        accountId: "4",
        method: "",
        reference: "  ",
        note: "",
      }),
    ).toEqual({
      paymentDate: "2026-03-20",
      amountIDR: 4000000,
      accountId: 4,
      method: null,
      reference: null,
      note: null,
    });
  });
});

describe("orderItemsToForm", () => {
  const line = (overrides: Partial<OrderItemOption> = {}): OrderItemOption => ({
    id: 101,
    name: "Proyektor Epson EB-X51",
    quantity: 2,
    unitPrice: "8500000",
    amount: "17000000",
    typeName: "Elektronik",
    suggestedAccountId: 8,
    ...overrides,
  });

  test("menyalin nama, nominal, akun saran, dan tautan barisnya", () => {
    expect(orderItemsToForm([line()])).toEqual([
      {
        name: "Proyektor Epson EB-X51",
        amountForeign: "17000000",
        accountId: "8",
        purchaseOrderItemId: "101",
      },
    ]);
  });

  /**
   * Tipe barang yang belum punya akun tidak ditebak: menebak atas nama
   * bendahara akan membebankan kendaraan ke alat tulis tanpa ada yang memilih.
   */
  test("akun kosong bila tipe barangnya belum punya akun", () => {
    expect(
      orderItemsToForm([line({ suggestedAccountId: null })])[0],
    ).toMatchObject({ accountId: "" });
  });

  test("nominal baris adalah total barisnya, bukan harga satuannya", () => {
    expect(
      orderItemsToForm([
        line({ quantity: 3, unitPrice: "100", amount: "300" }),
      ])[0]?.amountForeign,
    ).toBe("300");
  });
});
