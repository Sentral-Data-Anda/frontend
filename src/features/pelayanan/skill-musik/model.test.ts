import { describe, expect, test } from "bun:test";

import {
  serverFieldError,
  skillMusikFormSchema,
  toSkillMusikForm,
  toSkillMusikPayload,
} from "./model";

const issuesOf = (name: string) => {
  const parsed = skillMusikFormSchema.safeParse({ name });

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.message);
};

describe("skillMusikFormSchema", () => {
  test("nama 2–50 karakter lolos", () => {
    expect(issuesOf("Gitar")).toEqual([]);
    expect(issuesOf("Hp")).toEqual([]);
    expect(issuesOf("x".repeat(50))).toEqual([]);
  });

  test("kosong atau hanya spasi: satu pesan wajib", () => {
    expect(issuesOf("")).toEqual(["Isi nama alat musik, mis. Gitar."]);
    expect(issuesOf("    ")).toEqual(["Isi nama alat musik, mis. Gitar."]);
  });

  test("batas 2 dan 50 dihitung sesudah normalisasi", () => {
    expect(issuesOf("  x  ")).toEqual(["Nama alat musik minimal 2 karakter."]);
    expect(issuesOf("x".repeat(51))).toEqual([
      "Nama alat musik maksimal 50 karakter.",
    ]);
    expect(issuesOf(`${"x".repeat(25)}   ${"y".repeat(24)}`)).toEqual([]);
  });
});

describe("form ↔ payload", () => {
  test("payload mengirim nama yang sudah dinormalisasi", () => {
    expect(toSkillMusikPayload({ name: "  biola   listrik " })).toEqual({
      name: "Biola Listrik",
    });
    expect(toSkillMusikPayload({ name: "GITAR" })).toEqual({ name: "GITAR" });
  });

  test("detail be-sada jadi nilai form", () => {
    expect(toSkillMusikForm({ id: 2, name: "Gitar" })).toEqual({
      name: "Gitar",
    });
  });
});

describe("serverFieldError", () => {
  test("nama ganda dipetakan ke field nama", () => {
    expect(serverFieldError("Skill Musik Sudah Tersedia")).toEqual({
      field: "name",
      message: "Alat musik dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("hapus yang masih dipakai tidak dipetakan (jatuh ke FormAlert)", () => {
    expect(
      serverFieldError(
        "Skill Musik Tidak Dapat Dihapus Karena Masih Digunakan oleh Pelayan",
      ),
    ).toBeNull();
  });
});
