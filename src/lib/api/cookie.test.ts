import { describe, expect, test } from "bun:test";

import { pickSessionCookies, stripCookieDomain } from "./cookie";

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

describe("pickSessionCookies", () => {
  test("hanya cookie sesi yang tersisa", () => {
    expect(
      pickSessionCookies(
        "sidebar_collapsed=1; accessToken=s%3Aa.b; x=y;refreshToken=r",
      ),
    ).toBe("accessToken=s%3Aa.b; refreshToken=r");
  });

  test("tanpa cookie sesi = kosong", () => {
    expect(pickSessionCookies("sidebar_collapsed=1")).toBe("");
  });
});
