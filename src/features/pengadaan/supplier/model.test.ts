import { describe, expect, test } from "bun:test";

import {
  EMPTY_SUPPLIER_FORM,
  bankAccountOf,
  digitsOf,
  serverFieldError,
  supplierFormSchema,
  supplierMetaOf,
  supplierOrdersHref,
  toSupplierPayload,
  type SupplierFormValues,
} from "./model";

const VALID: SupplierFormValues = {
  ...EMPTY_SUPPLIER_FORM,
  name: "Toko Buku Agape",
  phone: "081396207781",
};

const messagesOf = (values: Partial<SupplierFormValues>) => {
  const result = supplierFormSchema.safeParse({ ...VALID, ...values });

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("skema supplier", () => {
  test("nama wajib, spasi dilebur tanpa mengubah huruf, maks. 150", () => {
    expect(messagesOf({ name: "   " })).toEqual({
      name: "Nama supplier wajib diisi",
    });
    expect(messagesOf({ name: "x".repeat(151) })).toEqual({
      name: "Nama supplier maksimal 150 karakter",
    });
    expect(
      supplierFormSchema.parse({ ...VALID, name: "  toko   ABC " }).name,
    ).toBe("toko ABC");
  });

  test("telepon wajib, angka saja, maks. 15", () => {
    expect(messagesOf({ phone: "" })).toEqual({
      phone: "No telepon wajib diisi",
    });
    expect(messagesOf({ phone: "0812-3456" })).toEqual({
      phone: "No telepon hanya boleh berisi angka",
    });
    expect(messagesOf({ phone: "1".repeat(16) })).toEqual({
      phone: "No telepon maksimal 15 angka",
    });
  });

  test("email opsional tetapi berbentuk", () => {
    expect(messagesOf({ email: "" })).toEqual({});
    expect(messagesOf({ email: "toko@contoh" })).toEqual({});
    expect(messagesOf({ email: "bukan email" })).toEqual({
      email: "Tulis email yang benar, mis. toko@contoh.com",
    });
  });

  test("batas panjang field opsional", () => {
    expect(
      messagesOf({
        contactPerson: "x".repeat(101),
        address: "x".repeat(251),
        npwp: "x".repeat(26),
        bankName: "x".repeat(51),
        bankAccountNumber: "1".repeat(31),
        bankAccountName: "x".repeat(101),
      }),
    ).toEqual({
      contactPerson: "Nama kontak maksimal 100 karakter",
      address: "Alamat maksimal 250 karakter",
      npwp: "NPWP maksimal 25 karakter",
      bankName: "Nama bank maksimal 50 karakter",
      bankAccountNumber: "No rekening maksimal 30 angka",
      bankAccountName: "Nama pemilik rekening maksimal 100 karakter",
    });
  });
});

test("payload: kosong jadi null, nama dilebur, status boolean", () => {
  expect(
    toSupplierPayload({
      ...VALID,
      name: " Toko  Buku ",
      contactPerson: "  ",
      isActive: "false",
    }),
  ).toEqual({
    name: "Toko Buku",
    contactPerson: null,
    phone: "081396207781",
    email: null,
    address: null,
    npwp: null,
    bankName: null,
    bankAccountNumber: null,
    bankAccountName: null,
    isActive: false,
  });
});

test("angka telepon dan rekening mempertahankan nol depan", () => {
  expect(digitsOf("0812-3456 78", 15)).toBe("0812345678");
  expect(digitsOf("0".repeat(40), 30)).toHaveLength(30);
});

test("409 be-sada dan 404 lama 'Sudah Tersedia' jatuh ke field nama", () => {
  expect(serverFieldError("Supplier Sudah Tersedia")).toEqual({
    field: "name",
    message: "Supplier dengan nama ini sudah ada. Pakai nama lain.",
  });
  expect(serverFieldError("Kesalahan server.")).toBeNull();
});

test("meta, rekening, dan tautan pesanan", () => {
  expect(supplierMetaOf({ contactPerson: "Ibu Maria", phone: "0812" })).toBe(
    "Ibu Maria · 0812",
  );
  expect(supplierMetaOf({ contactPerson: null, phone: "0812" })).toBe("0812");
  expect(
    bankAccountOf({
      bankName: "BRI",
      bankAccountNumber: "0123",
      bankAccountName: "Maria",
    }),
  ).toBe("BRI · 0123 a.n. Maria");
  expect(
    bankAccountOf({
      bankName: null,
      bankAccountNumber: null,
      bankAccountName: null,
    }),
  ).toBe("");
  expect(supplierOrdersHref(5)).toBe("/pengadaan/pesanan-pembelian?supplier=5");
});
