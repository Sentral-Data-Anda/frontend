import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

const LIST = "/kejemaatan/daftar-jemaat";

let search = "";

mock.module("next/navigation", () => ({
  usePathname: () => LIST,
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace: () => {} }),
}));

const { useListParams } = await import("./use-list-params");

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

const saved = () => window.sessionStorage.getItem(`list-return:${LIST}`);

describe("useListParams menyimpan return URL", () => {
  test("menyimpan pathname + search setiap parameter berubah", () => {
    search = "status=AKTIF&page=3";

    const { rerender } = renderHook(() => useListParams());

    expect(saved()).toBe(`${LIST}?status=AKTIF&page=3`);

    search = "status=AKTIF&page=4";
    rerender();

    expect(saved()).toBe(`${LIST}?status=AKTIF&page=4`);
  });

  test("daftar tanpa parameter tersimpan tanpa tanda tanya", () => {
    search = "";

    renderHook(() => useListParams());

    expect(saved()).toBe(LIST);
  });
});
