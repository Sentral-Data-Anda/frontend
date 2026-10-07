import { describe, expect, test } from "bun:test";

import {
  formatAmount,
  formatAmountCents,
  formatDate,
  formatDays,
  firstNameOf,
  formatDateTime,
  formatMoney,
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

describe("formatMoney", () => {
  test("rupiah memakai formatRupiah", () => {
    expect(formatMoney(19_750_000, "IDR")).toBe("Rp 19.750.000");
  });

  test("valas: kode, spasi, desimal sesuai mata uang", () => {
    expect(formatMoney(1_250, "USD")).toBe("USD 1.250,00");
    expect(formatMoney(1_250.5, "SGD")).toBe("SGD 1.250,50");
    expect(formatMoney(-12.345, "EUR")).toBe("−EUR 12,35");
    expect(formatMoney(1_250.4, "JPY")).toBe("JPY 1.250");
  });
});

describe("formatAmount", () => {
  test("Decimal-sebagai-string, bulat dan bersen", () => {
    expect(formatAmount("4500000.00")).toBe("Rp 4.500.000");
    expect(formatAmount("4500000.50")).toBe("Rp 4.500.000,50");
  });

  test("kosong, null, dan undefined memakai satu teks yang sama", () => {
    expect(formatAmount(null)).toBe("—");
    expect(formatAmount(undefined)).toBe("—");
    expect(formatAmount("")).toBe("—");
    expect(formatAmount(null, "Belum ditetapkan")).toBe("Belum ditetapkan");
  });

  // "0.00" BUKAN kosong: potongan nol rupiah adalah angka, bukan ketiadaan.
  test("nol tetap nol", () => {
    expect(formatAmount("0.00")).toBe("Rp 0");
  });

  test("nol negatif dan nol tanpa sen tidak menjadi tanda hubung", () => {
    expect(formatAmount("-0.00")).toBe("Rp 0");
    expect(formatAmount("0")).toBe("Rp 0");
    expect(formatAmount(0)).toBe("Rp 0");
  });

  test("negatif memakai minus matematis sebelum Rp", () => {
    expect(formatAmount("-1500.00")).toBe("\u2212Rp 1.500");
  });

  test("16+ digit tampil persis, tidak lewat float", () => {
    expect(formatAmount("12345678901234567.89")).toBe(
      "Rp 12.345.678.901.234.567,89",
    );
    expect(formatAmount("-12345678901234567.89")).toBe(
      "\u2212Rp 12.345.678.901.234.567,89",
    );
    expect(formatAmount("9007199254740993")).toBe("Rp 9.007.199.254.740.993");
  });

  test("15 digit lebih sedikit sen tidak membulat naik ke triliun", () => {
    expect(formatAmount("999999999999999.99")).toBe(
      "Rp 999.999.999.999.999,99",
    );
    expect(formatAmount("999999999999999.00")).toBe("Rp 999.999.999.999.999");
  });

  test("pecahan lebih dari dua digit dibulatkan setengah-naik, membawa ke rupiah", () => {
    expect(formatAmount("1.005")).toBe("Rp 1,01");
    expect(formatAmount("1.004")).toBe("Rp 1,00");
    expect(formatAmount("99.995")).toBe("Rp 100,00");
    expect(formatAmount("0.999")).toBe("Rp 1,00");
  });

  test("minus hilang bila hasil tampil nol", () => {
    expect(formatAmount("-0.004")).toBe("Rp 0,00");
    expect(formatAmount("-0")).toBe("Rp 0");
  });

  test("teks yang bukan desimal jatuh ke jalur lama", () => {
    expect(formatAmount("1e3")).toBe("Rp 1.000");
  });
});

describe("formatAmountCents", () => {
  test("sen selalu tampil, termasuk nol dan nilai besar", () => {
    expect(formatAmountCents("200000")).toBe("Rp 200.000,00");
    expect(formatAmountCents("0.00")).toBe("Rp 0,00");
    expect(formatAmountCents("-0.00")).toBe("Rp 0,00");
    expect(formatAmountCents("-1500.5")).toBe("\u2212Rp 1.500,50");
    expect(formatAmountCents("12345678901234567.89")).toBe(
      "Rp 12.345.678.901.234.567,89",
    );
  });
});

describe("formatDays", () => {
  test("Decimal(4,1) memakai koma, bukan titik", () => {
    expect(formatDays("12.5")).toBe("12,5 hari");
    expect(formatDays("1.0")).toBe("1 hari");
    expect(formatDays("0.5")).toBe("0,5 hari");
  });
});
