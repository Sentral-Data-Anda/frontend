import { describe, expect, test } from "bun:test";

import {
  daysSince,
  findNextService,
  formatDayMonth,
  formatLongDate,
  formatMonthYear,
  formatWeekdayShort,
  greetingOf,
  monthOf,
  toDateKey,
  weekKeys,
} from "./model";

const wib = (date: string, time: string) =>
  new Date(`${date}T${time}:00+07:00`);

describe("toDateKey", () => {
  test("memakai tanggal WIB saat UTC masih kemarin", () => {
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
    expect(greetingOf(new Date("2026-08-16T01:00:00Z"))).toBe("Selamat pagi");
  });
});

describe("findNextService", () => {
  const services = [{ startTime: "08:00" }, { startTime: "17:00" }];

  test("sebelum semua ibadah → yang paling pagi", () => {
    expect(findNextService(services, wib("2026-08-16", "06:30"))).toBe(
      services[0],
    );
  });

  test("tepat di jam mulai masih dihitung berikutnya", () => {
    expect(findNextService(services, wib("2026-08-16", "08:00"))).toBe(
      services[0],
    );
  });

  test("di antara dua ibadah → yang berikutnya", () => {
    expect(findNextService(services, wib("2026-08-16", "08:01"))).toBe(
      services[1],
    );
  });

  test("sesudah semua ibadah → tidak ada", () => {
    expect(
      findNextService(services, wib("2026-08-16", "19:00")),
    ).toBeUndefined();
  });

  test("memakai jam WIB, bukan UTC, lintas tengah malam", () => {
    expect(findNextService(services, new Date("2026-08-15T17:30:00Z"))).toBe(
      services[0],
    );
    expect(
      findNextService(services, new Date("2026-08-16T16:30:00Z")),
    ).toBeUndefined();
  });
});

describe("tanggal dashboard", () => {
  const lateTuesday = new Date("2026-09-22T16:30:00Z");

  test("tujuh hari mulai hari ini (WIB), melewati akhir bulan", () => {
    expect(weekKeys(new Date("2026-09-27T20:00:00Z"))).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  test("label hari & tanggal tidak bergeser dari tanggal kalender UTC", () => {
    expect(formatWeekdayShort("2026-09-22")).toBe("Sel");
    expect(formatDayMonth("2026-09-20T00:00:00.000Z")).toBe("20 Sep");
    expect(formatMonthYear("2026-09-01T00:00:00.000Z")).toBe("Sep 2026");
  });

  test("bulan dan umur tunggu memakai hari WIB", () => {
    expect(monthOf(new Date("2026-09-30T18:00:00Z"))).toBe(10);
    expect(daysSince("2026-09-20T03:10:00.000Z", lateTuesday)).toBe(2);
    expect(daysSince("2026-09-22T16:00:00.000Z", lateTuesday)).toBe(0);
  });
});
