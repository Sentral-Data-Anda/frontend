import { describe, expect, test } from "bun:test";

import {
  formatDayMonth,
  formatShare,
  MONTH_OPTIONS,
  percentOf,
  readMonth,
  sortShares,
  summarizeTypeGender,
  summarizeZones,
  toAgeShares,
  topShares,
  totalOf,
  zoneLabel,
} from "./model";
import type { ZoneRow } from "./types";

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

describe("topShares", () => {
  const shares = [9, 7, 5, 3, 1].map((count, index) => ({
    key: String(index),
    label: `S${index}`,
    count,
  }));

  test("sisa di luar batas digabung jadi satu baris Lainnya", () => {
    const top = topShares(shares, 2);

    expect(top.map((share) => [share.label, share.count])).toEqual([
      ["S0", 9],
      ["S1", 7],
      ["Lainnya", 9],
    ]);
    expect(formatShare(top[2].count, totalOf(top))).toBe("9 (36%)");
  });

  test("tanpa sisa, tidak ada baris Lainnya", () => {
    expect(topShares(shares, 5)).toEqual(shares);
    expect(topShares(shares, 8)).toEqual(shares);
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

const zone = (
  zoneChurchId: number | null,
  code: string | null,
  counts: Partial<ZoneRow> = {},
): ZoneRow => ({
  zoneChurchId,
  code,
  name: code ? `Wilayah ${code}` : null,
  isActive: zoneChurchId === null ? null : true,
  anggota: 0,
  simpatisan: 0,
  keluarga: 0,
  ...counts,
});

describe("summarizeZones", () => {
  test("wilayah urut dibuat (id), bukan kode; tanpa wilayah terakhir; total per kolom", () => {
    const report = summarizeZones([
      zone(null, null, { anggota: 3, simpatisan: 9, keluarga: 2 }),
      zone(6, "ZC-0006", { anggota: 5, simpatisan: 1, keluarga: 4 }),
      zone(1, "ZC-01", { anggota: 120, simpatisan: 14, keluarga: 41 }),
    ]);

    expect(report.rows.map((row) => row.zoneChurchId)).toEqual([1, 6, null]);
    expect(report.total).toEqual({
      anggota: 128,
      simpatisan: 24,
      keluarga: 47,
    });
    expect(report.isEmpty).toBe(false);
  });

  test("semua nol: kosong walau baris wilayah ada", () => {
    expect(summarizeZones([zone(1, "ZC-0001"), zone(null, null)]).isEmpty).toBe(
      true,
    );
  });
});

test("zoneLabel menandai nonaktif dan tanpa wilayah", () => {
  expect(zoneLabel(zone(1, "ZC-0001"))).toBe("Wilayah ZC-0001");
  expect(zoneLabel(zone(5, "ZC-0005", { isActive: false }))).toBe(
    "Wilayah ZC-0005 (nonaktif)",
  );
  expect(zoneLabel(zone(null, null))).toBe("Tanpa wilayah");
});
