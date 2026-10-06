import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { formatDays } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";

import type { TipeCuti, TipeCutiPayload } from "./types";

export const TIPE_CUTI_LIST_PATH = menuHref(MENU.SDM, MENU.TIPE_CUTI);

// Lebar isian, bukan aturan: be-sada hanya menuntut bilangan bulat > 0, dan
// batas jatah adalah kebijakan gereja — bukan angka yang SADA karang (§0.2).
export const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, 3);

export const tipeCutiFormSchema = z
  .object({
    name: z
      .string()
      .transform(collapseSpaces)
      .pipe(
        z
          .string()
          .min(1, "Isi nama tipe cuti, mis. Cuti Tahunan")
          .max(50, "Nama tipe cuti maksimal 50 karakter"),
      ),
    isUnlimited: z.enum(["true", "false"]),
    maxDaysPerYear: z.string(),
    isPaid: z.enum(["true", "false"]),
    isActive: z.enum(["true", "false"]),
  })
  .superRefine((values, context) => {
    if (values.isUnlimited === "true") return;

    if (
      !/^\d+$/.test(values.maxDaysPerYear) ||
      Number(values.maxDaysPerYear) < 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxDaysPerYear"],
        message: "Isi jatah minimal 1 hari, atau pilih Tanpa batas",
      });
    }
  });

export type TipeCutiFormValues = z.infer<typeof tipeCutiFormSchema>;

export const EMPTY_TIPE_CUTI_FORM: TipeCutiFormValues = {
  name: "",
  isUnlimited: "false",
  maxDaysPerYear: "",
  isPaid: "true",
  isActive: "true",
};

export const toTipeCutiPayload = (
  values: TipeCutiFormValues,
): TipeCutiPayload => ({
  name: collapseSpaces(values.name),
  maxDaysPerYear:
    values.isUnlimited === "true" ? null : Number(values.maxDaysPerYear),
  isPaid: values.isPaid === "true",
  isActive: values.isActive === "true",
});

export const toTipeCutiForm = (row: TipeCuti): TipeCutiFormValues => ({
  name: row.name,
  isUnlimited: row.maxDaysPerYear === null ? "true" : "false",
  maxDaysPerYear: row.maxDaysPerYear === null ? "" : String(row.maxDaysPerYear),
  isPaid: row.isPaid ? "true" : "false",
  isActive: row.isActive ? "true" : "false",
});

// `null` = tanpa batas, bukan data hilang: "—" membacanya sebagai kosong.
export const quotaTextOf = (maxDaysPerYear: number | null) =>
  maxDaysPerYear === null ? "Tanpa batas" : formatDays(maxDaysPerYear);

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof TipeCutiFormValues, string?]
> = [
  [
    /tipe cuti sudah tersedia/i,
    "name",
    "Tipe cuti dengan nama ini sudah ada. Pakai nama lain.",
  ],
  [/nama tipe cuti/i, "name"],
  [/jatah hari per tahun/i, "maxDaysPerYear"],
];

export function serverFieldError(
  message: string,
): { field: keyof TipeCutiFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}
