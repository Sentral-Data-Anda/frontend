import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

const SRC = join(import.meta.dir, "..");

const sourcesIn = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return sourcesIn(path);

    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });

const RELATIVE = (path: string) => path.slice(SRC.length + 1);

// Tanpa argumen kedua: penyusutan memang menampilkan sen (`isCents`).
const INLINE = /formatRupiah\(\s*Number\([^()]*\)\s*\)/;
const HAND_ROLLED = /`Rp \$\{/;

const hitsOf = (pattern: RegExp) =>
  sourcesIn(SRC)
    .filter((path) => pattern.test(readFileSync(path, "utf8")))
    .map(RELATIVE)
    .sort();

describe("situs uang", () => {
  test("pemindai benar-benar membaca features, types, components, dan lib", () => {
    const scanned = sourcesIn(SRC).map(RELATIVE);

    expect(scanned).toContain("features/keuangan/jurnal/detail/line-list.tsx");
    expect(scanned).toContain("types/persetujuan.ts");
    expect(scanned).toContain(
      "components/common/form/cash-lines/cash-line-row.tsx",
    );
    expect(scanned).toContain("lib/format.ts");
  });

  test("formatRupiah(Number(x)) inline tidak tersisa di mana pun", () => {
    // `toEqual([])` hijau juga atas himpunan subjek yang KOSONG, jadi dua
    // lapisnya dipaku di dalam test ini, bukan dititipkan ke test tetangga
    // (pedoman §7.1 lapis 5): himpunannya tidak kosong, dan predikatnya
    // benar-benar bisa menyala.
    // Lantainya dipasang pada `hitsOf`, jalur yang sama dengan asersinya —
    // lantai pada `sourcesIn` tidak menolong, karena `hitsOf` bisa rusak
    // sendiri dan asersinya tetap hijau. Terbukti: memutasi `hitsOf` jadi
    // selalu kosong membuat versi pertama test ini tetap hijau.
    expect(hitsOf(/formatAmount\(/)).not.toEqual([]);
    expect(INLINE.test("const a = formatRupiah(Number(row.amount));")).toBe(
      true,
    );

    expect(hitsOf(INLINE)).toEqual([]);
  });

  // Kurs bukan nominal: pecahan sen, jadi bukan lewat formatAmount.
  test("tidak ada awalan Rp rakitan sendiri selain kurs", () => {
    expect(hitsOf(HAND_ROLLED)).toEqual([
      "features/keuangan/mata-uang/model.ts",
    ]);
  });
});
