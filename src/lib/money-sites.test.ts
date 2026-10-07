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

// Milik agent lain saat retrofit ini dikerjakan; hapus dari daftar saat disatukan.
const PENDING_OTHER_OWNER = [
  "components/common/form/budget-lines/budget-line-list.tsx",
  "components/common/form/budget-lines/budget-line-row.tsx",
  "components/common/form/budget-lines/usage-line-list.tsx",
  "components/common/form/budget-lines/usage-line-row.tsx",
  "components/common/form/cash-lines/cash-line-list.tsx",
  "components/common/form/cash-lines/cash-line-row.tsx",
  "components/common/form/journal-lines/balance-summary.tsx",
  "components/common/form/journal-lines/journal-line-row.tsx",
];

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

  test("formatRupiah(Number(x)) inline hanya tersisa di daftar milik agent lain", () => {
    expect(hitsOf(INLINE).filter((path) => path !== "lib/format.ts")).toEqual(
      PENDING_OTHER_OWNER,
    );
  });

  // Kurs bukan nominal: pecahan sen, jadi bukan lewat formatAmount.
  test("tidak ada awalan Rp rakitan sendiri selain kurs", () => {
    expect(hitsOf(HAND_ROLLED)).toEqual([
      "features/keuangan/mata-uang/model.ts",
    ]);
  });
});
