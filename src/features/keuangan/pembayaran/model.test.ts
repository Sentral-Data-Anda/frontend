import { describe, expect, test } from "bun:test";

import {
  ANONYMOUS,
  bookedOf,
  defaultDateRange,
  fixOfCode,
  giverOf,
  isSameRange,
  isStalePending,
  NOTHING_TO_POST,
  paymentDateOf,
  postingStatusOf,
  rangeOfMonth,
  toPaymentApiFilters,
} from "./model";
import type { Payment } from "./types";

const JOURNAL = {
  publicId: "jrn-0002",
  code: "JRN-2026-0002",
  status: "POSTED",
} as const;

const paid = (extra: Partial<Payment>) =>
  ({
    status: "PAID",
    persembahan: null,
    journal: null,
    ...extra,
  }) as Payment;

describe("pemberi", () => {
  test("jemaat menang atas nama bebas, keduanya kosong berarti anonim", () => {
    expect(
      giverOf({
        jemaat: { publicId: "j", code: "JMT-0001", name: "Andreas" },
        donorName: "Hamba Tuhan",
      }),
    ).toBe("Andreas");
    expect(giverOf({ jemaat: null, donorName: "Hamba Tuhan" })).toBe(
      "Hamba Tuhan",
    );
    expect(giverOf({ jemaat: null, donorName: null })).toBe(ANONYMOUS);
  });
});

describe("di buku", () => {
  test("empat kombinasi milik baris lunas", () => {
    expect(bookedOf(paid({ persembahan: { code: "PSB-1" } }))).toBe(true);
    expect(bookedOf(paid({ journal: JOURNAL }))).toBe(true);
    expect(
      bookedOf(paid({ persembahan: { code: "PSB-1" }, journal: JOURNAL })),
    ).toBe(true);
    expect(bookedOf(paid({}))).toBe(false);
  });

  test("yang belum lunas tidak punya jawaban sama sekali", () => {
    for (const status of [
      "PENDING",
      "EXPIRED",
      "FAILED",
      "CANCELLED",
    ] as const) {
      expect(bookedOf(paid({ status }))).toBeNull();
    }
  });
});

describe("pending yang sudah lewat", () => {
  test("ditandai hanya saat masih PENDING dan tanggalnya lewat", () => {
    const expiredAt = "2026-09-20T10:00:00.000Z";

    expect(isStalePending({ status: "PENDING", expiredAt }, "2026-09-21")).toBe(
      true,
    );
    expect(isStalePending({ status: "PENDING", expiredAt }, "2026-09-20")).toBe(
      false,
    );
    expect(
      isStalePending({ status: "PENDING", expiredAt: null }, "2026-09-21"),
    ).toBe(false);
    expect(isStalePending({ status: "EXPIRED", expiredAt }, "2026-09-21")).toBe(
      false,
    );
  });
});

describe("tanggal baris", () => {
  test("tanggal bayar menang; tanpa itu dipakai tanggal dibuat", () => {
    expect(
      paymentDateOf({ paidAt: "2026-09-20T00:00:00.000Z", createdAt: "x" }),
    ).toBe("2026-09-20T00:00:00.000Z");
    expect(paymentDateOf({ paidAt: null, createdAt: "y" })).toBe("y");
  });
});

describe("saringan daftar", () => {
  test("tanpa bulan: 30 hari terakhir", () => {
    expect(toPaymentApiFilters({}, "2026-09-30")).toEqual({
      ...defaultDateRange("2026-09-30"),
      purpose: "",
    });
  });

  test("dengan bulan: rentang bulan itu", () => {
    expect(
      toPaymentApiFilters(
        { bulan: "2026-08", tujuan: "PERSEMBAHAN" },
        "2026-09-30",
      ),
    ).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      purpose: "PERSEMBAHAN",
    });
  });
});

describe("rentang posting", () => {
  test("bulan sah menjadi rentang, bulan kosong tidak", () => {
    expect(rangeOfMonth("2026-08")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(rangeOfMonth("")).toBeNull();
  });

  test("dua rentang sama hanya bila kedua ujungnya sama", () => {
    const range = { from: "2026-08-01", to: "2026-08-31" };

    expect(isSameRange(range, { ...range })).toBe(true);
    expect(isSameRange(range, { from: "2026-08-01", to: "2026-08-30" })).toBe(
      false,
    );
    expect(isSameRange(range, null)).toBe(false);
  });
});

describe("perbaikan dicabangkan lewat kode, bukan prosa", () => {
  test("kode yang dikenal menautkan ke layar yang memperbaikinya", () => {
    expect(fixOfCode("SETTING_EMPTY")?.href).toBe(
      "/keuangan/setelan-akuntansi",
    );
    expect(fixOfCode("ACCOUNT_INACTIVE")?.href).toBe("/keuangan/akun");
    expect(fixOfCode("PERIOD_CLOSED")?.href).toBe("/keuangan/periode-fiskal");
    expect(fixOfCode("PERIOD_NOT_OPEN")?.href).toBe("/keuangan/periode-fiskal");
  });

  test("kode kosong atau asing tidak menebak tautan", () => {
    expect(fixOfCode(null)).toBeNull();
    expect(fixOfCode(undefined)).toBeNull();
    expect(fixOfCode("")).toBeNull();
    expect(fixOfCode("SOMETHING_NEW")).toBeNull();
  });

  // Kebalikannya: prosa yang memuat kata kuncinya tetapi tanpa `code` adalah
  // justru regresi yang disembunyikan pencocokan teks.
  test("pesan yang memuat kata kuncinya tanpa kode tidak memicu cabangnya", () => {
    expect(
      fixOfCode("Setelan Akuntansi PENDAPATAN_EVENT Belum Diisi"),
    ).toBeNull();
    expect(fixOfCode("Periode Fiskal September 2026 Sudah Ditutup")).toBeNull();
    expect(fixOfCode("Akun 1-300 Sudah Tidak Aktif")).toBeNull();
  });
});

describe("status bilah aksi posting", () => {
  test("tanpa pratinjau: pratinjau diminta dulu", () => {
    expect(postingStatusOf(null)).toContain("Jalankan pratinjau dulu");
  });

  test("pratinjau tanpa baris yang bisa diposting: alasannya tertulis", () => {
    expect(postingStatusOf({ result: { posted: 0 } })).toBe(NOTHING_TO_POST);
  });

  test("pratinjau dengan baris yang bisa diposting: tanpa status", () => {
    expect(postingStatusOf({ result: { posted: 2 } })).toBeUndefined();
  });
});
