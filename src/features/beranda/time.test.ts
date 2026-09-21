import { describe, expect, test } from "bun:test";

import { formatLongDate, greetingOf, toDateKey } from "./time";

/** Jam WIB → instant UTC (WIB = UTC+7, tanpa DST). */
const wib = (date: string, time: string) =>
  new Date(`${date}T${time}:00+07:00`);

describe("toDateKey", () => {
  test("memakai tanggal WIB saat UTC masih kemarin", () => {
    // 2026-08-15 18:30 UTC = 2026-08-16 01:30 WIB.
    const now = new Date("2026-08-15T18:30:00Z");

    expect(now.toISOString().slice(0, 10)).toBe("2026-08-15");
    expect(toDateKey(now)).toBe("2026-08-16");
  });

  test("tetap hari yang sama sampai 23.59 WIB", () => {
    expect(toDateKey(wib("2026-08-16", "23:59"))).toBe("2026-08-16");
  });
});

describe("formatLongDate", () => {
  test("hari dan tanggal WIB", () => {
    expect(formatLongDate(new Date("2026-08-15T18:30:00Z"))).toBe(
      "Minggu, 16 Agustus 2026",
    );
  });
});

describe("greetingOf", () => {
  test.each([
    ["04:00", "Selamat pagi"],
    ["10:59", "Selamat pagi"],
    ["11:00", "Selamat siang"],
    ["14:59", "Selamat siang"],
    ["15:00", "Selamat sore"],
    ["17:59", "Selamat sore"],
    ["18:00", "Selamat malam"],
    ["00:30", "Selamat malam"],
    ["03:59", "Selamat malam"],
  ])("%s WIB → %s", (time, expected) => {
    expect(greetingOf(wib("2026-08-16", time))).toBe(expected);
  });

  test("membaca jam WIB, bukan jam UTC", () => {
    // 01:00 UTC = 08:00 WIB.
    expect(greetingOf(new Date("2026-08-16T01:00:00Z"))).toBe("Selamat pagi");
  });
});
