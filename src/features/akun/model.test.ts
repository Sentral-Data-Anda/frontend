import { describe, expect, test } from "bun:test";

import {
  offeringMeta,
  passwordFieldError,
  passwordFormSchema,
  roleLabels,
  summarizeOfferings,
} from "./model";

const issuesOf = (values: Record<string, string>) => {
  const parsed = passwordFormSchema.safeParse(values);

  return parsed.success ? [] : parsed.error.issues.map((i) => i.path[0]);
};

describe("passwordFormSchema, cermin updatePasswordSchema be-sada", () => {
  test("huruf besar dan tiga angka wajib", () => {
    expect(
      issuesOf({
        oldPassword: "lama",
        newPassword: "rahasia123",
        confirmPassword: "rahasia123",
      }),
    ).toEqual(["newPassword"]);

    expect(
      issuesOf({
        oldPassword: "lama",
        newPassword: "Rahasia123",
        confirmPassword: "Rahasia123",
      }),
    ).toEqual([]);
  });

  test("konfirmasi yang berbeda ditolak di fieldnya", () => {
    expect(
      issuesOf({
        oldPassword: "lama",
        newPassword: "Rahasia123",
        confirmPassword: "Rahasia124",
      }),
    ).toEqual(["confirmPassword"]);
  });

  test("pesan password lama salah dari be-sada mendarat di oldPassword", () => {
    expect(
      passwordFieldError(
        "Password Lama yang Anda masukkan tidak valid. Mohon periksa kembali",
      )?.field,
    ).toBe("oldPassword");
    expect(passwordFieldError("Kesalahan server")).toBeNull();
  });
});

describe("persembahan dan profil", () => {
  test("ringkasan menjumlah nominal string dari be-sada", () => {
    const item = {
      code: "PSB-1",
      amount: "650000",
      period: "2026-09-01T00:00:00.000Z",
      receivedDate: "2026-09-07T00:00:00.000Z",
      typePersembahan: { name: "Persembahan Bulanan" },
    };

    expect(summarizeOfferings([item, { ...item, code: "PSB-2" }])).toEqual({
      items: [item, { ...item, code: "PSB-2" }],
      count: 2,
      total: 1_300_000,
    });
    expect(offeringMeta(item)).toBe("Periode September 2026");
    expect(offeringMeta({ ...item, period: null })).toBe(
      "Diterima 7 September 2026",
    );
  });

  test("jabatan menyebut badan pelayanannya bila ada", () => {
    expect(
      roleLabels([
        { name: "Ketua", bapel: { name: "Majelis Jemaat" } },
        { name: "Anggota", bapel: null },
      ]),
    ).toEqual(["Ketua, Majelis Jemaat", "Anggota"]);
    expect(roleLabels(undefined)).toEqual([]);
  });
});
