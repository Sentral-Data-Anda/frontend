import { describe, expect, test } from "bun:test";

import {
  EMPTY_WILAYAH_FORM,
  serverFieldError,
  toWilayahForm,
  toWilayahPayload,
  wilayahFormSchema,
  type WilayahFormValues,
} from "./model";
import type { Wilayah } from "./types";

const VALID: WilayahFormValues = { name: "Wilayah I", isActive: "true" };

const issuesOf = (values: WilayahFormValues) => {
  const parsed = wilayahFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("wilayahFormSchema", () => {
  test("nama 1–50 karakter lolos; bawaan form berstatus Aktif", () => {
    expect(issuesOf(VALID)).toEqual([]);
    expect(issuesOf({ ...VALID, name: "x".repeat(50) })).toEqual([]);
    expect(EMPTY_WILAYAH_FORM.isActive).toBe("true");
  });

  test("nama kosong atau hanya spasi dan lebih dari 50 karakter ditolak dengan pesannya", () => {
    expect(issuesOf({ ...VALID, name: "   " })).toEqual([
      "name: Mohon lengkapi nama wilayah, mis. Wilayah I.",
    ]);
    expect(issuesOf({ ...VALID, name: "x".repeat(51) })).toEqual([
      "name: Nama wilayah maksimal 50 karakter",
    ]);
  });

  test("status di luar Aktif/Nonaktif ditolak", () => {
    expect(
      issuesOf({ ...VALID, isActive: "" as WilayahFormValues["isActive"] }),
    ).toEqual(["isActive: Mohon pilih status wilayah"]);
  });
});

describe("form ↔ payload", () => {
  test("nama dinormalisasi seperti be-sada, status jadi boolean", () => {
    expect(
      toWilayahPayload({ name: "  Wilayah   Timur ", isActive: "false" }),
    ).toEqual({ name: "Wilayah Timur", isActive: false });
    expect(toWilayahPayload(VALID)).toEqual({
      name: "Wilayah I",
      isActive: true,
    });
  });

  test("detail be-sada jadi nilai form", () => {
    const wilayah: Wilayah = {
      id: 5,
      publicId: "p",
      code: "ZC-0005",
      name: "Wilayah V",
      isActive: false,
    };

    expect(toWilayahForm(wilayah)).toEqual({
      name: "Wilayah V",
      isActive: "false",
    });
  });
});

describe("serverFieldError", () => {
  test("409 nama ganda dipetakan ke field nama", () => {
    expect(serverFieldError("Wilayah Sudah Tersedia")).toEqual({
      field: "name",
      message: "Nama ini sudah dipakai wilayah lain.",
    });
  });

  test("pesan lain tidak dipetakan (jatuh ke galat form)", () => {
    expect(
      serverFieldError(
        "Wilayah Tidak Dapat Dihapus Karena Masih Digunakan oleh Keluarga",
      ),
    ).toBeNull();
  });
});
