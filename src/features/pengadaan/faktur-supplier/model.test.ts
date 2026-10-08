import { describe, expect, test } from "bun:test";

import {
  invoiceFormSchema,
  isRetractable,
  outstandingOf,
  toInvoicePayload,
  toPaymentPayload,
} from "./model";

const form = (overrides: Record<string, string> = {}) => ({
  supplierInvoiceNumber: "FK/2026/1",
  supplierId: "1",
  purchaseOrderId: "",
  expenseAccountId: "",
  invoiceDate: "2026-03-05",
  dueDate: "2026-03-20",
  currencyCode: "IDR",
  totalForeignCurrency: "1000000",
  ...overrides,
});

const issuesOf = (overrides: Record<string, string>) => {
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
