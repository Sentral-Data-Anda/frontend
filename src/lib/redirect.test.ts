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
    // Backslash diperlakukan URL parser seperti garis miring untuk skema
    // "special" (http/https), dan ".." dinormalisasi di dalam origin yang
    // sama — hasilnya path lokal biasa, bukan navigasi keluar origin.
    // Dicatat di sini secara sengaja: perilaku ini sudah diperiksa dan
    // dianggap aman, bukan celah yang terlewat.
    expect(isSafeRedirectPath("/..\\evil.test")).toBe(true);
  });
});
