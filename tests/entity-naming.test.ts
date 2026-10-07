import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { MENU_DESCRIPTION } from "@/config/menu";

/**
 * Satu entitas, satu nama: "Badan pelayanan". "komisi" hanya sah sebagai NAMA
 * ("Komisi Pemuda") atau kata biasa ("diadakan komisi tertentu"), jadi pin ini
 * dibatasi pada permukaan yang menyebut ENTITASNYA, bukan seluruh repo.
 *
 * Keluarga ejaan ditangkap satu regex tanpa peka huruf besar: komisi, Komisi,
 * komisinya, berkomisi.
 */
const FAMILY = /komisi/i;

const ROOT = new URL("../", import.meta.url).pathname;

const SURFACE = [
  "src/features/persetujuan/setelan-persetujuan/form/tier-fields.tsx",
  "src/features/beranda/widgets/dummy/budget-use-widget.tsx",
];

describe("sebutan entitas badan pelayanan", () => {
  test("deskripsi menu tidak menyebut komisi", () => {
    const values = Object.values(MENU_DESCRIPTION);

    expect(values.length).toBeGreaterThan(30);
    expect(values.filter((text) => FAMILY.test(text))).toEqual([]);
  });

  test.each(SURFACE)("%s tidak menyebut komisi", (file) => {
    expect(readFileSync(`${ROOT}${file}`, "utf8")).not.toMatch(FAMILY);
  });

  test("kontrol: regex menangkap tiap ejaan keluarganya", () => {
    for (const text of ["komisi", "Komisi", "komisinya", "berkomisi"]) {
      expect(FAMILY.test(text)).toBe(true);
    }
  });
});
