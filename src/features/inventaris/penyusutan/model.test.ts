import { describe, expect, test } from "bun:test";

import {
  actionErrorTitle,
  defaultPeriod,
  periodLabel,
  periodOptions,
  postText,
  runFormSchema,
  runStatusText,
  toRunPayload,
  yearOptions,
} from "./model";

const TODAY = "2026-09-29";

describe("periode", () => {
  test("periodLabel memakai nama bulan Indonesia", () => {
    expect(periodLabel(2026, 9)).toBe("September 2026");
    expect(periodLabel(2025, 12)).toBe("Desember 2025");
  });

  test("pilihan periode: 12 bulan sampai bulan berjalan, tanpa bulan depan", () => {
    const options = periodOptions(TODAY);

    expect(options).toHaveLength(12);
    expect(options[0].value).toBe("2026-09");
    expect(options.at(-1)?.value).toBe("2025-10");
  });

  test("bawaan = bulan sesudah periode terbaru; kosong → bulan berjalan", () => {
    expect(defaultPeriod({ year: 2026, month: 7 }, TODAY)).toBe("2026-08");
    expect(defaultPeriod({ year: 2025, month: 12 }, "2026-01-15")).toBe(
      "2026-01",
    );
    expect(defaultPeriod(undefined, TODAY)).toBe("2026-09");
  });

  test("bawaan di luar pilihan jatuh ke bulan berjalan", () => {
    expect(defaultPeriod({ year: 2026, month: 9 }, TODAY)).toBe("2026-09");
    expect(defaultPeriod({ year: 2020, month: 1 }, TODAY)).toBe("2026-09");
  });

  test("payload { year, month } dari YYYY-MM", () => {
    expect(toRunPayload({ period: "2026-08" })).toEqual({
      year: 2026,
      month: 8,
    });
  });

  test("skema menolak periode kosong", () => {
    const result = runFormSchema.safeParse({ period: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Periode wajib dipilih");
  });

  test("filter tahun: tahun berjalan mundur 6 tahun", () => {
    expect(yearOptions(TODAY).map((option) => option.value)).toEqual([
      "",
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
    ]);
  });
});

describe("status dan pesan", () => {
  test("status draf menyebut belum dihitung", () => {
    expect(runStatusText({ status: "DRAFT", updatedAt: null })).toBe(
      "Draf · belum dihitung",
    );
    expect(runStatusText({ status: "DRAFT", updatedAt: "2026-09-01" })).toBe(
      "Draf",
    );
    expect(runStatusText({ status: "POSTED", updatedAt: "2026-09-01" })).toBe(
      "Diposting",
    );
  });

  test("teks konfirmasi posting memuat periode dan total Rupiah", () => {
    expect(postText("Agustus 2026", "1234567.5")).toBe(
      "Apakah Anda ingin memposting penyusutan Agustus 2026 sebesar Rp 1.234.567,5? Jurnal dibuat otomatis dan tidak bisa dibatalkan.",
    );
  });

  test("galat akun menunjuk Setelan Akuntansi; galat lain judul aksi", () => {
    expect(
      actionErrorTitle(
        "post",
        "Akun Beban Penyusutan Belum Diatur Di Setelan Akuntansi",
      ),
    ).toContain("Setelan Akuntansi");
    expect(
      actionErrorTitle(
        "post",
        "Akun 5-1100 Untuk Beban Penyusutan Tidak Aktif",
      ),
    ).toContain("Setelan Akuntansi");
    expect(
      actionErrorTitle(
        "post",
        "Periode Fiskal Untuk Bulan Ini Belum Dibuka Atau Sudah Ditutup",
      ),
    ).toBe("Penyusutan belum diposting.");
    expect(actionErrorTitle("calculate", "x")).toBe(
      "Penyusutan belum dihitung.",
    );
  });
});
