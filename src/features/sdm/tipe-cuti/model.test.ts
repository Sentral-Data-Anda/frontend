import { describe, expect, test } from "bun:test";

import {
  EMPTY_TIPE_CUTI_FORM,
  quotaTextOf,
  serverFieldError,
  tipeCutiFormSchema,
  toDigits,
  toTipeCutiForm,
  toTipeCutiPayload,
  type TipeCutiFormValues,
} from "./model";
import type { TipeCuti } from "./types";

const onParse = (next: Partial<TipeCutiFormValues>) =>
  tipeCutiFormSchema.safeParse({
    ...EMPTY_TIPE_CUTI_FORM,
    maxDaysPerYear: "12",
    ...next,
  });

const issuesOf = (next: Partial<TipeCutiFormValues>) => {
  const parsed = onParse(next);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("nama", () => {
  test("1–50 karakter lolos, dihitung sesudah spasi dirapikan", () => {
    expect(issuesOf({ name: "C" })).toEqual([]);
    expect(issuesOf({ name: "x".repeat(50) })).toEqual([]);
    expect(issuesOf({ name: `${"x".repeat(25)}   ${"y".repeat(24)}` })).toEqual(
      [],
    );
  });

  test("51 karakter ditolak", () => {
    expect(issuesOf({ name: "x".repeat(51) })).toEqual([
      "name: Nama tipe cuti maksimal 50 karakter",
    ]);
  });

  test("kosong atau hanya spasi ditolak", () => {
    expect(issuesOf({ name: "" })).toEqual([
      "name: Isi nama tipe cuti, mis. Cuti Tahunan",
    ]);
    expect(issuesOf({ name: "   " })).toEqual([
      "name: Isi nama tipe cuti, mis. Cuti Tahunan",
    ]);
  });
});

// null berarti tanpa batas; nol berarti tipe yang ada dan tidak pernah bisa
// diambil, yang gunanya `isActive` — jadi nol ditolak, dan keduanya diuji atau
// aturannya tidak terjaga.
describe("jatah: null bukan nol", () => {
  test("Tanpa batas lolos tanpa angka hari, dan payload-nya null", () => {
    expect(
      issuesOf({
        name: "Cuti Melahirkan",
        isUnlimited: "true",
        maxDaysPerYear: "",
      }),
    ).toEqual([]);
    expect(
      toTipeCutiPayload({
        ...EMPTY_TIPE_CUTI_FORM,
        name: "Cuti Melahirkan",
        isUnlimited: "true",
        maxDaysPerYear: "",
      }).maxDaysPerYear,
    ).toBeNull();
  });

  test("Tanpa batas mengabaikan angka hari yang masih tertinggal", () => {
    expect(
      toTipeCutiPayload({
        ...EMPTY_TIPE_CUTI_FORM,
        name: "Cuti Melahirkan",
        isUnlimited: "true",
        maxDaysPerYear: "90",
      }).maxDaysPerYear,
    ).toBeNull();
  });

  test("Dibatasi: 0 ditolak, 1 lolos", () => {
    expect(issuesOf({ name: "Cuti Duka", maxDaysPerYear: "0" })).toEqual([
      "maxDaysPerYear: Isi jatah minimal 1 hari, atau pilih Tanpa batas",
    ]);
    expect(issuesOf({ name: "Cuti Duka", maxDaysPerYear: "1" })).toEqual([]);
  });

  test("Dibatasi tanpa angka ditolak, dan pesannya menunjuk jalan keluarnya", () => {
    expect(issuesOf({ name: "Cuti Duka", maxDaysPerYear: "" })).toEqual([
      "maxDaysPerYear: Isi jatah minimal 1 hari, atau pilih Tanpa batas",
    ]);
  });

  test("payload mengirim number, bukan string", () => {
    expect(
      toTipeCutiPayload({
        ...EMPTY_TIPE_CUTI_FORM,
        name: "Cuti Tahunan",
        maxDaysPerYear: "12",
      }),
    ).toEqual({
      name: "Cuti Tahunan",
      maxDaysPerYear: 12,
      isPaid: true,
      isActive: true,
    });
  });

  test("isian hari hanya digit, maksimal 3", () => {
    expect(toDigits("1a2b3c4")).toBe("123");
    expect(toDigits("-5")).toBe("5");
  });
});

describe("bawaan form", () => {
  test("tambah lahir Dibatasi, Dibayar, Aktif — tanpa jatah yang dikarang", () => {
    expect(EMPTY_TIPE_CUTI_FORM).toEqual({
      name: "",
      isUnlimited: "false",
      maxDaysPerYear: "",
      isPaid: "true",
      isActive: "true",
    });
  });
});

describe("detail jadi nilai form", () => {
  const DETAIL: TipeCuti = {
    id: 3,
    publicId: "p-3",
    code: "TCT-0003",
    name: "Cuti Melahirkan",
    maxDaysPerYear: null,
    isPaid: false,
    isActive: false,
  };

  test("jatah null jadi Tanpa batas dengan hari kosong", () => {
    expect(toTipeCutiForm(DETAIL)).toEqual({
      name: "Cuti Melahirkan",
      isUnlimited: "true",
      maxDaysPerYear: "",
      isPaid: "false",
      isActive: "false",
    });
  });

  test("jatah angka jadi Dibatasi dengan harinya", () => {
    expect(toTipeCutiForm({ ...DETAIL, maxDaysPerYear: 12 })).toMatchObject({
      isUnlimited: "false",
      maxDaysPerYear: "12",
    });
  });
});

describe("quotaTextOf", () => {
  test("null berbunyi Tanpa batas, bukan tanda hubung", () => {
    expect(quotaTextOf(null)).toBe("Tanpa batas");
    expect(quotaTextOf(null)).not.toContain("—");
    expect(quotaTextOf(null)).not.toBe("-");
  });

  test("angka berbunyi N hari", () => {
    expect(quotaTextOf(12)).toBe("12 hari");
    expect(quotaTextOf(1)).toBe("1 hari");
  });
});

describe("serverFieldError", () => {
  test("nama ganda 409 dipetakan ke field nama", () => {
    expect(serverFieldError("Tipe Cuti Sudah Tersedia")).toEqual({
      field: "name",
      message: "Tipe cuti dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("galat nama be-sada dipetakan apa adanya", () => {
    expect(serverFieldError("Mohon Lengkapi Nama Tipe Cuti")).toEqual({
      field: "name",
      message: "Mohon Lengkapi Nama Tipe Cuti",
    });
  });

  test("galat jatah dipetakan ke field hari", () => {
    expect(
      serverFieldError(
        "Jatah Hari Per Tahun harus bilangan bulat lebih dari 0",
      ),
    ).toEqual({
      field: "maxDaysPerYear",
      message: "Jatah Hari Per Tahun harus bilangan bulat lebih dari 0",
    });
  });

  test("penolakan hapus TIDAK dipetakan ke field — ia galat tingkat form", () => {
    expect(
      serverFieldError(
        "Tipe Cuti Ini Sudah Dipakai Oleh Pengajuan Cuti. Nonaktifkan Saja, Jangan Dihapus",
      ),
    ).toBeNull();
    expect(serverFieldError("Tipe Cuti Tidak Ditemukan")).toBeNull();
  });
});
