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

  /**
   * Galat MENGGANTIKAN petunjuk, dan slotnya punya tinggi tetap. Dua `<p>`
   * yang muncul-hilang menggeser seluruh isi di bawahnya, dan pergeseran itu
   * menelan klik yang jatuh di antara `mousedown` dan `mouseup`.
   */
  test("galat menggantikan petunjuk, bukan menumpuk di bawahnya", () => {
    onRenderField({ hint: "Minimal 8 karakter.", error: "Terlalu pendek" });

    expect(
      screen.getByLabelText("Username").getAttribute("aria-describedby"),
    ).toBe("username-error");
    expect(screen.queryByText("Minimal 8 karakter.")).toBeNull();
    expect(screen.getByText("Terlalu pendek")).toBeTruthy();
  });

  test("slot pesan tetap memakai ruang walau kosong", () => {
    const { container } = onRenderField({});
    const slot = container.querySelector('[class*="min-h-"]');

    // Slotnya ada dan memesan tinggi walau tidak ada pesan — kalau tidak,
    // pesan yang menyisip menggeser semua kontrol di bawahnya.
    expect(slot).not.toBeNull();
    expect(slot?.textContent).toBe("");
  });
});
