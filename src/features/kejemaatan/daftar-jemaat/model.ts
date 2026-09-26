import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { toDateInput } from "@/lib/date";
import { emptyToNull } from "@/lib/utils";

import type {
  JemaatAdditional,
  JemaatDetail,
  JemaatPayload,
  RoleInFamily,
} from "./types";

export const GENDERS = ["L", "P"] as const;
export const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;
export const STATUS_PERNIKAHAN = ["SM", "BM", "CM", "CH"] as const;
export const TYPE_JEMAAT = ["ANGGOTA", "SIMPATISAN"] as const;
export const STATUS_JEMAAT = ["AKTIF", "TIDAK_AKTIF"] as const;
export const ROLE_IN_FAMILY = ["KEPALA_KELUARGA", "PASANGAN", "ANAK"] as const;
export const SACRAMENT_TYPES = [
  "BAPTIS",
  "SIDI",
  "ATESTASI_MASUK",
  "ATESTASI_KELUAR",
  "MENINGGAL",
] as const;

export const LAST_EDUCATION = [
  "TIDAK_SEKOLAH",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
] as const;

const optionalEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z.enum(values).or(z.literal(""));

const additionalSchema = z.object({
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
    .max(12, "Telepon maksimal 12 angka"),
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

export type JemaatFormValues = z.infer<typeof baseSchema>;

export const EMPTY_JEMAAT_FORM: JemaatFormValues = {
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
  value
    .replace(/^\+?62/, "0")
    .replace(/\D/g, "")
    .slice(0, 12);

export function toJemaatPayload(
  values: JemaatFormValues,
  isEdit = false,
): JemaatPayload {
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
  };

  if (!isEdit) {
    payload.additional = values.additional.map((row) => ({
      type: row.type as JemaatAdditional["type"],
      date: row.date,
      certificateNumber: emptyToNull(row.certificateNumber),
      place: emptyToNull(row.place),
    }));
  }

  return payload;
}

export function toJemaatForm(detail: JemaatDetail): JemaatFormValues {
  return {
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
    additional: (detail.additional ?? []).map((row) => ({
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

const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

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
        normalizeName(row.name) === normalizeName(values.name) &&
        toDateInput(row.birthDate) === values.birthDate,
    ) ?? null
  );
}
