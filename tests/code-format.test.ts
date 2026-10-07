import { readFileSync } from "node:fs";

import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

/**
 * Benih tiruan tidak boleh lebih longgar dari server: `generateCode` be-sada
 * memberi `PREFIX-TAHUN-NOMOR` untuk setiap prefix reset YEARLY, dan tahunnya
 * dari JAM, bukan dari periode dokumennya. Mock yang menyemai `CTI-0001`
 * menyembunyikan cacat itu dari setiap layar dan setiap review.
 *
 * Daftar prefix ini disalin dari `generateCode(..., { resetPeriod: "YEARLY" })`
 * di be-sada (bukan lima — hampir tiga puluh, dan bertambah). Pin ini membaca
 * TEKS, jadi ia menjaga kecelakaan; kode yang dirakit lewat helper lain lolos.
 * Perilakunya dijaga test handler masing-masing.
 */
const YEARLY = [
  "BKK",
  "BKM",
  "BYR",
  "CTI",
  "GRN",
  "INV",
  "JRN",
  "LPB",
  "OPN",
  "PAY",
  "PGM",
  "PNY",
  "PO",
  "PRG",
  "PRQ",
  "PST",
  "PSB",
  "PYR",
  "REG",
  "RTR",
  "SKA",
  "SLP",
  "STR",
];

const ROOT = new URL("../", import.meta.url).pathname;

/** Literal yang DIBUKA dengan prefix, lalu `-` yang BUKAN diikuti tahun. */
const BARE = new RegExp(
  `[\`"'](?:${YEARLY.join("|")})-(?!\\d{4}-|\\$\\{(?:[\\w.]*(?:YEAR|Year|year)|TODAY\\.slice\\(0, 4\\)|codeYear\\(\\)))`,
);

const FILES = [...new Glob("scripts/**/*.ts").scanSync(ROOT)].filter(
  (file) => !/\.test\.ts$/.test(file),
);

describe("kode dokumen benih mock berformat PREFIX-TAHUN-NOMOR", () => {
  test("memindai seluruh scripts/", () => {
    expect(FILES.length).toBeGreaterThan(40);
    expect(FILES).toContain("scripts/mock/handlers/cuti.ts");
    expect(FILES).toContain("scripts/mock-dashboard.ts");
  });

  test("nol literal prefix tahunan tanpa tahun", () => {
    const bare = FILES.flatMap((file) =>
      readFileSync(`${ROOT}${file}`, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          !/^\s*(\/\/|\*|\/\*)/.test(line) && BARE.test(line)
            ? [`${file}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );

    expect(bare).toEqual([]);
  });

  test("kontrol: regex menangkap ejaan lama dan membiarkan yang benar", () => {
    for (const bad of [
      "`CTI-${pad(id)}`",
      '"CTI-0001"',
      "`PSB-${String(id)}`",
      "`PYR-${n}`",
    ]) {
      expect(BARE.test(bad)).toBe(true);
    }

    for (const good of [
      "`CTI-${YEAR}-${pad(id)}`",
      "`PYR-${CODE_YEAR}-${pad(id)}`",
      "`PSB-${TODAY.slice(0, 4)}-${pad(id)}`",
      "`PST-${codeYear()}-${pad(id)}`",
      '"PGM-2026-0001"',
    ]) {
      expect(BARE.test(good)).toBe(false);
    }
  });
});
