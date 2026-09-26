import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";

import {
  SACRAMENT_TYPE_LABEL,
  type RiwayatJemaat,
  type RiwayatJemaatPayload,
  type SacramentType,
} from "./types";

const SACRAMENT_TYPES = Object.keys(SACRAMENT_TYPE_LABEL) as [
  SacramentType,
  ...SacramentType[],
];

export const riwayatFormSchema = z.object({
  jemaatCode: z
    .string()
    .min(1, "Jemaat wajib dipilih; ketik namanya lalu pilih dari daftar."),
  type: z
    .enum(SACRAMENT_TYPES)
    .or(z.literal(""))
    .refine(Boolean, "Jenis riwayat wajib dipilih"),
  date: z.string().min(1, "Tanggal riwayat wajib diisi"),
  certificateNumber: z
    .string()
    .trim()
    .max(50, "Nomor surat maksimal 50 karakter"),
  place: z.string().trim().max(100, "Tempat maksimal 100 karakter"),
});

export type RiwayatFormValues = z.infer<typeof riwayatFormSchema>;

export const EMPTY_RIWAYAT_FORM: RiwayatFormValues = {
  jemaatCode: "",
  type: "",
  date: "",
  certificateNumber: "",
  place: "",
};

const emptyToNull = (value: string): string | null => value.trim() || null;

export const toDateInput = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : "";

export function toRiwayatPayload(
  values: RiwayatFormValues,
): RiwayatJemaatPayload {
  return {
    jemaatCode: values.jemaatCode,
    type: values.type as SacramentType,
    date: values.date,
    certificateNumber: emptyToNull(values.certificateNumber),
    place: emptyToNull(values.place),
  };
}

export function toRiwayatForm(detail: RiwayatJemaat): RiwayatFormValues {
  return {
    jemaatCode: detail.jemaat.code,
    type: detail.type,
    date: toDateInput(detail.date),
    certificateNumber: detail.certificateNumber ?? "",
    place: detail.place ?? "",
  };
}

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof RiwayatFormValues, (message: string) => string]
> = [
  [
    /^jemaat tidak ditemukan/i,
    "jemaatCode",
    () => "Jemaat tidak ditemukan; pilih ulang dari daftar.",
  ],
  [
    /sudah memiliki riwayat/i,
    "type",
    (message) =>
      `${message}. Pilih jenis lain, atau ubah riwayat yang sudah ada.`,
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof RiwayatFormValues; message: string } | null {
  for (const [pattern, field, toMessage] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: toMessage(message) };
  }

  return null;
}

export const RIWAYAT_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT);
