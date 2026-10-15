import { describe, expect, test } from "bun:test";

import {
  balanceOf,
  groupAmount,
  lineAmount,
  lineAmountText,
  sumAmounts,
  sumProductsText,
  toDecimal,
  toDigits,
} from "./number";

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

describe("lineAmountText", () => {
  test("jumlah x harga sebagai string desimal", () => {
    expect(lineAmountText("4", "185000")).toBe("740000");
    expect(lineAmountText("2", "520.5")).toBe("1041");
    expect(lineAmountText("1.5", "0.5")).toBe("0.75");
  });

  test("tetap tepat di atas 15 digit signifikan", () => {
    expect(lineAmountText("3", "3000000000000000.33")).toBe(
      "9000000000000000.99",
    );
    expect(lineAmountText("99999999", "99999999")).toBe("9999999800000001");
    expect(lineAmountText("1", "12345678901234567.89")).toBe(
      "12345678901234567.89",
    );
  });

  test("pecahan di bawah sen dibulatkan setengah-naik", () => {
    expect(lineAmountText("0.5", "0.01")).toBe("0.01");
    expect(lineAmountText("0.4", "0.01")).toBeNull();
    expect(lineAmountText("1.005", "1")).toBe("1.01");
  });

  test("kosong, nol, dan bukan angka menjadi null", () => {
    expect(lineAmountText("", "185000")).toBeNull();
    expect(lineAmountText("2", "")).toBeNull();
    expect(lineAmountText("0", "185000")).toBeNull();
    expect(lineAmountText("-2", "5")).toBeNull();
    expect(lineAmountText("a", "5")).toBeNull();
  });

  test("tiga faktor dibulatkan sekali, bukan dua kali", () => {
    // 3 x 10.0050 = 30.0150 tepat; dibulatkan dulu jadi 30.02 lalu dikali 2
    // memberi 60.04, satu sen lebih dari yang be-sada simpan.
    expect(lineAmountText("3", "10.0050", "2")).toBe("60.03");
    expect(lineAmountText("2", "1500.5000", "15250.750000")).toBe(
      "45767500.75",
    );
  });
});

describe("sumProductsText", () => {
  test("membulatkan sekali di akhir, bukan per baris", () => {
    // Per baris: 0.01 + 0.01 + 0.01 = 0.03. Sekali di akhir: 0.015 -> 0.02.
    expect(
      sumProductsText([
        ["1", "0.005"],
        ["1", "0.005"],
        ["1", "0.005"],
      ]),
    ).toBe("0.02");
  });

  test("tiga faktor, skala berbeda antar baris", () => {
    expect(
      sumProductsText([
        ["2", "1000.5000", "15000.500000"],
        ["1", "250.2500", "15000.500000"],
      ]),
    ).toBe("33769875.63");
  });

  test("baris yang belum terisi dilewati, bukan membatalkan total", () => {
    expect(
      sumProductsText([
        ["2", "150000", "1"],
        ["", "150000", "1"],
        ["3", "", "1"],
      ]),
    ).toBe("300000");
  });

  test("tanpa baris sama sekali menjadi nol", () => {
    expect(sumProductsText([])).toBe("0");
  });
});

describe("balanceOf", () => {
  const line = (debit: string, credit: string) => ({ debit, credit });

  test("entri seimbang", () => {
    const result = balanceOf([line("1500000", ""), line("", "1500000")]);

    expect(result).toEqual({
      debit: "1500000",
      credit: "1500000",
      difference: "0",
      shortSide: null,
      isBalanced: true,
    });
  });

  test("debit lebih besar: yang kurang adalah kredit", () => {
    const result = balanceOf([line("1550000", ""), line("", "1500000")]);

    expect(result.difference).toBe("50000");
    expect(result.shortSide).toBe("credit");
    expect(result.isBalanced).toBe(false);
  });

  test("kredit lebih besar: yang kurang adalah debit", () => {
    const result = balanceOf([line("1000", ""), line("", "2500")]);

    expect(result.difference).toBe("1500");
    expect(result.shortSide).toBe("debit");
  });

  test("satu sisi masih kosong: sisi itu yang kurang, sebesar penuh", () => {
    const only = balanceOf([line("500000", "")]);

    expect(only.shortSide).toBe("credit");
    expect(only.difference).toBe("500000");
  });

  test("desimal dijumlahkan sebagai sen, bukan float", () => {
    const result = balanceOf([
      line("0.1", ""),
      line("0.2", ""),
      line("", "0.3"),
    ]);

    expect(result.debit).toBe("0.30");
    expect(result.isBalanced).toBe(true);
  });

  test("pembulatan dua desimal tidak menyembunyikan selisih", () => {
    const result = balanceOf([
      line("", "0.005"),
      line("", "0.005"),
      line("0.01", ""),
    ]);

    expect(result.credit).toBe("0");
    expect(result.shortSide).toBe("credit");
    expect(result.isBalanced).toBe(false);
  });

  test("entri kosong tidak seimbang dan tidak menuduh sisi mana pun", () => {
    expect(balanceOf([]).isBalanced).toBe(false);
    expect(balanceOf([]).shortSide).toBeNull();
    expect(balanceOf([line("", ""), line("", "")]).shortSide).toBeNull();
  });

  test("nominal besar tetap tepat", () => {
    const result = balanceOf([
      line("9999999999999.99", ""),
      line("", "9999999999999.99"),
    ]);

    expect(result.isBalanced).toBe(true);
    expect(result.debit).toBe("9999999999999.99");
  });

  test("ribuan bertitik dari tampilan diabaikan", () => {
    expect(balanceOf([line("1.500", "")]).debit).toBe("1.50");
  });
});

describe("sumAmounts", () => {
  test("menjumlah baris kas", () => {
    expect(sumAmounts(["450000", "1250000", ""])).toBe("1700000");
  });

  test("menjaga dua desimal", () => {
    expect(sumAmounts(["0.05", "0.05"])).toBe("0.10");
  });

  test("tanpa baris menghasilkan nol", () => {
    expect(sumAmounts([])).toBe("0");
  });
});
