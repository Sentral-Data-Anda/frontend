import { describe, expect, test } from "bun:test";

import {
  satuanFormSchema,
  serverFieldError,
  toSatuanForm,
  toSatuanPayload,
} from "./model";

const issuesOf = (name: string) => {
  const parsed = satuanFormSchema.safeParse({ name });

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("satuanFormSchema", () => {
  test("nama 1–30 karakter lolos", () => {
    expect(issuesOf("m")).toEqual([]);
    expect(issuesOf("Pak")).toEqual([]);
    expect(issuesOf("x".repeat(30))).toEqual([]);
  });

  test("kosong atau hanya spasi ditolak", () => {
    expect(issuesOf("")).toEqual(["name: Isi nama satuan"]);
    expect(issuesOf("    ")).toEqual(["name: Isi nama satuan"]);
  });

  test("batas 30 dihitung sesudah normalisasi", () => {
    expect(issuesOf("x".repeat(31))).toEqual([
      "name: Nama satuan maksimal 30 karakter",
    ]);
    expect(issuesOf(`${"x".repeat(15)}   ${"y".repeat(14)}`)).toEqual([]);
  });
});

describe("form ↔ payload", () => {
  test("payload hanya { name } yang dinormalisasi", () => {
    expect(toSatuanPayload({ name: "  Kotak   Besar " })).toEqual({
      name: "Kotak Besar",
    });
  });

  test("detail be-sada jadi nilai form", () => {
    expect(
      toSatuanForm({ publicId: "p-3", code: "UNT-0003", name: "Pak" }),
    ).toEqual({ name: "Pak" });
  });
});

describe("serverFieldError", () => {
  test("nama ganda dipetakan ke field nama lewat teks", () => {
    expect(serverFieldError("Satuan Sudah Tersedia")).toEqual({
      field: "name",
      message: "Satuan dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("pesan hapus ditolak tidak dipetakan (jatuh ke galat form)", () => {
    expect(
      serverFieldError(
        "Satuan Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
      ),
    ).toBeNull();
  });
});
