import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, jest, test } from "bun:test";

import { useLoadingWindow } from "./use-loading-window";

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

const options = { delayMs: 150, minVisibleMs: 800 };

describe("useLoadingWindow", () => {
  test("tunggu yang lebih cepat dari ambang tidak menampilkan apa pun", () => {
    jest.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingWindow(isLoading, options),
      { initialProps: { isLoading: true } },
    );

    act(() => jest.advanceTimersByTime(140));
    expect(result.current).toBe(false);

    rerender({ isLoading: false });
    act(() => jest.advanceTimersByTime(2_000));
    expect(result.current).toBe(false);
  });

  test("muncul setelah ambang", () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useLoadingWindow(true, options));

    act(() => jest.advanceTimersByTime(149));
    expect(result.current).toBe(false);

    act(() => jest.advanceTimersByTime(2));
    expect(result.current).toBe(true);
  });

  test("sudah tampil: bertahan sampai batas minimum, lalu hilang", () => {
    jest.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingWindow(isLoading, options),
      { initialProps: { isLoading: true } },
    );

    act(() => jest.advanceTimersByTime(150));
    expect(result.current).toBe(true);

    // Data tiba 200ms setelah layar tunggu tampil.
    act(() => jest.advanceTimersByTime(200));
    rerender({ isLoading: false });

    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(120));
    expect(result.current).toBe(false);
  });

  test("tunggu yang panjang: batas minimum sudah lewat, langsung hilang", () => {
    jest.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingWindow(isLoading, options),
      { initialProps: { isLoading: true } },
    );

    act(() => jest.advanceTimersByTime(150 + 3_000));
    rerender({ isLoading: false });
    act(() => jest.advanceTimersByTime(1));

    expect(result.current).toBe(false);
  });
});
