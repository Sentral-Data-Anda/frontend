import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useListReturn } from "./use-list-return";

const LIST = "/kejemaatan/daftar-jemaat";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("useListReturn", () => {
  test("memakai URL daftar yang tersimpan", () => {
    window.sessionStorage.setItem(
      `list-return:${LIST}`,
      `${LIST}?status=AKTIF&page=3`,
    );

    const { result } = renderHook(() => useListReturn(LIST));

    expect(result.current).toBe(`${LIST}?status=AKTIF&page=3`);
  });

  test("jatuh ke daftar bersih bila belum ada yang tersimpan", () => {
    const { result } = renderHook(() => useListReturn(LIST));

    expect(result.current).toBe(LIST);
  });

  test("menolak nilai yang tidak lolos isSafeRedirectPath", () => {
    window.sessionStorage.setItem(
      `list-return:${LIST}`,
      "https://evil.test/kejemaatan/daftar-jemaat",
    );

    const { result } = renderHook(() => useListReturn(LIST));

    expect(result.current).toBe(LIST);
  });
});
