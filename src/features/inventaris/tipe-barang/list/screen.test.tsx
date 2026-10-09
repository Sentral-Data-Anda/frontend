import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: false,
    isCanCreate: false,
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { TipeBarangListScreen } = await import("./screen");

afterEach(cleanup);

describe("gerbang VIEW daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa daftar dan tanpa permintaan", () => {
    const original = globalThis.fetch;
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    render(<TipeBarangListScreen />);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Item Category"),
    ).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(isFetched).toBe(false);

    globalThis.fetch = original;
  });
});
