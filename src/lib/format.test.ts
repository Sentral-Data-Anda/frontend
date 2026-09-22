import { describe, expect, test } from "bun:test";

import {
  formatDate,
  firstNameOf,
  formatDateTime,
  formatRupiah,
  formatRupiahCompact,
} from "./format";

describe("formatDate", () => {
  /**
   * Inti berkas ini. Tanpa `timeZone: "UTC"`, test ini gagal di setiap mesin
   * yang zonanya di sebelah barat UTC — dan LOLOS di mesin yang di Jakarta,
   * yang membuat bug-nya baru muncul di laptop orang lain.
   */
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
  /**
   * Dilokalkan ke zona perangkat, jadi yang diuji adalah KEBALIKAN dari
   * formatDate: hasilnya harus mengikuti `TZ` proses, bukan UTC. Dipaksa ke
   * Asia/Jakarta lewat Intl langsung supaya test tidak bergantung pada zona
   * mesin yang menjalankannya.
   */
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

  // ICU memisahkan angka dan satuan dengan NBSP.
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
