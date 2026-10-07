import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { SkillMusik, SkillMusikPayload } from "./types";

export const SKILL_MUSIK_LIST_PATH = menuHref(MENU.PELAYANAN, MENU.SKILL_MUSIK);

export const skillMusikFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, { error: "Isi nama alat musik, mis. Gitar.", abort: true })
        .min(2, "Nama alat musik minimal 2 karakter.")
        .max(50, "Nama alat musik maksimal 50 karakter."),
    ),
});

export type SkillMusikFormValues = z.infer<typeof skillMusikFormSchema>;

export const EMPTY_SKILL_MUSIK_FORM: SkillMusikFormValues = { name: "" };

export const toSkillMusikPayload = (
  values: SkillMusikFormValues,
): SkillMusikPayload => ({ name: collapseSpaces(values.name) });

export const toSkillMusikForm = (
  skillMusik: SkillMusik,
): SkillMusikFormValues => ({ name: skillMusik.name });

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof SkillMusikFormValues, string?]
> = [
  [
    /skill musik sudah tersedia/i,
    "name",
    "Alat musik dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof SkillMusikFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
