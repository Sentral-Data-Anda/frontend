import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { Supplier, SupplierPayload } from "./types";

export const SUPPLIER_LIST_PATH = menuHref(MENU.PENGADAAN, MENU.SUPPLIER);

export const SUPPLIER_CREATE_PATH = createHref(MENU.PENGADAAN, MENU.SUPPLIER);

export const supplierDetailHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.SUPPLIER, code);

export const supplierEditHref = (code: string) =>
  editHref(MENU.PENGADAAN, MENU.SUPPLIER, code);

export const supplierOrdersHref = (id: number) =>
  `${menuHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN)}?supplier=${id}`;

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "true",
  nonaktif: "false",
};

const optionalText = (max: number, message: string) =>
  z.string().refine((value) => value.trim().length <= max, message);

export const supplierFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, "Nama supplier wajib diisi")
        .max(150, "Nama supplier maksimal 150 karakter"),
    ),
  contactPerson: optionalText(100, "Nama kontak maksimal 100 karakter"),
  phone: z
    .string()
    .min(1, "No telepon wajib diisi")
    .max(15, "No telepon maksimal 15 angka")
    .regex(/^\d*$/, "No telepon hanya boleh berisi angka"),
  email: z
    .string()
    .trim()
    .max(150, "Email maksimal 150 karakter")
    .refine(
      (value) => value === "" || /^[^@\s]+@[^@\s]+$/.test(value),
      "Tulis email yang benar, mis. toko@contoh.com",
    ),
  address: optionalText(250, "Alamat maksimal 250 karakter"),
  npwp: optionalText(25, "NPWP maksimal 25 karakter"),
  bankName: optionalText(50, "Nama bank maksimal 50 karakter"),
  bankAccountNumber: z
    .string()
    .max(30, "No rekening maksimal 30 angka")
    .regex(/^\d*$/, "No rekening hanya boleh berisi angka"),
  bankAccountName: optionalText(
    100,
    "Nama pemilik rekening maksimal 100 karakter",
  ),
  isActive: z.enum(["true", "false"]),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  npwp: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  isActive: "true",
};

export const toSupplierForm = (supplier: Supplier): SupplierFormValues => ({
  name: supplier.name,
  contactPerson: supplier.contactPerson ?? "",
  phone: supplier.phone,
  email: supplier.email ?? "",
  address: supplier.address ?? "",
  npwp: supplier.npwp ?? "",
  bankName: supplier.bankName ?? "",
  bankAccountNumber: supplier.bankAccountNumber ?? "",
  bankAccountName: supplier.bankAccountName ?? "",
  isActive: supplier.isActive ? "true" : "false",
});

const orNull = (value: string) => value.trim() || null;

export const toSupplierPayload = (
  values: SupplierFormValues,
): SupplierPayload => ({
  name: collapseSpaces(values.name),
  contactPerson: orNull(values.contactPerson),
  phone: values.phone,
  email: orNull(values.email),
  address: orNull(values.address),
  npwp: orNull(values.npwp),
  bankName: orNull(values.bankName),
  bankAccountNumber: orNull(values.bankAccountNumber),
  bankAccountName: orNull(values.bankAccountName),
  isActive: values.isActive === "true",
});

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof SupplierFormValues, string?]
> = [
  [
    /supplier sudah tersedia/i,
    "name",
    "Supplier dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof SupplierFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

export const supplierMetaOf = (
  supplier: Pick<Supplier, "contactPerson" | "phone">,
) =>
  supplier.contactPerson
    ? `${supplier.contactPerson} · ${supplier.phone}`
    : supplier.phone;

export const bankAccountOf = (
  supplier: Pick<
    Supplier,
    "bankName" | "bankAccountNumber" | "bankAccountName"
  >,
) => {
  const account = [supplier.bankName, supplier.bankAccountNumber]
    .filter(Boolean)
    .join(" · ");

  if (!supplier.bankAccountName) return account;

  return account
    ? `${account} a.n. ${supplier.bankAccountName}`
    : `a.n. ${supplier.bankAccountName}`;
};
