import { expect, test } from "bun:test";

import { niceCeiling } from "./income-expense-chart";

test("batas sumbu = 1/2/5 × 10ⁿ terdekat di atas nilai terbesar", () => {
  expect(niceCeiling(86_400_000)).toBe(100_000_000);
  expect(niceCeiling(41_000_000)).toBe(50_000_000);
  expect(niceCeiling(12_000_000)).toBe(20_000_000);
  expect(niceCeiling(50_000_000)).toBe(50_000_000);
  // Tanpa posting (bagan akun belum siap): sumbu tetap valid, batang nol.
  expect(niceCeiling(0)).toBe(1);
});
