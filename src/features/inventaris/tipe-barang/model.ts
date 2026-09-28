import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { normalizeName } from "@/lib/name";

import type { TipeBarang, TipeBarangPayload } from "./types";

export const TIPE_BARANG_LIST_PATH = menuHref(
  MENU.INVENTARIS,
  MENU.TIPE_BARANG,
);

const NAME_ERROR = "Isi nama tipe, minimal 2 karakter";

export const tipeBarangFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(
      z.string().min(2, NAME_ERROR).max(50, "Nama tipe maksimal 50 karakter"),
    ),
});

export type TipeBarangFormValues = z.infer<typeof tipeBarangFormSchema>;

export const EMPTY_TIPE_BARANG_FORM: TipeBarangFormValues = { name: "" };

export const toTipeBarangPayload = (
  values: TipeBarangFormValues,
): TipeBarangPayload => ({ name: normalizeName(values.name) });

export const toTipeBarangForm = (
  tipeBarang: TipeBarang,
): TipeBarangFormValues => ({ name: tipeBarang.name });

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof TipeBarangFormValues, string?]
> = [
  [
    /tipe barang sudah tersedia/i,
    "name",
    "Tipe dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof TipeBarangFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
