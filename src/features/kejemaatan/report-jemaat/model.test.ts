import { describe, expect, test } from "bun:test";

import {
  formatDayMonth,
  formatShare,
  MONTH_OPTIONS,
  percentOf,
  readMonth,
  sortShares,
  summarizeTypeGender,
  toAgeShares,
} from "./model";

describe("sortShares", () => {
  test("jumlah terbesar dulu, seri diurutkan nama", () => {
    const sorted = sortShares([
      { key: "b", label: "Sunda", count: 5 },
      { key: "a", label: "Jawa", count: 9 },
      { key: "c", label: "Ambon", count: 5 },
    ]);

    expect(sorted.map((share) => share.label)).toEqual([
      "Jawa",
      "Ambon",
      "Sunda",
    ]);
  });
});

describe("toAgeShares", () => {
  test("urut kelompok usia, kelompok yang tidak dikirim bernilai 0", () => {
    const shares = toAgeShares([
      { Umur: ">50", Count: 4 },
      { Umur: "<12", Count: 2 },
    ]);

    expect(shares.map((share) => [share.label, share.count])).toEqual([
      ["Di bawah 12 tahun", 2],
      ["12–17 tahun", 0],
      ["18–30 tahun", 0],
      ["31–50 tahun", 0],
      ["Di atas 50 tahun", 4],
    ]);
  });
});

describe("percentOf / formatShare", () => {
  test("total nol tidak membagi dengan nol", () => {
    expect(percentOf(3, 0)).toBe(0);
  });

  test("jumlah bertitik ribuan dan persen dibulatkan", () => {
    expect(formatShare(1204, 1290)).toBe("1.204 (93%)");
  });
});

describe("summarizeTypeGender", () => {
  test("menjumlah tipe dan jenis kelamin", () => {
    const summary = summarizeTypeGender([
      { typeJemaat: "SIMPATISAN", ALL: 86, L: 39, P: 47 },
      { typeJemaat: "ANGGOTA", ALL: 1204, L: 552, P: 652 },
    ]);

    expect(summary.total).toBe(1290);
    expect(summary.male).toBe(591);
    expect(summary.female).toBe(699);
    expect(summary.member.ALL).toBe(1204);
    expect(summary.sympathizer.ALL).toBe(86);
  });

  test("tipe yang tidak dikirim be-sada bernilai 0", () => {
    const summary = summarizeTypeGender([]);

    expect(summary.total).toBe(0);
    expect(summary.sympathizer).toEqual({ ALL: 0, L: 0, P: 0 });
  });
});

describe("readMonth", () => {
  test("bulan sah dari URL dipakai", () => {
    expect(readMonth("3", "2026-09-26")).toBe(3);
  });

  test("kosong atau tidak sah jatuh ke bulan berjalan", () => {
    expect(readMonth(undefined, "2026-09-26")).toBe(9);
    expect(readMonth("13", "2026-09-26")).toBe(9);
    expect(readMonth("abc", "2026-09-26")).toBe(9);
  });
});

test("MONTH_OPTIONS berisi Januari–Desember bernilai 1–12", () => {
  expect(MONTH_OPTIONS).toHaveLength(12);
  expect(MONTH_OPTIONS[0]).toEqual({ value: "1", label: "Januari" });
  expect(MONTH_OPTIONS[11]).toEqual({ value: "12", label: "Desember" });
});

test("formatDayMonth membaca tanggal kalender UTC", () => {
  expect(formatDayMonth("1994-09-03T00:00:00.000Z")).toBe("3 September");
});
