import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { NoFormAccess } from "./no-form-access";

afterEach(cleanup);

describe("NoFormAccess", () => {
  test("judul, alasan, saran admin, dan tautan kembali", () => {
    render(
      <NoFormAccess
        title="Tidak bisa menambah ibadah"
        description="Peran Anda hanya bisa melihat data ibadah."
        backHref="/peribadahan/ibadah"
        backLabel="Kembali ke Ibadah"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tidak bisa menambah ibadah" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data ibadah."),
    ).toBeTruthy();
    expect(screen.getByText(/Hubungi administrator/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Ibadah" })
        .getAttribute("href"),
    ).toBe("/peribadahan/ibadah");
  });
});
