import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";

import type { Keluarga, KeluargaPayload } from "./types";

export const KELUARGA_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.KELUARGA);

export const WORSHIPS_HERE_LABEL = { true: "Ya", false: "Tidak" } as const;

const required = (message: string) => z.string().trim().min(1, message);

export const keluargaFormSchema = z.object({
  name: required("Nama keluarga wajib diisi, mis. Keluarga Sitompul.").max(
    100,
    "Nama keluarga maksimal 100 karakter",
  ),
  zoneChurchId: z.string(),
  worshipsHere: z.enum(["true", "false"]),
  provincesCode: required("Provinsi wajib dipilih"),
  regenciesCode: required("Kabupaten/kota wajib dipilih, sesudah provinsi."),
  districtsCode: required("Kecamatan wajib dipilih, sesudah kabupaten/kota."),
  villagesCode: required("Kelurahan/desa wajib dipilih, sesudah kecamatan."),
  address: required(
    "Alamat wajib diisi, mis. Jl. Merdeka 10, RT 01 RW 02.",
  ).max(250, "Alamat maksimal 250 karakter"),
});

export type KeluargaFormValues = z.infer<typeof keluargaFormSchema>;

export const EMPTY_KELUARGA_FORM: KeluargaFormValues = {
  name: "",
  zoneChurchId: "",
  worshipsHere: "true",
  provincesCode: "",
  regenciesCode: "",
  districtsCode: "",
  villagesCode: "",
  address: "",
};

export function toKeluargaPayload(values: KeluargaFormValues): KeluargaPayload {
  return {
    name: values.name.trim(),
    provincesCode: values.provincesCode,
    regenciesCode: values.regenciesCode,
    districtsCode: values.districtsCode,
    villagesCode: values.villagesCode,
    address: values.address.trim(),
    zoneChurchId: values.zoneChurchId ? Number(values.zoneChurchId) : null,
    worshipsHere: values.worshipsHere === "true",
  };
}

export function toKeluargaForm(detail: Keluarga): KeluargaFormValues {
  return {
    name: detail.name,
    zoneChurchId: detail.zoneChurchId?.toString() ?? "",
    worshipsHere: detail.worshipsHere ? "true" : "false",
    provincesCode: detail.provincesCode,
    regenciesCode: detail.regenciesCode,
    districtsCode: detail.districtsCode,
    villagesCode: detail.villagesCode,
    address: detail.address,
  };
}

export function serverFieldError(
  message: string,
): { field: keyof KeluargaFormValues; message: string } | null {
  return /wilayah gereja tidak ditemukan/i.test(message)
    ? {
        field: "zoneChurchId",
        message: "Wilayah ini sudah tidak ada; pilih ulang dari daftar.",
      }
    : null;
}
