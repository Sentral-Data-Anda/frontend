import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import {
  DESKTOP_MEDIA_QUERY,
  TABLE_MEDIA_QUERY,
  useIsDesktop,
  useIsTableWidth,
} from "@/hooks/use-media";

import { onStubViewport } from "./viewport";

const restores: Array<() => void> = [];

const onStub = (isDesktop: boolean) => {
  const viewport = onStubViewport(isDesktop);
  restores.push(viewport.onRestore);

  return viewport;
};

afterEach(() => {
  cleanup();
  for (const restore of restores.splice(0)) restore();
});

describe("onStubViewport", () => {
  test.each([
    [true, true],
    [false, false],
  ])("lebar %p: kedua kueri dijawab sama", (isDesktop, expected) => {
    onStub(isDesktop);

    expect(window.matchMedia(DESKTOP_MEDIA_QUERY).matches).toBe(expected);
    expect(window.matchMedia(TABLE_MEDIA_QUERY).matches).toBe(expected);
    expect(window.matchMedia("(display-mode: standalone)").matches).toBe(false);
  });

  test("kueri tak dikenal tidak pernah cocok, bahkan di desktop", () => {
    onStub(true);

    expect(window.matchMedia("(min-width: 1px)").matches).toBe(false);
  });

  test("hook asli membaca stub: kedua hook, kedua arah", () => {
    const viewport = onStub(true);
    const desktop = renderHook(() => useIsDesktop());
    const table = renderHook(() => useIsTableWidth());

    expect([desktop.result.current, table.result.current]).toEqual([
      true,
      true,
    ]);

    act(() => viewport.onResize(false));

    expect([desktop.result.current, table.result.current]).toEqual([
      false,
      false,
    ]);
  });

  test("onResize memicu listener `change` yang terpasang", () => {
    const viewport = onStub(false);
    let calls = 0;
    const media = window.matchMedia(TABLE_MEDIA_QUERY);
    const listener = () => (calls += 1);

    media.addEventListener("change", listener);
    viewport.onResize(true);
    expect(calls).toBe(1);

    media.removeEventListener("change", listener);
    viewport.onResize(false);
    expect(calls).toBe(1);
  });

  test("onRestore mengembalikan matchMedia asli", () => {
    const original = window.matchMedia;
    const viewport = onStubViewport(true);

    expect(window.matchMedia).not.toBe(original);
    viewport.onRestore();
    expect(window.matchMedia).toBe(original);
  });
});
