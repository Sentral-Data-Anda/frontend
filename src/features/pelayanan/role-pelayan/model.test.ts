import { describe, expect, test } from "bun:test";

import {
  isPemusikRole,
  rolePelayanFormSchema,
  serverFieldError,
  toRolePelayanForm,
  toRolePelayanPayload,
} from "./model";

const issuesOf = (name: string) => {
  const parsed = rolePelayanFormSchema.safeParse({ name });

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.message);
};

describe("rolePelayanFormSchema", () => {
  test("nama 2–50 karakter lolos", () => {
    expect(issuesOf("Liturgis")).toEqual([]);
    expect(issuesOf("MC")).toEqual([]);
    expect(issuesOf("x".repeat(50))).toEqual([]);
  });

  test("kosong atau hanya spasi: satu pesan wajib", () => {
    expect(issuesOf("")).toEqual(["Isi nama tugas, mis. Liturgis."]);
    expect(issuesOf("    ")).toEqual(["Isi nama tugas, mis. Liturgis."]);
  });

  test("batas 2 dan 50 dihitung sesudah normalisasi", () => {
    expect(issuesOf("  x  ")).toEqual(["Nama tugas minimal 2 karakter."]);
    expect(issuesOf("x".repeat(51))).toEqual([
      "Nama tugas maksimal 50 karakter.",
    ]);
    expect(issuesOf(`${"x".repeat(25)}   ${"y".repeat(24)}`)).toEqual([]);
  });
});

describe("form ↔ payload", () => {
  test("payload mengirim nama yang sudah dinormalisasi", () => {
    expect(toRolePelayanPayload({ name: "  penerima   tamu " })).toEqual({
      name: "Penerima Tamu",
    });
    expect(toRolePelayanPayload({ name: "LITURGIS" })).toEqual({
      name: "LITURGIS",
    });
  });

  test("detail be-sada jadi nilai form", () => {
    expect(toRolePelayanForm({ id: 1, name: "Liturgis" })).toEqual({
      name: "Liturgis",
    });
  });
});

describe("serverFieldError", () => {
  test("nama ganda dipetakan ke field nama", () => {
    expect(serverFieldError("Role Pelayan Sudah Tersedia")).toEqual({
      field: "name",
      message: "Tugas dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("hapus dipakai dan kunci Pemusik tidak dipetakan (jatuh ke FormAlert)", () => {
    expect(
      serverFieldError(
        "Role Pelayan Tidak Dapat Dihapus Karena Masih Digunakan oleh Template Jadwal",
      ),
    ).toBeNull();
    expect(
      serverFieldError(
        "Role Pemusik Dipakai Sistem dan Tidak Dapat Diubah atau Dihapus",
      ),
    ).toBeNull();
  });
});

describe("isPemusikRole", () => {
  test("Pemusik dikenali tanpa peka huruf besar dan spasi tepi", () => {
    expect(isPemusikRole("Pemusik")).toBe(true);
    expect(isPemusikRole("  PEMUSIK ")).toBe(true);
    expect(isPemusikRole("Pemusik Tamu")).toBe(false);
    expect(isPemusikRole(undefined)).toBe(false);
  });
});
