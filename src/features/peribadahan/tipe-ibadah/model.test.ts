import { describe, expect, test } from "bun:test";

import {
  EMPTY_TIPE_IBADAH_FORM,
  serverFieldError,
  tipeIbadahFormSchema,
  toTipeIbadahForm,
  toTipeIbadahPayload,
  type TipeIbadahFormValues,
} from "./model";

const VALID: TipeIbadahFormValues = { name: "Ibadah Minggu", isActive: "true" };

const issuesOf = (values: TipeIbadahFormValues) => {
  const parsed = tipeIbadahFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("tipeIbadahFormSchema", () => {
  test("nama 1–50 karakter lolos, termasuk nama pendek; bawaan Aktif", () => {
    expect(issuesOf(VALID)).toEqual([]);
    expect(issuesOf({ ...VALID, name: "Doa" })).toEqual([]);
    expect(issuesOf({ ...VALID, name: "x".repeat(50) })).toEqual([]);
    expect(EMPTY_TIPE_IBADAH_FORM.isActive).toBe("true");
  });

  test("kosong atau hanya spasi ditolak dengan pesannya", () => {
    expect(issuesOf({ ...VALID, name: "" })).toEqual([
      "name: Isi nama tipe ibadah, mis. Ibadah Minggu.",
    ]);
    expect(issuesOf({ ...VALID, name: "    " })).toEqual([
      "name: Isi nama tipe ibadah, mis. Ibadah Minggu.",
    ]);
  });

  test("batas 50 dihitung sesudah normalisasi", () => {
    expect(issuesOf({ ...VALID, name: "x".repeat(51) })).toEqual([
      "name: Nama tipe ibadah maksimal 50 karakter.",
    ]);
    expect(
      issuesOf({ ...VALID, name: `${"x".repeat(25)}   ${"y".repeat(24)}` }),
    ).toEqual([]);
  });

  test("status di luar Aktif/Nonaktif ditolak", () => {
    expect(
      issuesOf({ ...VALID, isActive: "" as TipeIbadahFormValues["isActive"] }),
    ).toEqual(["isActive: Mohon pilih status tipe ibadah"]);
  });
});

describe("form ↔ payload", () => {
  test("nama dinormalisasi seperti be-sada, status jadi boolean", () => {
    expect(
      toTipeIbadahPayload({ name: "  Ibadah   Pemuda ", isActive: "false" }),
    ).toEqual({ name: "Ibadah Pemuda", isActive: false });
    expect(toTipeIbadahPayload(VALID)).toEqual({
      name: "Ibadah Minggu",
      isActive: true,
    });
  });

  test("detail be-sada jadi nilai form", () => {
    expect(
      toTipeIbadahForm({
        code: "TYP_IBD-0005",
        name: "Ibadah Padang",
        isActive: false,
      }),
    ).toEqual({ name: "Ibadah Padang", isActive: "false" });
  });
});

describe("serverFieldError", () => {
  test("409 nama ganda dipetakan ke field nama", () => {
    expect(serverFieldError("Tipe Ibadah Sudah Tersedia")).toEqual({
      field: "name",
      message: "Tipe ibadah dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("pesan lain tidak dipetakan (jatuh ke galat form)", () => {
    expect(
      serverFieldError(
        "Tipe Ibadah Tidak Dapat Dihapus Karena Masih Digunakan oleh Data Ibadah",
      ),
    ).toBeNull();
  });
});
