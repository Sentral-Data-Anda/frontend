import { describe, expect, test } from "bun:test";

import {
  toDateInput,
  addDays,
  addMonths,
  ageInYears,
  DATE_ERROR,
  endOfYearIso,
  isSameMonth,
  isWithin,
  monthGrid,
  monthOptions,
  monthRange,
  weekdayDates,
  parseDateInput,
  toInputText,
  toIsoDate,
  daysSince,
  todayJakarta,
  weekdayIndex,
} from "./date";

describe("parseDateInput — bentuk yang diterima (§7.2, wajib 1)", () => {
  test.each([
    ["12/05/1990"],
    ["12-05-1990"],
    ["12 05 1990"],
    ["12.05.1990"],
    ["12051990"],
    ["12/5/1990"],
    ["12/5/1990 "],
  ])("%s → 1990-05-12", (input) => {
    expect(parseDateInput(input)).toEqual({ iso: "1990-05-12" });
  });

  test("angka satuan tanpa nol di depan dibaca apa adanya", () => {
    expect(parseDateInput("1/5/1990")).toEqual({ iso: "1990-05-01" });
    expect(parseDateInput("01/5/1990")).toEqual({ iso: "1990-05-01" });
    expect(parseDateInput("5/1/1990")).toEqual({ iso: "1990-01-05" });
  });

  test("spasi di ujung tidak menggagalkan", () => {
    expect(parseDateInput("  12/05/1990  ")).toEqual({ iso: "1990-05-12" });
  });

  test("kosong bukan galat — field tanggal boleh dikosongkan", () => {
    expect(parseDateInput("")).toEqual({ iso: "" });
    expect(parseDateInput("   ")).toEqual({ iso: "" });
  });
});

describe("parseDateInput — yang ditolak (wajib 1, 2, 3)", () => {
  test("tahun dua digit ditolak dengan pesan TAHUN, bukan pesan tanggal", () => {
    expect(parseDateInput("12/05/90")).toEqual({ error: DATE_ERROR.shortYear });
    expect(parseDateInput("1/5/90")).toEqual({ error: DATE_ERROR.shortYear });
  });

  test("tanggal yang tidak ada ditolak", () => {
    expect(parseDateInput("31/02/1990")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("00/05/1990")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("12/13/1990")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("32/01/1990")).toEqual({ error: DATE_ERROR.invalid });
  });

  test("bentuk yang tidak dikenal ditolak", () => {
    expect(parseDateInput("12 Mei 1990")).toEqual({
      error: DATE_ERROR.invalid,
    });
    expect(parseDateInput("besok")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("12/05")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("120519900")).toEqual({ error: DATE_ERROR.invalid });
  });

  test("kabisat: 29/02/2024 diterima, 29/02/2023 dan 29/02/1900 ditolak", () => {
    expect(parseDateInput("29/02/2024")).toEqual({ iso: "2024-02-29" });
    expect(parseDateInput("29/02/2023")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("29/02/1900")).toEqual({ error: DATE_ERROR.invalid });
    expect(parseDateInput("29/02/2000")).toEqual({ iso: "2000-02-29" });
  });
});

describe("toIsoDate", () => {
  test("menolak 31 Februari alih-alih menggesernya ke 3 Maret", () => {
    expect(toIsoDate(31, 2, 1990)).toBeNull();
    expect(toIsoDate(28, 2, 1990)).toBe("1990-02-28");
  });

  test("nol di depan selalu dua digit", () => {
    expect(toIsoDate(1, 1, 2026)).toBe("2026-01-01");
    expect(toIsoDate(9, 9, 1999)).toBe("1999-09-09");
  });

  test("bilangan pecahan ditolak", () => {
    expect(toIsoDate(1.5, 1, 2026)).toBeNull();
    expect(toIsoDate(1, 1, Number.NaN)).toBeNull();
  });
});

describe("toInputText (wajib 4: normalisasi saat blur)", () => {
  test("ISO → dd/mm/yyyy dengan nol di depan", () => {
    expect(toInputText("1990-05-12")).toBe("12/05/1990");
    expect(toInputText("2026-01-01")).toBe("01/01/2026");
  });

  test("nilai kosong atau cacat menghasilkan string kosong, bukan 'Invalid'", () => {
    expect(toInputText("")).toBe("");
    expect(toInputText("1990-05")).toBe("");
    expect(toInputText("bukan tanggal")).toBe("");
  });

  test("ketik '1/5/1990' → nilai form 1990-05-01 → kotak jadi '01/05/1990'", () => {
    const parsed = parseDateInput("1/5/1990");

    expect(parsed.iso).toBe("1990-05-01");
    expect(toInputText(parsed.iso ?? "")).toBe("01/05/1990");
  });
});

describe("ageInYears (wajib 5)", () => {
  test("bertambah TEPAT pada hari ulang tahun, bukan sehari sebelumnya", () => {
    expect(ageInYears("1990-05-12", "2026-05-11")).toBe(35);
    expect(ageInYears("1990-05-12", "2026-05-12")).toBe(36);
    expect(ageInYears("1990-05-12", "2026-05-13")).toBe(36);
  });

  test("lahir 29 Februari: bertambah 1 Maret di tahun biasa", () => {
    expect(ageInYears("2000-02-29", "2026-02-28")).toBe(25);
    expect(ageInYears("2000-02-29", "2026-03-01")).toBe(26);
  });

  test("bayi yang lahir hari ini berumur 0, bukan null", () => {
    expect(ageInYears("2026-09-23", "2026-09-23")).toBe(0);
  });

  test("tanggal di masa depan dan nilai cacat menghasilkan null", () => {
    expect(ageInYears("2027-01-01", "2026-09-23")).toBeNull();
    expect(ageInYears("", "2026-09-23")).toBeNull();
    expect(ageInYears("1990-05-12", "bukan tanggal")).toBeNull();
  });
});

describe("todayJakarta", () => {
  test("memakai WIB, bukan zona perangkat", () => {
    expect(todayJakarta(new Date("2026-09-23T20:00:00.000Z"))).toBe(
      "2026-09-24",
    );
    expect(todayJakarta(new Date("2026-09-23T02:00:00.000Z"))).toBe(
      "2026-09-23",
    );
  });

  test("bentuknya YYYY-MM-DD, siap dibandingkan sebagai string", () => {
    expect(todayJakarta()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("daysSince", () => {
  test("menghitung hari kalender WIB, tidak pernah negatif", () => {
    const lateTuesday = new Date("2026-09-22T16:30:00Z");

    expect(daysSince("2026-09-20T03:10:00.000Z", lateTuesday)).toBe(2);
    expect(daysSince("2026-09-22T16:00:00.000Z", lateTuesday)).toBe(0);
    expect(daysSince("2026-09-24T00:00:00.000Z", lateTuesday)).toBe(0);
  });
});

describe("endOfYearIso", () => {
  test("31 Desember tahun WIB ditambah n tahun", () => {
    expect(endOfYearIso(5, new Date("2026-09-23T02:00:00.000Z"))).toBe(
      "2031-12-31",
    );
    expect(endOfYearIso(0, new Date("2026-12-31T18:00:00.000Z"))).toBe(
      "2027-12-31",
    );
  });
});

describe("aritmetika kalender (kisi §7.5)", () => {
  test("addDays menyeberangi bulan dan tahun", () => {
    expect(addDays("1990-05-12", 1)).toBe("1990-05-13");
    expect(addDays("1990-05-31", 1)).toBe("1990-06-01");
    expect(addDays("1990-01-01", -1)).toBe("1989-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  test("addMonths menjepit ke akhir bulan tujuan, bukan melimpah", () => {
    expect(addMonths("1990-01-31", 1)).toBe("1990-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("1990-05-12", -5)).toBe("1989-12-12");
    expect(addMonths("1990-12-01", 1)).toBe("1991-01-01");
  });

  test("weekdayIndex: Senin 0 … Minggu 6", () => {
    expect(weekdayIndex("2026-09-21")).toBe(0);
    expect(weekdayIndex("2026-09-23")).toBe(2);
    expect(weekdayIndex("2026-09-27")).toBe(6);
  });

  test("monthGrid selalu 42 sel, mulai Senin, memuat seluruh bulan", () => {
    const grid = monthGrid("2026-09-15");

    expect(grid).toHaveLength(42);
    expect(weekdayIndex(grid[0])).toBe(0);
    expect(grid).toContain("2026-09-01");
    expect(grid).toContain("2026-09-30");
    expect(monthGrid("2026-02-01")).toHaveLength(42);
  });

  test("isSameMonth dan isWithin", () => {
    expect(isSameMonth("2026-09-30", "2026-09-01")).toBe(true);
    expect(isSameMonth("2026-10-01", "2026-09-01")).toBe(false);
    expect(isWithin("1990-05-12", "1900-01-01", "2026-09-23")).toBe(true);
    expect(isWithin("2030-01-01", "1900-01-01", "2026-09-23")).toBe(false);
    expect(isWithin("1899-01-01", "1900-01-01")).toBe(false);
    expect(isWithin("2030-01-01")).toBe(true);
  });
});

test("toDateInput memotong jam, tanpa menyentuh zona waktu", () => {
  expect(toDateInput("1990-05-12T00:00:00.000Z")).toBe("1990-05-12");
  expect(toDateInput(null)).toBe("");
});

describe("monthOptions", () => {
  test("bulan depan, bulan berjalan, lalu 11 bulan sebelumnya", () => {
    const options = monthOptions("2026-01-15");

    expect(options).toHaveLength(13);
    expect(options[0]).toEqual({ value: "2026-02", label: "Februari 2026" });
    expect(options[1].value).toBe("2026-01");
    expect(options[12].value).toBe("2025-02");
  });
});

describe("monthRange", () => {
  test("hari pertama dan terakhir bulan, termasuk kabisat", () => {
    expect(monthRange("2026-02")).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(monthRange("2028-02").endDate).toBe("2028-02-29");
  });

  test("nilai tak terbaca = kosong", () => {
    expect(monthRange("")).toEqual({ startDate: "", endDate: "" });
  });
});

describe("weekdayDates", () => {
  test("hari terpilih (0 = Senin) sampai tanggal akhir inklusif", () => {
    expect(weekdayDates("2026-10-01", "2026-10-15", [3], 26)).toEqual([
      "2026-10-01",
      "2026-10-08",
      "2026-10-15",
    ]);
  });

  test("beberapa hari per minggu, urut tanggal", () => {
    expect(weekdayDates("2026-10-05", "2026-10-15", [1, 3], 26)).toEqual([
      "2026-10-06",
      "2026-10-08",
      "2026-10-13",
      "2026-10-15",
    ]);
  });

  test("berhenti di batas, melewati akhir tahun; tanpa hari = kosong", () => {
    expect(weekdayDates("2026-12-24", "2027-12-31", [3], 3)).toEqual([
      "2026-12-24",
      "2026-12-31",
      "2027-01-07",
    ]);
    expect(weekdayDates("2026-10-01", "2026-10-15", [], 26)).toEqual([]);
  });
});
