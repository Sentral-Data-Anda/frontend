import { describe, expect, test } from "bun:test";

import {
  EMPTY_HOLIDAY_FORM,
  formatHolidayDate,
  holidayDateMax,
  holidayFormSchema,
  serverFieldError,
  toHolidayForm,
  toHolidayPayload,
  yearOptions,
  type HolidayFormValues,
} from "./model";
import { HOLIDAY_TYPE_LABEL, type Holiday } from "./types";

const VALID: HolidayFormValues = {
  date: "2026-09-27",
  name: "HUT Gereja",
  type: "GEREJA",
  isRecurring: "true",
};

const issuesOf = (values: HolidayFormValues) => {
  const parsed = holidayFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("holidayFormSchema", () => {
  test("isian lengkap lolos; bawaan form tidak berulang", () => {
    expect(issuesOf(VALID)).toEqual([]);
    expect(EMPTY_HOLIDAY_FORM.isRecurring).toBe("false");
  });

  test("tanggal, nama, dan tipe wajib", () => {
    const issues = issuesOf(EMPTY_HOLIDAY_FORM);

    expect(issues).toContain("date: Tanggal wajib diisi");
    expect(issues).toContain(
      "name: Mohon lengkapi nama hari libur, mis. HUT Gereja.",
    );
    expect(issues).toContain("type: Tipe hari libur wajib dipilih");
  });

  test("nama 3–100 karakter sesudah spasi dirapatkan", () => {
    expect(issuesOf({ ...VALID, name: " a    " })).toEqual([
      "name: Nama hari libur minimal 3 karakter",
    ]);
    expect(issuesOf({ ...VALID, name: "x".repeat(100) })).toEqual([]);
    expect(issuesOf({ ...VALID, name: "x".repeat(101) })).toEqual([
      "name: Nama hari libur maksimal 100 karakter",
    ]);
  });
});

describe("payload", () => {
  test("tanggal ISO apa adanya, nama dirapatkan, berulang jadi boolean", () => {
    expect(
      toHolidayPayload({
        ...VALID,
        name: "  HUT   Gereja ",
        isRecurring: "false",
      }),
    ).toEqual({
      date: "2026-09-27",
      name: "HUT Gereja",
      type: "GEREJA",
      isRecurring: false,
    });
    expect(toHolidayPayload(VALID).isRecurring).toBe(true);
  });

  test("baris be-sada menjadi isian form", () => {
    const holiday: Holiday = {
      id: 13,
      publicId: "a",
      date: "1985-09-27T00:00:00.000Z",
      name: "HUT Gereja",
      type: "GEREJA",
      isRecurring: true,
    };

    expect(toHolidayForm(holiday)).toEqual({ ...VALID, date: "1985-09-27" });
  });
});

describe("label dan format", () => {
  test("label tipe", () => {
    expect(HOLIDAY_TYPE_LABEL).toEqual({
      NASIONAL: "Nasional",
      CUTI_BERSAMA: "Cuti bersama",
      GEREJA: "Gereja",
    });
  });

  test("tanggal HP memuat nama hari", () => {
    expect(formatHolidayDate("2026-08-17T00:00:00.000Z")).toBe(
      "Senin, 17 Agustus 2026",
    );
  });

  test("tanggal boleh sampai akhir tahun ke-5 dari sekarang", () => {
    expect(holidayDateMax("2026-09-27")).toBe("2031-12-31");
  });

  test("tahun berjalan ± 2, terbaru di atas, plus Semua tahun", () => {
    expect(yearOptions("2026-09-27").map((option) => option.value)).toEqual([
      "",
      "2028",
      "2027",
      "2026",
      "2025",
      "2024",
    ]);
    expect(yearOptions("2026-09-27")[0].label).toBe("Semua tahun");
  });
});

describe("serverFieldError", () => {
  test("409 ganda ke field nama; pesan lain ke tingkat form", () => {
    expect(serverFieldError("Hari Libur Sudah Tersedia")).toEqual({
      field: "name",
      message: "Nama ini sudah dipakai hari libur lain di tanggal yang sama.",
    });
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});
