import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { TipeIbadah, TipeIbadahPayload } from "./types";

export const TIPE_IBADAH_LIST_PATH = menuHref(
  MENU.PERIBADAHAN,
  MENU.TIPE_IBADAH,
);

export const tipeIbadahFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, "Isi nama tipe ibadah, mis. Ibadah Minggu.")
        .max(50, "Nama tipe ibadah maksimal 50 karakter."),
    ),
  isActive: z.enum(["true", "false"], "Mohon pilih status tipe ibadah"),
});

export type TipeIbadahFormValues = z.infer<typeof tipeIbadahFormSchema>;

export const EMPTY_TIPE_IBADAH_FORM: TipeIbadahFormValues = {
  name: "",
  isActive: "true",
};

export const toTipeIbadahPayload = (
  values: TipeIbadahFormValues,
): TipeIbadahPayload => ({
  name: collapseSpaces(values.name),
  isActive: values.isActive === "true",
});

export const toTipeIbadahForm = (
  tipeIbadah: TipeIbadah,
): TipeIbadahFormValues => ({
  name: tipeIbadah.name,
  isActive: tipeIbadah.isActive ? "true" : "false",
});

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "true",
  nonaktif: "false",
};

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof TipeIbadahFormValues, string?]
> = [
  [
    /tipe ibadah sudah tersedia/i,
    "name",
    "Tipe ibadah dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof TipeIbadahFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
