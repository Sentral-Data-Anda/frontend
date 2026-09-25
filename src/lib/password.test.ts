import { describe, expect, test } from "bun:test";

import { changePasswordSchema, firstPasswordSchema } from "./password";

const firstIssues = (
  schema: typeof firstPasswordSchema | typeof changePasswordSchema,
  values: Record<string, string>,
) => {
  const parsed = schema.safeParse(values);

  if (parsed.success) return {};

  const first: Record<string, string> = {};

  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]);
    first[key] ??= issue.message;
  }

  return first;
};

const SCHEMAS = [
  ["login pertama", firstPasswordSchema, {}],
  ["ganti password", changePasswordSchema, { oldPassword: "lama" }],
] as const;

describe.each(SCHEMAS)("aturan password: %s", (_, schema, extra) => {
  const check = (newPassword: string, confirmPassword = newPassword) =>
    firstIssues(schema, { ...extra, newPassword, confirmPassword });

  test("7 karakter ditolak, 8 karakter lolos", () => {
    expect(check("Abc1234").newPassword).toBe(
      "Password Baru tidak boleh kurang dari 8 karakter",
    );
    expect(check("Abcd1234")).toEqual({});
  });

  test("26 karakter ditolak", () => {
    expect(check(`A123${"x".repeat(22)}`).newPassword).toBe(
      "Password Baru tidak boleh lebih dari 25 karakter",
    );
  });

  test("tanpa huruf besar atau hanya 2 angka ditolak", () => {
    expect(check("abcd1234").newPassword).toBe(
      "Password Harus Mengandung Huruf Besar dan 3 Angka",
    );
    expect(check("Abcdef12").newPassword).toBe(
      "Password Harus Mengandung Huruf Besar dan 3 Angka",
    );
  });

  test("spasi boleh dan tidak dipangkas", () => {
    expect(check(" Abc 123 ")).toEqual({});
    expect(check(" Abc 123 ", "Abc 123").confirmPassword).toBe(
      "Konfirmasi Password Tidak Sama Dengan Password Baru",
    );
  });

  test("konfirmasi berbeda ditolak, juga saat password baru gagal aturan lain", () => {
    expect(check("Abcd1234", "Abcd1235").confirmPassword).toBe(
      "Konfirmasi Password Tidak Sama Dengan Password Baru",
    );
    expect(check("abc", "xyz")).toEqual({
      newPassword: "Password Baru tidak boleh kurang dari 8 karakter",
      confirmPassword: "Konfirmasi Password Tidak Sama Dengan Password Baru",
    });
  });

  test("kosong: pesan wajib", () => {
    expect(check("", "")).toEqual({
      newPassword: "Mohon Lengkapi Password Baru",
      confirmPassword: "Mohon Lengkapi Konfirmasi Password",
    });
  });
});

test("password lama wajib, tidak dipangkas, maks 25", () => {
  const check = (oldPassword: string) =>
    firstIssues(changePasswordSchema, {
      oldPassword,
      newPassword: "Abcd1234",
      confirmPassword: "Abcd1234",
    });

  expect(check("").oldPassword).toBe("Mohon Lengkapi Password Lama");
  expect(check(" a ")).toEqual({});
  expect(check("x".repeat(26)).oldPassword).toBe(
    "Password Lama tidak boleh lebih dari 25 karakter",
  );
});
