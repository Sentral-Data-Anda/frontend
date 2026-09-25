import { afterEach, describe, expect, test } from "bun:test";

import {
  readListReturn,
  saveListFocus,
  saveListReturn,
  clearListFocus,
  readListFocus,
} from "./list-return";

const LIST = "/kejemaatan/daftar-jemaat";

afterEach(() => window.sessionStorage.clear());

describe("readListReturn", () => {
  test("memakai URL tersimpan milik daftar itu", () => {
    saveListReturn(LIST, `${LIST}?status=AKTIF&page=3`);

    expect(readListReturn(LIST)).toBe(`${LIST}?status=AKTIF&page=3`);
  });

  test("tanpa nilai tersimpan: daftar bersih", () => {
    expect(readListReturn(LIST)).toBe(LIST);
  });

  test("menolak nilai yang tidak lolos isSafeRedirectPath", () => {
    for (const evil of [
      "https://evil.test/kejemaatan/daftar-jemaat",
      "//evil.test",
      "/kejemaatan/daftar-jemaat\n/evil",
    ]) {
      window.sessionStorage.setItem(`list-return:${LIST}`, evil);
      expect(readListReturn(LIST)).toBe(LIST);
    }
  });

  test("menolak URL daftar lain", () => {
    window.sessionStorage.setItem(`list-return:${LIST}`, "/keuangan/kas-masuk");

    expect(readListReturn(LIST)).toBe(LIST);
  });
});

describe("list-focus", () => {
  test("dibaca sekali lalu hilang", () => {
    saveListFocus(LIST, "JMT-0007");

    expect(readListFocus(LIST)).toBe("JMT-0007");
    expect(readListFocus(LIST)).toBe("JMT-0007");

    clearListFocus(LIST);
    expect(readListFocus(LIST)).toBeNull();
  });
});
