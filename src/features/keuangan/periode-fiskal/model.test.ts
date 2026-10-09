import { describe, expect, test } from "bun:test";

import {
  closeText,
  draftJournalHref,
  emptyYearDescription,
  listYearHref,
  openYearText,
  rangeText,
  reopenSchema,
  yearInMessage,
  yearOptions,
  yearTabOptions,
} from "./model";
import type { FiscalPeriodDetail } from "./types";

const PERIOD: FiscalPeriodDetail = {
  id: "fp-2026-3",
  year: 2026,
  month: 3,
  label: "Maret 2026",
  status: "OPEN",
  startDate: "2026-03-01T00:00:00.000Z",
  endDate: "2026-03-31T00:00:00.000Z",
  closedBy: null,
  closedAt: null,
  reopenedBy: null,
  reopenedAt: null,
  reopenReason: null,
  draftCount: 0,
};

describe("tahun", () => {
  test("tab selalu memuat tahun berjalan, terbaru dulu", () => {
    expect(yearTabOptions([2024, 2026], "2026-03-10")).toEqual([
      { value: "2026", label: "2026" },
      { value: "2024", label: "2024" },
    ]);
    expect(yearTabOptions([], "2026-03-10")).toEqual([
      { value: "2026", label: "2026" },
    ]);
  });

  test("pilihan buka tahun: tahun berjalan −1 sampai +1", () => {
    expect(yearOptions("2026-03-10").map((option) => option.value)).toEqual([
      "2025",
      "2026",
      "2027",
    ]);
  });
});

describe("teks", () => {
  test("buka tahun menyebut 12 periode", () => {
    expect(openYearText("2027")).toBe(
      "Membuka tahun 2027 membuat 12 periode bulanan sekaligus.",
    );
  });

  test("tutup buku menyebut akibatnya", () => {
    expect(closeText(PERIOD)).toBe(
      "Apakah Anda ingin menutup buku Maret 2026? Sesudah ditutup, tidak ada entri jurnal yang bisa ditulis ke bulan ini.",
    );
  });

  test("tutup buku menyebut hitungan yang belum beres", () => {
    expect(
      closeText({
        ...PERIOD,
        draftCount: 2,
        unpostedPersembahanCount: 3,
        unpaidApprovedExpenseCount: 1,
      }),
    ).toContain(
      "Bulan ini masih punya 2 entri draf, 3 persembahan belum diposting, 1 kas keluar disetujui belum dibayar.",
    );
  });

  test("rentang tanggal dan keadaan kosong per tahun", () => {
    expect(rangeText(PERIOD)).toBe("1 – 31 Maret 2026");
    expect(emptyYearDescription(2027)).toContain("Tahun 2027 belum dibuka");
  });
});

describe("tautan", () => {
  test("draf jurnal tertaut ke bulan periode ini", () => {
    expect(draftJournalHref(PERIOD)).toBe(
      "/finance/journal-entry?status=DRAFT&year=2026&month=3",
    );
  });

  test("pesan tutup berurutan menunjuk tahun yang harus dibuka", () => {
    expect(yearInMessage("Tutup Februari 2026 Terlebih Dahulu")).toBe("2026");
    expect(yearInMessage("Periode Sudah Tertutup")).toBeNull();
    expect(listYearHref("2026")).toBe("/finance/fiscal-period?tahun=2026");
  });
});

describe("alasan buka kembali", () => {
  test("wajib diisi dan maksimal 250 karakter", () => {
    expect(reopenSchema.safeParse({ reopenReason: "   " }).success).toBe(false);
    expect(
      reopenSchema.safeParse({ reopenReason: "a".repeat(251) }).success,
    ).toBe(false);
    expect(reopenSchema.safeParse({ reopenReason: " Koreksi " })).toMatchObject(
      {
        success: true,
        data: { reopenReason: "Koreksi" },
      },
    );
  });
});
