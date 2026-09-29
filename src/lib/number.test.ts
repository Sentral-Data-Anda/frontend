import { describe, expect, test } from "bun:test";

import { groupAmount, lineAmount, toDecimal, toDigits } from "./number";

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
  test("koma jadi titik desimal, titik ribuan dibuang", () => {
    expect(toDecimal("15.800,50", 12, 6)).toBe("15800.50");
    expect(toDecimal("15800,5", 12, 6)).toBe("15800.5");
    expect(toDecimal("15.800", 12, 6)).toBe("15800");
  });

  test("hanya koma pertama, pecahan dipotong", () => {
    expect(toDecimal("1,2,3456", 11, 2)).toBe("1.23");
  });

  test("koma di ujung dipertahankan saat mengetik", () => {
    expect(toDecimal("12,", 11, 2)).toBe("12.");
    expect(toDecimal(",5", 11, 2)).toBe("0.5");
  });

  test("bilangan bulat dipotong dan nol depan dibuang", () => {
    expect(toDecimal("00123456", 4, 2)).toBe("1234");
    expect(toDecimal("USD 1.250", 11, 2)).toBe("1250");
  });

  test("tanpa pecahan membuang koma", () => {
    expect(toDecimal("12,5", 11, 0)).toBe("12");
  });

  test("kosong tetap kosong", () => {
    expect(toDecimal("abc", 11, 2)).toBe("");
  });
});

describe("groupAmount", () => {
  test("titik ribuan, koma desimal", () => {
    expect(groupAmount("185000")).toBe("185.000");
    expect(groupAmount("1250000000000")).toBe("1.250.000.000.000");
    expect(groupAmount("15800.5")).toBe("15.800,5");
    expect(groupAmount("12.")).toBe("12,");
    expect(groupAmount("999")).toBe("999");
    expect(groupAmount("")).toBe("");
  });

  test("bolak-balik dengan toDecimal", () => {
    expect(toDecimal(groupAmount("1234567.89"), 11, 2)).toBe("1234567.89");
  });
});

describe("lineAmount", () => {
  test("jumlah × harga", () => {
    expect(lineAmount("4", "185000")).toBe(740_000);
    expect(lineAmount("2", "520.5")).toBe(1_041);
  });

  test("kosong atau nol → null (tampil —)", () => {
    expect(lineAmount("", "185000")).toBeNull();
    expect(lineAmount("2", "")).toBeNull();
    expect(lineAmount("0", "185000")).toBeNull();
  });
});
