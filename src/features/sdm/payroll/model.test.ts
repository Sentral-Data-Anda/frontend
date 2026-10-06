import { describe, expect, test } from "bun:test";

import { todayJakarta } from "@/lib/date";

import { openableMonths, payslipOf, periodLabel, yearOptions } from "./model";
import type { PayrollRunDetail, Payslip } from "./types";

describe("periode ditulis dengan nama bulan", () => {
  // Pelajaran Anggaran A8: "5/2026" terbaca sebagai tanggal, bukan bulan.
  test.each([
    [2026, 1, "Januari 2026"],
    [2026, 5, "Mei 2026"],
    [2026, 12, "Desember 2026"],
    [2025, 8, "Agustus 2025"],
  ])("%s-%s → %s", (year, month, expected) => {
    expect(periodLabel({ year, month })).toBe(expected);
  });
});

describe("bulan yang boleh dibuka", () => {
  // be-sada menolak bulan yang BELUM MULAI dan menerima bulan BERJALAN, jadi
  // pemilihnya menawarkan sampai bulan berjalan dan tidak lebih.
  test("tahun berjalan berhenti di bulan berjalan", () => {
    const months = openableMonths("2026", "2026-05-17");

    expect(months.map((month) => month.value)).toEqual([
      "05",
      "04",
      "03",
      "02",
      "01",
    ]);
    expect(months[0].label).toBe("Mei 2026");
  });

  test("Januari menawarkan satu bulan, bukan nol", () => {
    expect(
      openableMonths("2026", "2026-01-01").map((one) => one.value),
    ).toEqual(["01"]);
  });

  test("Desember menawarkan dua belas", () => {
    expect(openableMonths("2026", "2026-12-31")).toHaveLength(12);
  });

  test("tahun lampau menawarkan dua belas, tahun depan nol", () => {
    expect(openableMonths("2025", "2026-05-17")).toHaveLength(12);
    expect(openableMonths("2027", "2026-05-17")).toEqual([]);
  });
});

describe("pilihan tahun", () => {
  test("tahun berjalan lebih dulu, lalu empat ke belakang", () => {
    expect(yearOptions("2026-05-17").map((one) => one.value)).toEqual([
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
    ]);
  });

  test("tahun berjalan selalu ikut, apa pun hari ini", () => {
    expect(yearOptions()[0].value).toBe(todayJakarta().slice(0, 4));
  });
});

describe("slip dicari pada run yang sedang dibuka", () => {
  const slip = (code: string): Payslip => ({
    id: 1,
    publicId: `slp-${code}`,
    code,
    karyawanId: 1,
    basicSalary: "1.00",
    grossAmount: "1.00",
    deductionTotal: "0.00",
    netAmount: "1.00",
    note: null,
    karyawan: { publicId: "k", code: "KRY-0001", name: "Ani" },
    lines: [],
  });

  const run = {
    payslips: [slip("SLP-2026-0001"), slip("SLP-2026-0002")],
  } as PayrollRunDetail;

  test("cocok tanpa peduli huruf besar-kecil, seperti rutenya", () => {
    expect(payslipOf(run, "slp-2026-0002")?.code).toBe("SLP-2026-0002");
  });

  test("kode dari run lain tidak cocok", () => {
    expect(payslipOf(run, "SLP-2026-0009")).toBeNull();
  });
});
