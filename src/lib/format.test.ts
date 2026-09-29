import { describe, expect, test } from "bun:test";

import {
  formatDate,
  firstNameOf,
  formatDateTime,
  formatNumber,
  formatRupiah,
  formatRupiahCompact,
  formatTimeRange,
} from "./format";

describe("formatDate", () => {
  test("tidak menggeser hari untuk calendar date tengah malam UTC", () => {
    expect(formatDate("1990-01-09T00:00:00.000Z")).toBe("9 Januari 1990");
  });

  test("menerima bentuk YYYY-MM-DD apa adanya", () => {
    expect(formatDate("2026-06-16")).toBe("16 Juni 2026");
  });

  test("mengembalikan tanda hubung untuk nilai yang tidak bisa diurai", () => {
    expect(formatDate("bukan tanggal")).toBe("-");
  });
});

describe("formatDateTime", () => {
  test("membawa jam, bukan hanya tanggal", () => {
    const result = formatDateTime("2026-06-16T02:30:00.000Z");

    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}[.:]\d{2}/);
  });

  test("mengembalikan tanda hubung untuk nilai yang tidak bisa diurai", () => {
    expect(formatDateTime(new Date("x"))).toBe("-");
  });
});

describe("formatRupiah", () => {
  test("titik ribuan, Rp di depan, minus sebelum Rp", () => {
    expect(formatRupiah(248_560_000)).toBe("Rp 248.560.000");
    expect(formatRupiah(-1_500)).toBe("−Rp 1.500");
  });

  test("pecahan selalu dua desimal", () => {
    expect(formatRupiah(1_333_333.4)).toBe("Rp 1.333.333,40");
    expect(formatRupiah(166_666.67)).toBe("Rp 166.666,67");
    expect(formatRupiah(-0.5)).toBe("−Rp 0,50");
  });

  test("isCents: selalu dua desimal supaya kolom angka sejajar", () => {
    expect(formatRupiah(200_000, { isCents: true })).toBe("Rp 200.000,00");
    expect(formatRupiah(0, { isCents: true })).toBe("Rp 0,00");
  });

  test("ringkas: jt / M", () => {
    expect(formatRupiahCompact(86_400_000)).toBe("Rp 86,4\u00a0jt");
    expect(formatRupiahCompact(1_250_000_000)).toBe("Rp 1,3\u00a0M");
    expect(formatRupiahCompact(-2_100_000)).toBe("−Rp 2,1\u00a0jt");
  });
});

describe("firstNameOf", () => {
  test("melewati gelar bertitik", () => {
    expect(firstNameOf("Pdt. Yohanes Simatupang")).toBe("Yohanes");
    expect(firstNameOf("Pnt. Dr. Maria Hutapea")).toBe("Maria");
    expect(firstNameOf("  Andreas   Sitanggang ")).toBe("Andreas");
  });

  test("nama yang seluruhnya bertitik tetap tampil", () => {
    expect(firstNameOf("A.")).toBe("A.");
  });
});

describe("formatTimeRange", () => {
  test("memakai titik dan tanda pisah", () => {
    expect(formatTimeRange("18:00", "20:30")).toBe("18.00–20.30");
  });

  test("tanpa jam selesai hanya jam mulai", () => {
    expect(formatTimeRange("07:00", null)).toBe("07.00");
    expect(formatTimeRange("07:00")).toBe("07.00");
  });
});

describe("formatNumber", () => {
  test("memakai pemisah ribuan titik", () => {
    expect(formatNumber(1250)).toBe("1.250");
    expect(formatNumber(0)).toBe("0");
  });
});
