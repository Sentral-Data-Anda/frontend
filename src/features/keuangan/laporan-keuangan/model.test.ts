import { describe, expect, test } from "bun:test";

import { monthRange, todayJakarta } from "@/lib/date";

import {
  flattenTree,
  ledgerHref,
  money,
  readDate,
  readRange,
  readTab,
} from "./model";
import type { ReportAccount } from "./types";

const node = (
  id: number,
  code: string,
  children: ReportAccount[] = [],
): ReportAccount => ({
  id,
  code,
  name: `Akun ${code}`,
  type: "ASSET",
  total: "0",
  children,
});

describe("flattenTree", () => {
  test("membawa kedalaman dan urutan induk sebelum anak", () => {
    const rows = flattenTree([
      node(1, "1", [node(2, "1-100", [node(3, "1-110")])]),
      node(4, "2"),
    ]);

    expect(rows.map((row) => [row.code, row.depth])).toEqual([
      ["1", 0],
      ["1-100", 1],
      ["1-110", 2],
      ["2", 0],
    ]);
  });

  test("pohon kosong menghasilkan larik kosong", () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe("pembacaan parameter", () => {
  test("tab tidak dikenal jatuh ke neraca", () => {
    expect(readTab("buku-besar")).toBe("buku-besar");
    // "arus-kas" dulu dipakai sebagai contoh tab yang TIDAK dikenal di sini.
    // Sekarang dia tab sungguhan, jadi contohnya harus yang tidak akan pernah
    // jadi tab -- kalau tidak, test ini akan mengunci tab baru berikutnya
    // supaya tidak pernah bisa ditambahkan.
    expect(readTab("aset-neto")).toBe("aset-neto");
    expect(readTab("arus-kas")).toBe("arus-kas");
    expect(readTab("entah-apa")).toBe("neraca");
    expect(readTab("")).toBe("neraca");
  });

  test("rentang kosong memakai bulan berjalan", () => {
    const thisMonth = monthRange(todayJakarta().slice(0, 7));

    expect(readRange("", "")).toEqual({
      from: thisMonth.startDate,
      to: thisMonth.endDate,
    });
  });

  test("rentang setahun dibaca apa adanya", () => {
    expect(readRange("2026-01-01", "2026-12-31")).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  // Backend menjawab rentang terbalik dengan 400. Itu selalu salah ketik, dan
  // menukarnya memberi laporan yang jelas dimaksud ketimbang pesan galat.
  test("rentang terbalik ditukar, bukan ditolak", () => {
    expect(readRange("2026-12-31", "2026-01-01")).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  test("satu ujung kosong tetap jatuh ke bulan berjalan", () => {
    const thisMonth = monthRange(todayJakarta().slice(0, 7));

    expect(readRange("2026-03-05", "")).toEqual({
      from: "2026-03-05",
      to: thisMonth.endDate,
    });
  });

  test("tanggal kosong memakai hari ini", () => {
    expect(readDate("2026-03-15")).toBe("2026-03-15");
    expect(readDate("")).toBe(todayJakarta());
  });
});

describe("tautan", () => {
  const range = { from: "2026-03-01", to: "2026-03-31" };

  test("buku besar membawa akun dan rentangnya", () => {
    expect(ledgerHref("1-100", range)).toBe(
      "/report/financial-statement?tab=buku-besar&akun=1-100&dari=2026-03-01&sampai=2026-03-31",
    );
  });

  test("kode akun berkarakter khusus di-encode", () => {
    expect(ledgerHref("1/100", range)).toContain("akun=1%2F100");
  });
});

describe("money", () => {
  test("nilai kosong terbaca nol, bukan strip", () => {
    expect(money(undefined)).toBe("Rp 0");
    expect(money("0")).toBe("Rp 0");
  });

  test("negatif memakai tanda minus tipografis", () => {
    expect(money("-1500")).toBe("−Rp 1.500");
  });
});
