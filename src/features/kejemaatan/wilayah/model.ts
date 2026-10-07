import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { Wilayah, WilayahPayload } from "./types";

export const WILAYAH_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.WILAYAH);

export const wilayahFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Mohon lengkapi nama wilayah, mis. Wilayah I.")
    .max(50, "Nama wilayah maksimal 50 karakter"),
  isActive: z.enum(["true", "false"], "Mohon pilih status wilayah"),
});

export type WilayahFormValues = z.infer<typeof wilayahFormSchema>;

export const EMPTY_WILAYAH_FORM: WilayahFormValues = {
  name: "",
  isActive: "true",
};

export const toWilayahPayload = (
  values: WilayahFormValues,
): WilayahPayload => ({
  name: collapseSpaces(values.name),
  isActive: values.isActive === "true",
});

export const toWilayahForm = (wilayah: Wilayah): WilayahFormValues => ({
  name: wilayah.name,
  isActive: wilayah.isActive ? "true" : "false",
});

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "true",
  nonaktif: "false",
};

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof WilayahFormValues, string?]
> = [
  [/wilayah sudah tersedia/i, "name", "Nama ini sudah dipakai wilayah lain."],
];

export function serverFieldError(
  message: string,
): { field: keyof WilayahFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
