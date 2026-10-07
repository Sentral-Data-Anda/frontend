import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { RolePelayan, RolePelayanPayload } from "./types";

export const ROLE_PELAYAN_LIST_PATH = menuHref(
  MENU.PELAYANAN,
  MENU.ROLE_PELAYAN,
);

export const isPemusikRole = (name: string | undefined) =>
  name?.trim().toLowerCase() === "pemusik";

export const rolePelayanFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, { error: "Isi nama tugas, mis. Liturgis.", abort: true })
        .min(2, "Nama tugas minimal 2 karakter.")
        .max(50, "Nama tugas maksimal 50 karakter."),
    ),
});

export type RolePelayanFormValues = z.infer<typeof rolePelayanFormSchema>;

export const EMPTY_ROLE_PELAYAN_FORM: RolePelayanFormValues = { name: "" };

export const toRolePelayanPayload = (
  values: RolePelayanFormValues,
): RolePelayanPayload => ({ name: collapseSpaces(values.name) });

export const toRolePelayanForm = (
  rolePelayan: RolePelayan,
): RolePelayanFormValues => ({ name: rolePelayan.name });

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof RolePelayanFormValues, string?]
> = [
  [
    /role pelayan sudah tersedia/i,
    "name",
    "Tugas dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof RolePelayanFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
