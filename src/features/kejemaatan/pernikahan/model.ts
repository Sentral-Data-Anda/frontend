import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { toDateInput } from "@/lib/date";
import { emptyToNull } from "@/lib/utils";

import type {
  EndMarriagePayload,
  EndReason,
  MarriageDetail,
  MarriagePayload,
} from "./types";

export const END_REASONS = ["CERAI_HIDUP", "CERAI_MATI"] as const;

const partyName = (label: string) =>
  z.string().trim().max(150, `Nama ${label} maksimal 150 karakter`);

const baseSchema = z.object({
  husbandJemaatCode: z.string(),
  husbandName: partyName("suami"),
  wifeJemaatCode: z.string(),
  wifeName: partyName("istri"),
  marriedAt: z.string(),
  marriedPlace: z.string().trim().max(100, "Tempat maksimal 100 karakter"),
  blessedHere: z.enum(["true", "false"]),
});

export type MarriageFormValues = z.infer<typeof baseSchema>;

type Side = "husband" | "wife";

const SIDE_LABEL: Record<Side, string> = { husband: "Suami", wife: "Istri" };

export const marriageFormSchema = baseSchema.superRefine((values, ctx) => {
  for (const side of ["husband", "wife"] as const) {
    const code = values[`${side}JemaatCode`];
    const name = values[`${side}Name`];
    const path = [`${side}JemaatCode`];

    if (code && name) {
      ctx.addIssue({
        code: "custom",
        path,
        message: `Isi salah satu saja untuk ${SIDE_LABEL[side]}: jemaat, atau nama`,
      });
    }
    if (!code && !name) {
      ctx.addIssue({
        code: "custom",
        path,
        message: `Mohon Lengkapi ${SIDE_LABEL[side]}`,
      });
    }
  }

  if (
    values.husbandJemaatCode &&
    values.husbandJemaatCode === values.wifeJemaatCode
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["wifeJemaatCode"],
      message: "Suami dan Istri tidak boleh jemaat yang sama",
    });
  }
});

export const EMPTY_MARRIAGE_FORM: MarriageFormValues = {
  husbandJemaatCode: "",
  husbandName: "",
  wifeJemaatCode: "",
  wifeName: "",
  marriedAt: "",
  marriedPlace: "",
  blessedHere: "false",
};

export function toMarriagePayload(values: MarriageFormValues): MarriagePayload {
  return {
    husbandJemaatCode: values.husbandJemaatCode || null,
    husbandName: emptyToNull(values.husbandName),
    wifeJemaatCode: values.wifeJemaatCode || null,
    wifeName: emptyToNull(values.wifeName),
    marriedAt: values.marriedAt || null,
    marriedPlace: emptyToNull(values.marriedPlace),
    blessedHere: values.blessedHere === "true",
  };
}

export function toMarriageForm(detail: MarriageDetail): MarriageFormValues {
  return {
    husbandJemaatCode: detail.husband.jemaatCode ?? "",
    husbandName: detail.husband.jemaatCode ? "" : detail.husband.name,
    wifeJemaatCode: detail.wife.jemaatCode ?? "",
    wifeName: detail.wife.jemaatCode ? "" : detail.wife.name,
    marriedAt: toDateInput(detail.marriedAt),
    marriedPlace: detail.marriedPlace ?? "",
    blessedHere: detail.blessedHere ? "true" : "false",
  };
}

type PartyField = "husbandJemaatCode" | "wifeJemaatCode";

export type JemaatPartyNames = Partial<Record<PartyField, string>>;

const pickLiveSide = (
  message: string,
  names: JemaatPartyNames,
): PartyField | undefined => {
  const sides = Object.entries(names) as [PartyField, string][];

  if (sides.length === 1) return sides[0][0];

  return sides.find(
    ([, name]) => name && message.startsWith(`${name} Masih Tercatat`),
  )?.[0];
};

export function serverFieldError(
  message: string,
  names: JemaatPartyNames,
): { field: PartyField; message: string } | null {
  if (/^suami tidak ditemukan/i.test(message)) {
    return {
      field: "husbandJemaatCode",
      message: "Jemaat suami tidak ditemukan; pilih ulang dari daftar.",
    };
  }
  if (/^istri tidak ditemukan/i.test(message)) {
    return {
      field: "wifeJemaatCode",
      message: "Jemaat istri tidak ditemukan; pilih ulang dari daftar.",
    };
  }
  if (/masih tercatat dalam pernikahan/i.test(message)) {
    const field = pickLiveSide(message, names);

    return field ? { field, message } : null;
  }

  return null;
}

export const endMarriageFormSchema = z.object({
  endedAt: z.string().min(1, "Tanggal berakhir wajib diisi"),
  endReason: z
    .enum(END_REASONS)
    .or(z.literal(""))
    .refine(Boolean, "Alasan berakhir wajib dipilih"),
  endNote: z.string().trim().max(250, "Catatan maksimal 250 karakter"),
});

export type EndMarriageFormValues = z.infer<typeof endMarriageFormSchema>;

export const EMPTY_END_FORM: EndMarriageFormValues = {
  endedAt: "",
  endReason: "",
  endNote: "",
};

export const toEndMarriagePayload = (
  values: EndMarriageFormValues,
): EndMarriagePayload => ({
  endedAt: values.endedAt,
  endReason: values.endReason as EndReason,
  endNote: emptyToNull(values.endNote),
});

export const coupleName = (marriage: MarriageDetail): string =>
  `${marriage.husband.name} & ${marriage.wife.name}`;

export const MARRIAGE_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN);
