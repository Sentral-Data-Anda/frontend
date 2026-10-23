import { z } from "zod";

import { toDateInput } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";
import { keepDigits } from "@/lib/number";
import { changePasswordSchema } from "@/lib/password";
import { emptyToNull } from "@/lib/utils";
import { BLOOD_TYPES, GENDERS, LAST_EDUCATION } from "@/types/jemaat";

import type { MyProfile, MyProfilePayload, OfferingItem } from "./types";

export const passwordFormSchema = changePasswordSchema;

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, keyof PasswordFormValues]> = [
  [/password lama/i, "oldPassword"],
];

export function passwordFieldError(
  message: string,
): { field: keyof PasswordFormValues; message: string } | null {
  const match = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return match ? { field: match[1], message } : null;
}

export function summarizeOfferings(items: OfferingItem[]) {
  return {
    items,
    count: items.length,
    total: items.reduce((sum, item) => sum + Number(item.amount), 0),
  };
}

const periodFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const offeringMeta = (item: OfferingItem): string =>
  item.period
    ? `Periode ${periodFormat.format(new Date(`${item.period.slice(0, 7)}-01T00:00:00Z`))}`
    : `Diterima ${formatDate(item.receivedDate)}`;

export const roleLabels = (
  roles: { name: string; bapel: { name: string } | null }[] | undefined,
): string[] =>
  (roles ?? []).map((role) =>
    role.bapel ? `${role.name}, ${role.bapel.name}` : role.name,
  );

export const orDash = (value: string | null | undefined): string =>
  value?.trim() ? value : "—";

export const birthLabel = (
  place: string | null | undefined,
  date: string | null | undefined,
): string =>
  [place?.trim(), date ? formatDate(date) : null].filter(Boolean).join(", ") ||
  "—";

export const addressLabel = (
  profile: Pick<
    MyProfile,
    "address" | "villages" | "districts" | "regencies" | "provinces"
  >,
): string =>
  [
    profile.address?.trim(),
    profile.villages?.name,
    profile.districts?.name,
    profile.regencies?.name,
    profile.provinces?.name,
  ]
    .filter(Boolean)
    .join(", ") || "—";

const optionalEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z.enum(values).or(z.literal(""));

// Aturannya sama dengan form sekretariat. Yang keorganisasian dan status
// pernikahan tidak ada di sini; be-sada CODE_STYLE.md §29.
const profileFields = z.object({
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
  professionId: z.string(),
  ethnicGroupId: z.string(),
  lastEducation: optionalEnum(LAST_EDUCATION),
  bloodType: optionalEnum(BLOOD_TYPES),
});

const REQUIRED = [
  ["gender", "Jenis kelamin wajib dipilih"],
  ["provincesCode", "Provinsi wajib dipilih"],
  ["regenciesCode", "Kabupaten/kota wajib dipilih, sesudah provinsi."],
  ["districtsCode", "Kecamatan wajib dipilih, sesudah kabupaten/kota."],
  ["villagesCode", "Kelurahan/desa wajib dipilih, sesudah kecamatan."],
  ["address", "Alamat wajib diisi, mis. Jl. Merdeka 10, RT 01 RW 02."],
] as const;

export const profileFormSchema = profileFields.superRefine((values, ctx) => {
  for (const [field, message] of REQUIRED) {
    if (!values[field]) {
      ctx.addIssue({ code: "custom", path: [field], message });
    }
  }

  if (values.email && !values.email.includes("@")) {
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: "Email harus memuat @",
    });
  }
});

export type ProfileFormValues = z.infer<typeof profileFields>;

const PROFILE_SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof ProfileFormValues]
> = [[/email/i, "email"]];

export function profileFieldError(
  message: string,
): { field: keyof ProfileFormValues; message: string } | null {
  const match = PROFILE_SERVER_FIELD_ERROR.find(([pattern]) =>
    pattern.test(message),
  );

  return match ? { field: match[1], message } : null;
}

export function toProfileForm(profile: MyProfile): ProfileFormValues {
  return {
    name: profile.name,
    gender: profile.gender,
    birthPlace: profile.birthPlace ?? "",
    birthDate: toDateInput(profile.birthDate),
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    provincesCode: profile.provincesCode ?? "",
    regenciesCode: profile.regenciesCode ?? "",
    districtsCode: profile.districtsCode ?? "",
    villagesCode: profile.villagesCode ?? "",
    address: profile.address ?? "",
    professionId: profile.professionId ? String(profile.professionId) : "",
    ethnicGroupId: profile.ethnicGroupId ? String(profile.ethnicGroupId) : "",
    lastEducation: (profile.lastEducation ??
      "") as ProfileFormValues["lastEducation"],
    bloodType: profile.bloodType ?? "",
  };
}

const idToNumber = (value: string) => (value ? Number(value) : null);

export function toProfilePayload(values: ProfileFormValues): MyProfilePayload {
  return {
    name: collapseSpaces(values.name),
    gender: values.gender as "L" | "P",
    birthPlace: values.birthPlace.trim(),
    birthDate: emptyToNull(values.birthDate),
    email: emptyToNull(values.email),
    phone: emptyToNull(keepDigits(values.phone.replace(/^\+?62/, "0"), 12)),
    bloodType: values.bloodType || null,
    lastEducation: values.lastEducation || null,
    professionId: idToNumber(values.professionId),
    ethnicGroupId: idToNumber(values.ethnicGroupId),
    provincesCode: values.provincesCode,
    regenciesCode: values.regenciesCode,
    districtsCode: values.districtsCode,
    villagesCode: values.villagesCode,
    address: values.address.trim(),
  };
}
