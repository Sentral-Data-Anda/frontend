import { describe, expect, test } from "bun:test";

import { isSafeRedirectPath } from "./redirect";

describe("isSafeRedirectPath", () => {
  test("menerima path relatif satu garis miring", () => {
    expect(isSafeRedirectPath("/kejemaatan/daftar-jemaat")).toBe(true);
    expect(isSafeRedirectPath("/")).toBe(true);
  });

  test("menolak URL absolut", () => {
    expect(isSafeRedirectPath("https://phishing.test/login")).toBe(false);
  });

  test("menolak URL protocol-relative", () => {
    expect(isSafeRedirectPath("//phishing.test")).toBe(false);
  });

  test("menolak akal-akalan backslash", () => {
    expect(isSafeRedirectPath("/\\phishing.test")).toBe(false);
  });

  test("menolak kosong dan null", () => {
    expect(isSafeRedirectPath("")).toBe(false);
    expect(isSafeRedirectPath(null)).toBe(false);
  });
});
