import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { FormField } from "./form-field";

afterEach(cleanup);

const onRenderField = (props: { error?: string; hint?: string }) =>
  render(
    <FormField label="Username" htmlFor="username" {...props}>
      <input />
    </FormField>,
  );

describe("FormField", () => {
  test("label tersambung ke kontrol lewat id yang diinjeksi", () => {
    onRenderField({});

    expect(screen.getByLabelText("Username").id).toBe("username");
  });

  test("tanpa galat: tidak ada aria-invalid maupun aria-describedby", () => {
    onRenderField({});

    const input = screen.getByLabelText("Username");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });

  test("dengan galat: aria-invalid dan aria-describedby menunjuk pesannya", () => {
    onRenderField({ error: "Username wajib diisi" });

    const input = screen.getByLabelText("Username");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    const message = document.getElementById(
      input.getAttribute("aria-describedby") ?? "",
    );
    expect(message?.textContent).toBe("Username wajib diisi");
  });

  /**
   * Alert per-field sengaja tidak ada: submit dengan semua field kosong akan
   * meletupkan beberapa alert serentak. role="alert" milik galat root saja.
   */
  test("galat per-field TIDAK memakai role=alert", () => {
    onRenderField({ error: "Username wajib diisi" });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("petunjuk dan galat sama-sama ikut aria-describedby", () => {
    onRenderField({ hint: "Minimal 8 karakter.", error: "Terlalu pendek" });

    expect(
      screen.getByLabelText("Username").getAttribute("aria-describedby"),
    ).toBe("username-hint username-error");
  });
});
