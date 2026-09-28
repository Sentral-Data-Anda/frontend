import { describe, expect, test } from "bun:test";

import {
  serverFieldError,
  tipeBarangFormSchema,
  toTipeBarangForm,
  toTipeBarangPayload,
} from "./model";

const issuesOf = (name: string) => {
  const parsed = tipeBarangFormSchema.safeParse({ name });

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("tipeBarangFormSchema", () => {
  test("nama 2–50 karakter lolos", () => {
    expect(issuesOf("TV")).toEqual([]);
    expect(issuesOf("ATK")).toEqual([]);
    expect(issuesOf("x".repeat(50))).toEqual([]);
  });

  test("kosong, spasi, atau satu huruf ditolak dengan pesan yang sama", () => {
    for (const name of ["", "    ", "a", "  b  "]) {
      expect(issuesOf(name)).toEqual([
        "name: Isi nama tipe, minimal 2 karakter",
      ]);
    }
  });

  test("batas dihitung sesudah normalisasi", () => {
    expect(issuesOf("x".repeat(51))).toEqual([
      "name: Nama tipe maksimal 50 karakter",
    ]);
    expect(issuesOf(`${"x".repeat(25)}   ${"y".repeat(24)}`)).toEqual([]);
  });
});

describe("form ↔ payload", () => {
  test("payload hanya { name } yang dinormalisasi", () => {
    expect(toTipeBarangPayload({ name: "  Alat   Musik " })).toEqual({
      name: "Alat Musik",
    });
    expect(toTipeBarangPayload({ name: "ATK" })).toEqual({ name: "ATK" });
  });

  test("detail be-sada jadi nilai form tanpa kolom akun", () => {
    expect(
      toTipeBarangForm({
        publicId: "p-1",
        code: "TYP_ITM-0001",
        name: "Elektronik",
      }),
    ).toEqual({ name: "Elektronik" });
  });
});

describe("serverFieldError", () => {
  test("nama ganda dipetakan ke field nama lewat teks", () => {
    expect(serverFieldError("Tipe Barang Sudah Tersedia")).toEqual({
      field: "name",
      message: "Tipe dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("pesan hapus ditolak tidak dipetakan (jatuh ke galat form)", () => {
    expect(
      serverFieldError(
        "Tipe Barang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
      ),
    ).toBeNull();
  });
});
