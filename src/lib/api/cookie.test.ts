import { describe, expect, test } from "bun:test";

import { stripCookieDomain } from "./cookie";

describe("stripCookieDomain", () => {
  test("membuang atribut Domain dan mempertahankan sisanya", () => {
    const result = stripCookieDomain(
      "accessToken=abc; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
    );

    expect(result).not.toContain("Domain");
    expect(result).toContain("HttpOnly");
    expect(result).toContain("SameSite=Strict");
    expect(result).toContain("Max-Age=900");
  });

  test("tidak terganggu huruf besar-kecil dan spasi", () => {
    expect(stripCookieDomain("a=b;   DOMAIN=x.test; Path=/")).not.toContain(
      "x.test",
    );
  });
});
