import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { Satuan, SatuanPayload } from "./types";

export const SATUAN_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.SATUAN);

export const satuanFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, "Isi nama satuan")
        .max(30, "Nama satuan maksimal 30 karakter"),
    ),
});

export type SatuanFormValues = z.infer<typeof satuanFormSchema>;

export const EMPTY_SATUAN_FORM: SatuanFormValues = { name: "" };

export const toSatuanPayload = (values: SatuanFormValues): SatuanPayload => ({
  name: collapseSpaces(values.name),
});

export const toSatuanForm = (satuan: Satuan): SatuanFormValues => ({
  name: satuan.name,
});

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof SatuanFormValues, string?]
> = [
  [
    /satuan sudah tersedia/i,
    "name",
    "Satuan dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof SatuanFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
