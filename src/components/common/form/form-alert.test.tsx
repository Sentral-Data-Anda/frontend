import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { FormAlert } from "./form-alert";

afterEach(cleanup);

describe("FormAlert", () => {
  test("bawaan galat: role alert, nada destructive", () => {
    render(<FormAlert title="Data belum tersimpan." message="Gagal." />);

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("border-destructive");
    expect(screen.getByText("Gagal.").className).toContain("text-destructive");
  });

  test("tone info: role status, tanpa warna galat", () => {
    render(<FormAlert tone="info" title="Catatan" message="Hanya baca." />);

    const status = screen.getByRole("status");
    expect(status.className).toContain("bg-card");
    expect(status.className).not.toContain("destructive");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Hanya baca.").className).toContain(
      "text-foreground",
    );
  });

  test("tone warning: role status, bingkai warning", () => {
    render(
      <FormAlert
        tone="warning"
        title="Melebihi perkiraan"
        message="Tetap bisa disimpan."
      />,
    );

    const status = screen.getByRole("status");
    expect(status.className).toContain("border-warning");
    expect(status.className).not.toContain("destructive");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
