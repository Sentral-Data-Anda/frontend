import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { toDateInput } from "@/lib/date";
import { collapseSpaces } from "@/lib/name";
import { keepDigits } from "@/lib/number";
import { emptyToNull } from "@/lib/utils";
import {
  BLOOD_TYPES,
  GENDERS,
  isWritableSacrament,
  LAST_EDUCATION,
  type WritableSacramentType,
} from "@/types/jemaat";

import type {
  JemaatAdditional,
  JemaatAdditionalInput,
  JemaatDetail,
  JemaatPayload,
  RoleInFamily,
} from "./types";

export const STATUS_PERNIKAHAN = ["SM", "BM", "CM", "CH"] as const;
export const TYPE_JEMAAT = ["ANGGOTA", "SIMPATISAN"] as const;
export const STATUS_JEMAAT = ["AKTIF", "TIDAK_AKTIF"] as const;
export const ROLE_IN_FAMILY = ["SUAMI", "ISTRI", "ANAK"] as const;

// Tanpa NIKAH dan CERAI: pernikahan dicatat dari fitur Keluarga, dan backend
// menolak keduanya dari form ini. Lihat SACRAMENT_WRITABLE di types/jemaat.
export const SACRAMENT_TYPES = [
  "BAPTIS",
  "SIDI",
  "ATESTASI_MASUK",
  "ATESTASI_KELUAR",
  "MENINGGAL",
] as const;

const optionalEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z.enum(values).or(z.literal(""));

const additionalSchema = z.object({
  // Baris tersimpan membawa publicId-nya, supaya backend bisa men-diff per
  // baris alih-alih menghapus seluruh blok dan menulisnya ulang — yang dulu
  // membuat "siapa yang pertama memasukkan baptis ini" hilang setiap kali ada
  // yang memperbaiki nomor telepon.
  publicId: z.string().optional(),
  type: optionalEnum(SACRAMENT_TYPES),
  date: z.string(),
  certificateNumber: z.string().max(50, "Nomor surat maksimal 50 karakter"),
  place: z.string().max(100, "Tempat maksimal 100 karakter"),
});

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  gender: optionalEnum(GENDERS),
  birthPlace: z
    .string()
    .trim()
    .min(1, "Tempat lahir wajib diisi")
    .max(25, "Tempat lahir maksimal 25 karakter"),
  birthDate: z.string(),

  typeJemaat: optionalEnum(TYPE_JEMAAT),
  statusJemaat: optionalEnum(STATUS_JEMAAT),
  codeInduk: z.string().trim().max(50, "Kode induk maksimal 50 karakter"),
  zoneChurchId: z.string(),
  joinedAt: z.string(),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9]*$/, "Telepon hanya angka, mis. 081234567890.")
    .max(15, "Telepon maksimal 15 angka"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(150, "Email maksimal 150 karakter"),

  provincesCode: z.string(),
  regenciesCode: z.string(),
  districtsCode: z.string(),
  villagesCode: z.string(),
  address: z.string().trim().max(250, "Alamat maksimal 250 karakter"),

  keluargaId: z.string(),
  roleInFamily: optionalEnum(ROLE_IN_FAMILY),
  keluargaAsalId: z.string(),

  statusMarital: optionalEnum(STATUS_PERNIKAHAN),
  professionId: z.string(),
  ethnicGroupId: z.string(),
  lastEducation: optionalEnum(LAST_EDUCATION),
  bloodType: optionalEnum(BLOOD_TYPES),

  additional: z.array(additionalSchema),
});

const ALWAYS_REQUIRED = [
  ["gender", "Jenis kelamin wajib dipilih"],
  ["provincesCode", "Provinsi wajib dipilih"],
  ["regenciesCode", "Kabupaten/kota wajib dipilih, sesudah provinsi."],
  ["districtsCode", "Kecamatan wajib dipilih, sesudah kabupaten/kota."],
  ["villagesCode", "Kelurahan/desa wajib dipilih, sesudah kecamatan."],
  ["address", "Alamat wajib diisi, mis. Jl. Merdeka 10, RT 01 RW 02."],
  [
    "typeJemaat",
    "Pilih tipe jemaat; Anggota butuh kode induk dan data sosial.",
  ],
  ["statusJemaat", "Status jemaat wajib dipilih"],
] as const;

const MEMBER_REQUIRED = [
  ["codeInduk", "Kode induk wajib untuk Anggota; juga jadi username akun."],
  ["statusMarital", "Status pernikahan wajib dipilih untuk Anggota"],
  ["ethnicGroupId", "Suku wajib dipilih untuk Anggota"],
] as const;

export const jemaatFormSchema = baseSchema.superRefine((values, ctx) => {
  const addIssue = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  for (const [field, message] of ALWAYS_REQUIRED) {
    if (!values[field]) addIssue(field, message);
  }

  if (values.typeJemaat === "ANGGOTA") {
    for (const [field, message] of MEMBER_REQUIRED) {
      if (!values[field]) addIssue(field, message);
    }
    if (!values.keluargaId && !values.zoneChurchId) {
      addIssue(
        "zoneChurchId",
        "Wilayah wajib dipilih untuk Anggota yang belum masuk keluarga",
      );
    }
  }

  if (values.email && !values.email.includes("@")) {
    addIssue("email", "Email harus memuat @");
  }

  if (values.keluargaId && !values.roleInFamily) {
    addIssue("roleInFamily", "Peran dalam keluarga wajib dipilih");
  }
  if (!values.keluargaId && values.roleInFamily) {
    addIssue("keluargaId", "Pilih keluarganya dulu, atau kosongkan peran.");
  }

  values.additional.forEach((row, index) => {
    if (!row.type) {
      ctx.addIssue({
        code: "custom",
        path: ["additional", index, "type"],
        message: "Jenis riwayat wajib dipilih",
      });
    }
    if (!row.date) {
      ctx.addIssue({
        code: "custom",
        path: ["additional", index, "date"],
        message: "Tanggal riwayat wajib diisi",
      });
    }
  });
});

export type JemaatFormValues = z.infer<typeof baseSchema> & { id?: number };

export const EMPTY_JEMAAT_FORM: JemaatFormValues = {
  id: 0,
  name: "",
  gender: "",
  birthPlace: "",
  birthDate: "",
  typeJemaat: "",
  statusJemaat: "AKTIF",
  codeInduk: "",
  zoneChurchId: "",
  joinedAt: "",
  phone: "",
  email: "",
  provincesCode: "",
  regenciesCode: "",
  districtsCode: "",
  villagesCode: "",
  address: "",
  keluargaId: "",
  roleInFamily: "",
  keluargaAsalId: "",
  statusMarital: "",
  professionId: "",
  ethnicGroupId: "",
  lastEducation: "",
  bloodType: "",
  additional: [],
};

const idToNumber = (value: string): number | null =>
  value.trim() ? Number(value) : null;

export const normalizePhone = (value: string): string =>
  keepDigits(value.replace(/^\+?62/, "0"), 15);

export function toJemaatPayload(values: JemaatFormValues): JemaatPayload {
  const payload: JemaatPayload = {
    name: values.name.trim(),
    gender: values.gender as "L" | "P",
    birthPlace: values.birthPlace.trim(),
    birthDate: emptyToNull(values.birthDate),
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    bloodType: values.bloodType || null,
    lastEducation: values.lastEducation || null,
    statusMarital: values.statusMarital || null,
    professionId: idToNumber(values.professionId),
    ethnicGroupId: idToNumber(values.ethnicGroupId),
    zoneChurchId: idToNumber(values.zoneChurchId),
    codeInduk: emptyToNull(values.codeInduk),
    provincesCode: values.provincesCode,
    regenciesCode: values.regenciesCode,
    districtsCode: values.districtsCode,
    villagesCode: values.villagesCode,
    address: values.address.trim(),
    typeJemaat: values.typeJemaat as "ANGGOTA" | "SIMPATISAN",
    statusJemaat: values.statusJemaat as "AKTIF" | "TIDAK_AKTIF",
    keluargaId: idToNumber(values.keluargaId),
    roleInFamily: (values.roleInFamily || null) as RoleInFamily | null,
    keluargaAsalId: idToNumber(values.keluargaAsalId),
    joinedAt: emptyToNull(values.joinedAt),
    // Sent on create and on edit alike. The backend diffs it per row: a row
    // with a publicId is the stored one, a row without is new, and a stored row
    // missing from here is the one the clerk removed.
    //
    // Marriage rows are NOT here. They are written by the Keluarga feature and
    // shown read-only, so they never make the round trip — which is also what
    // stops an ordinary edit from ending somebody's marriage.
    additional: values.additional.map((row) => ({
      ...(row.publicId ? { publicId: row.publicId } : {}),
      type: row.type as JemaatAdditionalInput["type"],
      date: row.date,
      certificateNumber: emptyToNull(row.certificateNumber),
      place: emptyToNull(row.place),
    })),
  };

  return payload;
}

/**
 * A guard on the ROW, not on the type: `isWritableSacrament` narrows
 * `row.type`, which TypeScript cannot carry back to `row` through a `.filter`.
 */
const isWritableRow = (
  row: JemaatAdditional,
): row is JemaatAdditional & { type: WritableSacramentType } =>
  isWritableSacrament(row.type);

export function toJemaatForm(detail: JemaatDetail): JemaatFormValues {
  return {
    id: detail.id,
    name: detail.name,
    gender: detail.gender,
    birthPlace: detail.birthPlace,
    birthDate: toDateInput(detail.birthDate),
    typeJemaat: detail.typeJemaat,
    statusJemaat: detail.statusJemaat,
    codeInduk: detail.codeInduk ?? "",
    zoneChurchId: detail.zoneChurchId?.toString() ?? "",
    joinedAt: toDateInput(detail.joinedAt),
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    provincesCode: detail.provincesCode,
    regenciesCode: detail.regenciesCode,
    districtsCode: detail.districtsCode,
    villagesCode: detail.villagesCode,
    address: detail.address,
    keluargaId: detail.keluargaId?.toString() ?? "",
    roleInFamily: detail.roleInFamily ?? "",
    keluargaAsalId: detail.keluargaAsalId?.toString() ?? "",
    statusMarital: detail.statusMarital ?? "",
    professionId: detail.professionId?.toString() ?? "",
    ethnicGroupId: detail.ethnicGroupId?.toString() ?? "",
    lastEducation: (detail.lastEducation ??
      "") as JemaatFormValues["lastEducation"],
    bloodType: detail.bloodType ?? "",
    // Hanya baris yang form ini boleh menulis. Baris NIKAH ikut datang dari
    // detail — ia ditampilkan terpisah dan read-only, dan memasukkannya ke
    // array yang bisa diedit akan membuatnya dikirim balik lalu ditolak
    // backend.
    additional: (detail.additional ?? []).filter(isWritableRow).map((row) => ({
      publicId: row.publicId,
      type: row.type,
      date: toDateInput(row.date),
      certificateNumber: row.certificateNumber ?? "",
      place: row.place ?? "",
    })),
  };
}

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof JemaatFormValues, string?]
> = [
  [/email sudah tersedia/i, "email"],
  [
    /kode induk sudah tersedia/i,
    "codeInduk",
    "Kode induk sudah dipakai jemaat lain; juga jadi username.",
  ],
  [
    /keluarga asal tidak ditemukan/i,
    "keluargaAsalId",
    "Keluarga asal tidak ditemukan; pilih ulang dari daftar.",
  ],
  [/keluarga tidak ditemukan/i, "keluargaId"],
  [
    /one_head|kepala keluarga/i,
    "roleInFamily",
    "Keluarga ini sudah punya kepala keluarga. Pilih peran lain atau ubah kepala keluarga lewat layar Keluarga.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof JemaatFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}

export function incompleteFields(values: {
  birthDate?: string;
  lastEducation?: string;
  professionId?: string;
  phone?: string;
  bloodType?: string;
}): string[] {
  const missing: string[] = [];

  if (!values.birthDate) missing.push("tanggal lahir");
  if (!values.lastEducation) missing.push("pendidikan terakhir");
  if (!values.professionId) missing.push("pekerjaan");
  if (!values.phone) missing.push("telepon");
  if (!values.bloodType) missing.push("golongan darah");

  return missing;
}

export const JEMAAT_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT);

const nameKeyOf = (name: string) => collapseSpaces(name).toLowerCase();

export function findDuplicate(
  rows: readonly { code: string; name: string; birthDate: string | null }[],
  values: { name: string; birthDate: string },
  ownCode?: string,
) {
  if (!values.name.trim() || !values.birthDate) return null;

  return (
    rows.find(
      (row) =>
        row.code !== ownCode &&
        nameKeyOf(row.name) === nameKeyOf(values.name) &&
        toDateInput(row.birthDate) === values.birthDate,
    ) ?? null
  );
}
