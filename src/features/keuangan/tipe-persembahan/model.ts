import { z } from "zod";

import { MENU, createHref, editHref, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { OfferingType, OfferingTypePayload } from "./types";

export const TIPE_PERSEMBAHAN_LIST_PATH = menuHref(
  MENU.KEUANGAN,
  MENU.TIPE_PERSEMBAHAN,
);

export const TIPE_PERSEMBAHAN_CREATE_PATH = createHref(
  MENU.KEUANGAN,
  MENU.TIPE_PERSEMBAHAN,
);

export const AKUN_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.AKUN);

export const offeringTypeEditHref = (code: string) =>
  editHref(MENU.KEUANGAN, MENU.TIPE_PERSEMBAHAN, code);

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Tipe Persembahan.";

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "true",
  nonaktif: "false",
};

export const accountLabelOf = (offeringType: OfferingType) =>
  offeringType.account
    ? `${offeringType.account.code} — ${offeringType.account.name}`
    : null;

export type AccountIssue = {
  label: string;
  variant: "warning" | "destructive";
};

export const accountIssueOf = (
  offeringType: OfferingType,
): AccountIssue | null => {
  const { account } = offeringType;

  if (!account) return { label: "Belum ada akun", variant: "warning" };

  if (!account.isActive) {
    return { label: "Akun nonaktif", variant: "destructive" };
  }

  if (account.type !== "INCOME") {
    return { label: "Bukan akun pendapatan", variant: "destructive" };
  }

  return null;
};

export const offeringTypeDeleteText =
  "Apakah Anda ingin menghapus tipe persembahan ini? Tipe yang pernah dipakai sebaiknya dinonaktifkan saja.";

export const offeringTypeFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(4, "Isi nama tipe, minimal 4 karakter")
        .max(50, "Nama tipe maksimal 50 karakter"),
    ),
  accountId: z.string(),
  hasPeriod: z.enum(["true", "false"]),
  requiresJemaat: z.enum(["true", "false"]),
  isActive: z.enum(["true", "false"]),
});

export type OfferingTypeFormValues = z.infer<typeof offeringTypeFormSchema>;

export const EMPTY_OFFERING_TYPE_FORM: OfferingTypeFormValues = {
  name: "",
  accountId: "",
  hasPeriod: "false",
  requiresJemaat: "false",
  isActive: "true",
};

export const toOfferingTypePayload = (
  values: OfferingTypeFormValues,
): OfferingTypePayload => ({
  name: collapseSpaces(values.name),
  accountId: values.accountId ? Number(values.accountId) : null,
  hasPeriod: values.hasPeriod === "true",
  requiresJemaat: values.requiresJemaat === "true",
  isActive: values.isActive === "true",
});

export const toOfferingTypeForm = (
  offeringType: OfferingType,
): OfferingTypeFormValues => ({
  name: offeringType.name,
  accountId: offeringType.accountId ? String(offeringType.accountId) : "",
  hasPeriod: offeringType.hasPeriod ? "true" : "false",
  requiresJemaat: offeringType.requiresJemaat ? "true" : "false",
  isActive: offeringType.isActive ? "true" : "false",
});

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof OfferingTypeFormValues, string?]
> = [
  [
    /tipe persembahan sudah tersedia/i,
    "name",
    "Nama ini sudah dipakai tipe persembahan lain",
  ],
  [/akun tidak ditemukan/i, "accountId", "Akun ini sudah tidak ada"],
  [/akun tidak aktif/i, "accountId"],
  [/akun harus bertipe pendapatan/i, "accountId"],
];

export function serverFieldError(
  message: string,
): { field: keyof OfferingTypeFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}
