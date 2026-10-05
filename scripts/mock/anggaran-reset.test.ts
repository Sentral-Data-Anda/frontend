import { afterEach, describe, expect, test } from "bun:test";

import { resetAnggaranStores } from "./anggaran-reset";
import {
  BUDGET_ALLOCATION,
  BUDGET_SETTING,
  BUDGET_USAGE_REPORT,
  PROGRAM,
} from "./anggaran-store";

afterEach(resetAnggaranStores);

/**
 * Benihnya direkam saat `anggaran-reset.ts` pertama dimuat. Satu-satunya cara
 * rekaman itu salah adalah ada yang mengosongkan store SEBELUM modul itu
 * dimuat — dan kalau itu terjadi, seluruh berkas test anggaran akan
 * "mengembalikan" larik kosong dan lulus karena tidak ada apa-apa untuk
 * dilanggar. Penjaga ini menjalankan reset lalu melihat hasilnya, jadi ia
 * jatuh pada kasus itu, bukan menebaknya dari sumber.
 */
describe("benih store anggaran", () => {
  test("reset mengembalikan baris, bukan larik kosong", () => {
    PROGRAM.splice(0, PROGRAM.length);
    BUDGET_ALLOCATION.splice(0, BUDGET_ALLOCATION.length);
    BUDGET_USAGE_REPORT.splice(0, BUDGET_USAGE_REPORT.length);

    resetAnggaranStores();

    expect(PROGRAM.length).toBeGreaterThan(0);
    expect(BUDGET_ALLOCATION.length).toBeGreaterThan(0);
    expect(BUDGET_USAGE_REPORT.length).toBeGreaterThan(0);
  });

  test("reset memulihkan baris yang diubah, bukan hanya jumlahnya", () => {
    const row = PROGRAM[0]!;
    const name = row.name;

    row.name = "Diubah test";
    resetAnggaranStores();

    expect(PROGRAM[0]?.name).toBe(name);
  });

  test("setelan bulan mulai juga ikut pulih", () => {
    const { startMonth } = BUDGET_SETTING;

    BUDGET_SETTING.startMonth = startMonth === 7 ? 1 : 7;
    resetAnggaranStores();

    expect(BUDGET_SETTING.startMonth).toBe(startMonth);
  });
});
