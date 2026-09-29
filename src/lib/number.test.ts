import { describe, expect, test } from "bun:test";

import { toDecimal, toDigits } from "./number";

describe("toDigits", () => {
  test("membuang selain angka", () => {
    expect(toDigits("Rp 1.250.000", 12)).toBe("1250000");
  });

  test("membuang nol di depan tetapi menyisakan nol tunggal", () => {
    expect(toDigits("007", 6)).toBe("7");
    expect(toDigits("0", 6)).toBe("0");
    expect(toDigits("000", 6)).toBe("0");
  });

  test("dipotong sesuai panjang maksimum", () => {
    expect(toDigits("1234567", 3)).toBe("123");
  });

  test("kosong tetap kosong", () => {
    expect(toDigits("abc", 6)).toBe("");
  });
});

describe("toDecimal", () => {
  test("koma dan titik jadi titik", () => {
    expect(toDecimal("15800,50", 12, 6)).toBe("15800.50");
    expect(toDecimal("15800.5", 12, 6)).toBe("15800.5");
  });

  test("hanya satu pemisah, pecahan dipotong", () => {
    expect(toDecimal("1.2.3456", 11, 2)).toBe("1.23");
  });

  test("pemisah di ujung dipertahankan saat mengetik", () => {
    expect(toDecimal("12,", 11, 2)).toBe("12.");
    expect(toDecimal(",5", 11, 2)).toBe("0.5");
  });

  test("bilangan bulat dipotong dan nol depan dibuang", () => {
    expect(toDecimal("00123456", 4, 2)).toBe("1234");
    expect(toDecimal("US$ 1250", 11, 2)).toBe("1250");
  });

  test("tanpa pecahan membuang pemisah", () => {
    expect(toDecimal("12,5", 11, 0)).toBe("12");
  });

  test("kosong tetap kosong", () => {
    expect(toDecimal("abc", 11, 2)).toBe("");
  });
});
