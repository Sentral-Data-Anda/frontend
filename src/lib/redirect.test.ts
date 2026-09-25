import { describe, expect, test } from "bun:test";

import { isSafeRedirectPath } from "./redirect";

describe("isSafeRedirectPath", () => {
  test("menerima path relatif satu garis miring", () => {
    expect(isSafeRedirectPath("/kejemaatan/daftar-jemaat")).toBe(true);
    expect(isSafeRedirectPath("/")).toBe(true);
  });

  test("menerima path dengan query dan fragment", () => {
    expect(isSafeRedirectPath("/kejemaatan/daftar-jemaat?page=2#atas")).toBe(
      true,
    );
  });

  test("menerima path dengan beberapa parameter query", () => {
    expect(
      isSafeRedirectPath("/kejemaatan/daftar-jemaat?page=3&search=budi"),
    ).toBe(true);
  });

  test("URL absolut di dalam nilai query tetap dianggap path lokal", () => {
    expect(isSafeRedirectPath("/masuk?next=https://phishing.test/login")).toBe(
      true,
    );
  });

  test("menolak URL absolut walau membawa query", () => {
    expect(isSafeRedirectPath("https://phishing.test/login?page=3")).toBe(
      false,
    );
  });

  test("menolak protocol-relative walau membawa query", () => {
    expect(isSafeRedirectPath("//phishing.test/?page=3")).toBe(false);
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

  test("menolak tab mentah — dibuang browser sebelum parsing lalu menjadi protocol-relative", () => {
    expect(isSafeRedirectPath("/\t/evil.test")).toBe(false);
  });

  test("menolak newline", () => {
    expect(isSafeRedirectPath("/\n/evil.test")).toBe(false);
  });

  test("menolak carriage return", () => {
    expect(isSafeRedirectPath("/\r/evil.test")).toBe(false);
  });

  test("menolak null byte", () => {
    expect(isSafeRedirectPath("/\x00/evil.test")).toBe(false);
  });

  test("menolak path relatif tanpa garis miring awal", () => {
    expect(isSafeRedirectPath("evil.test")).toBe(false);
  });

  test("menerima ..\\ karena tetap resolve same-origin, bukan lintas-origin", () => {
    expect(isSafeRedirectPath("/..\\evil.test")).toBe(true);
  });
});
