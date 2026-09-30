import { describe, expect, test } from "bun:test";

import { todayJakarta } from "@/lib/date";

import {
  flattenTree,
  ledgerHref,
  money,
  readDate,
  readMonth,
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
    expect(readTab("arus-kas")).toBe("neraca");
    expect(readTab("")).toBe("neraca");
  });

  test("bulan kosong atau salah bentuk memakai bulan berjalan", () => {
    expect(readMonth("2026-03")).toBe("2026-03");
    expect(readMonth("2026")).toBe(todayJakarta().slice(0, 7));
    expect(readMonth("")).toBe(todayJakarta().slice(0, 7));
  });

  test("tanggal kosong memakai hari ini", () => {
    expect(readDate("2026-03-15")).toBe("2026-03-15");
    expect(readDate("")).toBe(todayJakarta());
  });
});

describe("tautan", () => {
  test("buku besar membawa akun dan bulan", () => {
    expect(ledgerHref("1-100", "2026-03")).toBe(
      "/keuangan/laporan-keuangan?tab=buku-besar&akun=1-100&bulan=2026-03",
    );
  });

  test("kode akun berkarakter khusus di-encode", () => {
    expect(ledgerHref("1/100", "2026-03")).toContain("akun=1%2F100");
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
