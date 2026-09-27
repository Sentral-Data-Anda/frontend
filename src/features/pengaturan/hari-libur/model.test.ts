import { describe, expect, test } from "bun:test";

import {
  EMPTY_HOLIDAY_FORM,
  formatHolidayDate,
  holidayFormSchema,
  serverFieldError,
  toHolidayForm,
  toHolidayPayload,
  toHolidayRows,
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

describe("toHolidayRows", () => {
  const holiday = (
    id: number,
    date: string,
    name: string,
    isRecurring = false,
  ): Holiday => ({
    id,
    publicId: String(id),
    date: `${date}T00:00:00.000Z`,
    name,
    type: "GEREJA",
    isRecurring,
  });

  const ROWS = [
    holiday(13, "1985-09-27", "HUT Gereja", true),
    holiday(14, "2024-02-29", "Syukur Kabisat", true),
    holiday(1, "2026-01-01", "Tahun Baru"),
    holiday(12, "2026-12-25", "Natal"),
  ];

  const view = (year: string) =>
    toHolidayRows(ROWS, year).map((row) => [
      row.id,
      row.date.slice(0, 10),
      row.recurringSince,
    ]);

  test("tanpa tahun: tanggal asal dan urutan be-sada apa adanya", () => {
    expect(view("")).toEqual([
      [13, "1985-09-27", 1985],
      [14, "2024-02-29", 2024],
      [1, "2026-01-01", null],
      [12, "2026-12-25", null],
    ]);
  });

  test("dengan tahun: kejadian di tahun itu, diurutkan bersama baris lain", () => {
    expect(view("2026")).toEqual([
      [1, "2026-01-01", null],
      [13, "2026-09-27", 1985],
      [12, "2026-12-25", null],
    ]);
  });

  test("29 Februari hanya muncul di tahun kabisat", () => {
    expect(view("2028").map(([id, date]) => [id, date])).toContainEqual([
      14,
      "2028-02-29",
    ]);
    expect(view("2027").some(([id]) => id === 14)).toBe(false);
  });

  test("tahun sebelum tahun asal tidak memunculkan kejadian", () => {
    expect(view("2023").some(([id]) => id === 14)).toBe(false);
  });
});
