import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { PasswordInput } from "./password-input";

afterEach(cleanup);

describe("PasswordInput", () => {
  test("toggle menukar type, aria-label, dan aria-pressed bersamaan", () => {
    render(<PasswordInput aria-label="Password" />);

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Tampilkan password" });

    expect(input.getAttribute("type")).toBe("password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(input.getAttribute("type")).toBe("text");
    expect(toggle.getAttribute("aria-label")).toBe("Sembunyikan password");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  test("tombol toggle tidak men-submit form", () => {
    let submitCount = 0;

    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitCount += 1;
        }}
      >
        <PasswordInput aria-label="Password" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan password" }));

    expect(submitCount).toBe(0);
  });
});
