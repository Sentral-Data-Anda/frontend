import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { monthLabel, todayJakarta } from "@/lib/date";
import type { BudgetSetting, CeilingUsage } from "@/types/anggaran";

import {
  BUDGET_SETTING,
  budgetYearView,
} from "../../../../scripts/mock/anggaran-store";

import {
  allocationDeleteText,
  allocationFormSchema,
  amountText,
  barTitleOf,
  batchFormSchema,
  budgetYearSentence,
  errorFixOf,
  percentOf,
  pickYear,
  startMonthOptions,
  taggedParts,
  toAllocationPayload,
  toBatchPayload,
  untaggedOf,
  yearLabelOf,
  yearSelectOptions,
  yearTabOptions,
} from "./model";
import type { BudgetAllocation } from "./types";

const usage = (next: Partial<CeilingUsage> = {}): CeilingUsage => ({
  year: 2026,
  ceiling: "10000000",
  committed: "4000000",
  remaining: "6000000",
  isWithinCeiling: true,
  disbursed: "8000000",
  reported: "2000000",
  untagged: "0",
  ...next,
});

const budgetYear = (year: number, label: string) => ({
  year,
  startMonth: 7,
  from: `${year}-07-01`,
  to: `${year + 1}-06-30`,
  label,
});

const allocation = (
  publicId: string,
  name: string,
  next: Partial<CeilingUsage> = {},
): BudgetAllocation => ({
  publicId,
  year: 2026,
  budgetYear: budgetYear(2026, "label dari server"),
  amount: "10000000",
  bapel: { publicId: `bpl-${publicId}`, code: "BPL-1", name },
  usage: usage(next),
});

const errorOf = (message: string, code: string | null) =>
  new FetchError(400, message, [], code);

describe("skema pagu anggaran", () => {
  const valid = { bapelId: "2", year: "2026", amount: "45000000" };

  const pathsOf = (values: Record<string, string>) => {
    const parsed = allocationFormSchema.safeParse(values);

    return parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.path.join("."));
  };

  test("komisi, tahun, dan nominal wajib", () => {
    expect(pathsOf({ bapelId: "", year: "", amount: "" })).toEqual([
      "bapelId",
      "year",
      "amount",
    ]);
    expect(pathsOf(valid)).toEqual([]);
  });

  test("nol dan negatif ditolak, tepat di batas diterima", () => {
    expect(pathsOf({ ...valid, amount: "0" })).toEqual(["amount"]);
    expect(pathsOf({ ...valid, amount: "-5000" })).toEqual(["amount"]);
    expect(pathsOf({ ...valid, amount: "9999999999999" })).toEqual([]);
    expect(pathsOf({ ...valid, amount: "10000000000000" })).toEqual(["amount"]);
  });

  test("lebih dari dua angka di belakang koma ditolak", () => {
    expect(pathsOf({ ...valid, amount: "1000.12" })).toEqual([]);
    expect(pathsOf({ ...valid, amount: "1000.123" })).toEqual(["amount"]);
  });

  test("payload hanya bapelId, year, dan amount", () => {
    expect(toAllocationPayload(valid)).toEqual({
      bapelId: 2,
      year: 2026,
      amount: "45000000",
    });
    expect(Object.keys(toAllocationPayload(valid))).toEqual([
      "bapelId",
      "year",
      "amount",
    ]);
  });
});

describe("skema batch", () => {
  const pathsOf = (values: {
    year: string;
    items: { bapelId: string; amount: string }[];
  }) => {
    const parsed = batchFormSchema.safeParse(values);

    return parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.path.join("."));
  };

  test("baris cacat bergalat ke indeksnya", () => {
    expect(
      pathsOf({
        year: "2026",
        items: [
          { bapelId: "2", amount: "1000" },
          { bapelId: "", amount: "0" },
        ],
      }),
    ).toEqual(["items.1.bapelId", "items.1.amount"]);
  });

  test("komisi yang sama dua kali ditolak di baris kedua", () => {
    expect(
      pathsOf({
        year: "2026",
        items: [
          { bapelId: "2", amount: "1000" },
          { bapelId: "2", amount: "2000" },
        ],
      }),
    ).toEqual(["items.1.bapelId"]);
  });

  test("payload batch satu tahun dan daftar baris", () => {
    expect(
      toBatchPayload({
        year: "2026",
        items: [{ bapelId: "3", amount: "1000" }],
      }),
    ).toEqual({ year: 2026, items: [{ bapelId: 3, amount: "1000" }] });
  });
});

describe("angka dan batang", () => {
  test("pagu yang belum ditetapkan bukan Rp 0", () => {
    expect(amountText(null)).toBe("Belum ditetapkan");
    expect(amountText("0")).toBe("Rp 0");
  });

  test("batang menggambar dilaporkan terhadap pagu, bukan dicairkan", () => {
    expect(percentOf(usage())).toBe(20);
    expect(percentOf(usage({ reported: "10000000" }))).toBe(100);
    expect(percentOf(usage({ reported: "12000000" }))).toBe(120);
    expect(percentOf(usage({ ceiling: null }))).toBe(0);
  });

  test("judul batang menyebut sumbernya", () => {
    expect(barTitleOf("Komisi Pemuda")).toContain("Dilaporkan");
    expect(barTitleOf("Komisi Pemuda")).not.toContain("Dicairkan");
  });
});

describe("sisa tak bertanda", () => {
  const rows = [
    allocation("a", "Komisi Anak", { disbursed: "1000000" }),
    allocation("b", "Komisi Pemuda", { disbursed: "2000000" }),
  ];

  test("bagian per komisi memakai yang dicairkan dan menaut ke halamannya", () => {
    expect(taggedParts(rows)).toEqual([
      {
        key: "a",
        label: "Komisi Anak",
        amount: "1000000",
        href: "/budgeting/budget/a",
      },
      {
        key: "b",
        label: "Komisi Pemuda",
        amount: "2000000",
        href: "/budgeting/budget/b",
      },
    ]);
  });

  test("sisa dibaca dari baris mana pun dan nol tetap nilai", () => {
    expect(untaggedOf(rows)).toBe("0");
    expect(untaggedOf([allocation("c", "X", { untagged: "5000000" })])).toBe(
      "5000000",
    );
    expect(untaggedOf([])).toBe("0");
  });
});

describe("label tahun milik server", () => {
  // Tahun fixture dijauhkan dari tahun kalender: kalau layar menghitung tahun
  // berjalan sendiri dari hari ini, test ini yang gagal.
  const serverYear = Number(todayJakarta().slice(0, 4)) - 3;
  const setting: BudgetSetting = {
    startMonth: 7,
    budgetYear: budgetYear(serverYear, `${serverYear} label server`),
    budgetYears: [
      budgetYear(serverYear - 1, `${serverYear - 1} label server`),
      budgetYear(serverYear, `${serverYear} label server`),
    ],
  };

  test("tab tahun memakai bilangan tahunnya, pilihan form memakai label server", () => {
    expect(yearTabOptions(setting.budgetYears)).toEqual([
      { value: String(serverYear - 1), label: String(serverYear - 1) },
      { value: String(serverYear), label: String(serverYear) },
    ]);
    expect(yearSelectOptions(setting.budgetYears)).toEqual([
      {
        value: String(serverYear - 1),
        label: `${serverYear - 1} label server`,
      },
      { value: String(serverYear), label: `${serverYear} label server` },
    ]);
  });

  test("label tahun terpilih diambil apa adanya, tanpa dirakit", () => {
    expect(yearLabelOf(setting.budgetYears, String(serverYear))).toBe(
      `${serverYear} label server`,
    );
    expect(yearLabelOf(setting.budgetYears, String(serverYear + 5))).toBe("");
  });

  test("tahun bawaan datang dari server, bukan dari tanggal hari ini", () => {
    expect(pickYear("", setting)).toBe(String(serverYear));
    expect(pickYear("", setting)).not.toBe(todayJakarta().slice(0, 4));
    expect(pickYear(String(serverYear + 9), setting)).toBe(
      String(serverYear + 9),
    );
    expect(pickYear("", undefined)).toBe("");
  });

  // Kalimat pratinjau adalah rumus kedua untuk rentang tahun pelayanan — satu
  // pengecualian yang disengaja, karena bulan yang belum disimpan tidak punya
  // label server. Dipakukan ke rentang server untuk SELURUH dua belas bulan
  // mulai: menghitung ulang rumus yang sama di sini akan setuju dengan dirinya
  // sendiri walaupun keduanya salah.
  test("kalimat pratinjau sepakat dengan rentang server di tiap bulan mulai", () => {
    const saved = BUDGET_SETTING.startMonth;

    try {
      for (let startMonth = 1; startMonth <= 12; startMonth += 1) {
        BUDGET_SETTING.startMonth = startMonth;

        const view = budgetYearView(serverYear);
        const sentence = budgetYearSentence(serverYear, startMonth);

        expect(sentence).toContain(monthLabel(view.from.slice(0, 7)));
        expect(sentence).toContain(monthLabel(view.to.slice(0, 7)));
      }
    } finally {
      BUDGET_SETTING.startMonth = saved;
    }
  });

  test("kalimat pratinjau berubah mengikuti pilihan yang belum disimpan", () => {
    expect(budgetYearSentence(serverYear, 7)).not.toBe(
      budgetYearSentence(serverYear, 1),
    );
  });

  test("pilihan bulan mulai dua belas, urut Januari sampai Desember", () => {
    const options = startMonthOptions();

    expect(options).toHaveLength(12);
    expect(options.map((option) => option.value)).toEqual(
      Array.from({ length: 12 }, (_, index) => String(index + 1)),
    );
    expect(options.every((option) => /^\D+$/.test(option.label))).toBe(true);
  });
});

describe("galat server", () => {
  test("CEILING_IN_USE menawarkan ubah nominal", () => {
    expect(errorFixOf(errorOf("Sudah Dipakai", "CEILING_IN_USE"))).toContain(
      "Ubah nominalnya",
    );
  });

  test("pesan yang memuat kata program tanpa code tidak memicu tawaran", () => {
    expect(
      errorFixOf(errorOf("Pagu Anggaran Ini Sudah Dipakai Oleh Program", null)),
    ).toBeNull();
  });

  test("code tak dikenal dirender tanpa tawaran", () => {
    expect(errorFixOf(errorOf("Galat lain", "SOMETHING_ELSE"))).toBeNull();
    expect(errorFixOf(new Error("bukan galat server"))).toBeNull();
  });

  test("BUDGET_YEAR_LOCKED menjelaskan kenapa", () => {
    expect(errorFixOf(errorOf("Terkunci", "BUDGET_YEAR_LOCKED"))).toContain(
      "program yang disetujui",
    );
  });
});

describe("konfirmasi hapus", () => {
  test("berbunyi dihapus permanen dan memakai label tahun server", () => {
    const text = allocationDeleteText({
      bapel: { publicId: "b", code: "BPL-2", name: "Komisi Pemuda" },
      budgetYear: budgetYear(2026, "2026/2027 (label server)"),
    });

    expect(text).toContain("dihapus permanen");
    expect(text).toContain("Komisi Pemuda");
    expect(text).toContain("2026/2027 (label server)");
  });
});
