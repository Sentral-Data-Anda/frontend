import { describe, expect, test } from "bun:test";

import { toDigits } from "./number";

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
