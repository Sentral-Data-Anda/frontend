import { describe, expect, test } from "bun:test";

import {
  profileFieldError,
  profileFormSchema,
  toProfileForm,
  toProfilePayload,
  type ProfileFormValues,
} from "./model";
import type { MyProfile } from "./types";

const PROFILE: MyProfile = {
  name: "Budi Santoso",
  gender: "L",
  birthPlace: "Medan",
  birthDate: "1985-05-12T00:00:00.000Z",
  phone: "081234560184",
  email: "budi@contoh.id",
  statusMarital: "SM",
  address: "Jl. Merdeka 2",
  bloodType: "O",
  lastEducation: "S1",
  professionId: 3,
  ethnicGroupId: 2,
  typeJemaat: "ANGGOTA",
  statusJemaat: "AKTIF",
  joinedAt: "2012-06-17T00:00:00.000Z",
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  villages: { name: "Cijerah" },
  districts: { name: "Bandung Kulon" },
  regencies: { name: "Kota Bandung" },
  provinces: { name: "Jawa Barat" },
  zoneChurch: { name: "Wilayah II" },
};

const values = (patch: Partial<ProfileFormValues> = {}): ProfileFormValues => ({
  ...toProfileForm(PROFILE),
  ...patch,
});

describe("toProfileForm", () => {
  test("mengisi form dari profil, termasuk kode wilayah dan id master", () => {
    expect(toProfileForm(PROFILE)).toEqual({
      name: "Budi Santoso",
      gender: "L",
      birthPlace: "Medan",
      birthDate: "1985-05-12",
      phone: "081234560184",
      email: "budi@contoh.id",
      provincesCode: "32",
      regenciesCode: "3273",
      districtsCode: "327301",
      villagesCode: "3273011001",
      address: "Jl. Merdeka 2",
      professionId: "3",
      ethnicGroupId: "2",
      lastEducation: "S1",
      bloodType: "O",
    });
  });

  test("tidak membawa satu pun field keorganisasian ke form", () => {
    const form = toProfileForm(PROFILE) as Record<string, unknown>;

    for (const field of [
      "typeJemaat",
      "statusJemaat",
      "statusMarital",
      "joinedAt",
      "zoneChurch",
      "codeInduk",
    ]) {
      expect(form, field).not.toHaveProperty(field);
    }
  });
});

describe("toProfilePayload", () => {
  test("mengirim sepuluh field pribadi dan tidak lebih", () => {
    expect(Object.keys(toProfilePayload(values())).sort()).toEqual([
      "address",
      "birthDate",
      "birthPlace",
      "bloodType",
      "districtsCode",
      "email",
      "ethnicGroupId",
      "gender",
      "lastEducation",
      "name",
      "phone",
      "professionId",
      "provincesCode",
      "regenciesCode",
      "villagesCode",
    ]);
  });

  test("isian kosong dikirim null, bukan teks kosong", () => {
    const payload = toProfilePayload(
      values({
        birthDate: "",
        email: "",
        phone: "",
        bloodType: "",
        lastEducation: "",
        professionId: "",
        ethnicGroupId: "",
      }),
    );

    expect(payload).toMatchObject({
      birthDate: null,
      email: null,
      phone: null,
      bloodType: null,
      lastEducation: null,
      professionId: null,
      ethnicGroupId: null,
    });
  });

  test("nama dirapikan dan telepon +62 jadi 0", () => {
    const payload = toProfilePayload(
      values({ name: "  Budi   Santoso ", phone: "6281234560184" }),
    );

    expect(payload.name).toBe("Budi Santoso");
    expect(payload.phone).toBe("081234560184");
  });
});

describe("profileFormSchema", () => {
  test("menerima profil yang lengkap", () => {
    expect(profileFormSchema.safeParse(values()).success).toBe(true);
  });

  test.each([
    ["name", ""],
    ["birthPlace", ""],
    ["gender", ""],
    ["provincesCode", ""],
    ["regenciesCode", ""],
    ["districtsCode", ""],
    ["villagesCode", ""],
    ["address", ""],
  ])("menolak %s yang kosong", (field, value) => {
    const parsed = profileFormSchema.safeParse(
      values({ [field]: value } as Partial<ProfileFormValues>),
    );

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((issue) => issue.path[0] === field)).toBe(
      true,
    );
  });

  test("menerima kontak dan data sosial yang dikosongkan", () => {
    const parsed = profileFormSchema.safeParse(
      values({
        birthDate: "",
        email: "",
        phone: "",
        bloodType: "",
        lastEducation: "",
        professionId: "",
        ethnicGroupId: "",
      }),
    );

    expect(parsed.success).toBe(true);
  });

  test.each([
    ["email tanpa @", { email: "budi" }],
    ["telepon berisi huruf", { phone: "08a" }],
  ])("menolak %s", (_label, patch) => {
    expect(
      profileFormSchema.safeParse(values(patch as Partial<ProfileFormValues>))
        .success,
    ).toBe(false);
  });
});

describe("profileFieldError", () => {
  test("penolakan email mendarat di fieldnya", () => {
    expect(profileFieldError("Email Sudah Tersedia")).toEqual({
      field: "email",
      message: "Email Sudah Tersedia",
    });
  });

  test("pesan lain dibiarkan jadi galat tingkat form", () => {
    expect(profileFieldError("Jemaat Tidak Ditemukan")).toBeNull();
  });
});
