import { describe, expect, test } from "bun:test";

import { money } from "./inventaris-store";

describe("money: Decimal Prisma = string terpendek", () => {
  test("tanpa nol di belakang, pecahan dipertahankan, null tetap null", () => {
    expect(money(0)).toBe("0");
    expect(money(1_500_000)).toBe("1500000");
    expect(money(1_666_666.7)).toBe("1666666.7");
    expect(money(312_500.05)).toBe("312500.05");
    expect(money(1 / 3)).toBe("0.33");
    expect(money(null)).toBeNull();
  });
});
