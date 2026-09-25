import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ViewPicker } from "./view-picker";

afterEach(cleanup);

describe("ViewPicker", () => {
  test("tidak dirender untuk user satu grup", () => {
    const { container } = render(
      <ViewPicker value="all" groups={["umum"]} onPick={() => {}} />,
    );

    expect(container.innerHTML).toBe("");
  });

  test("pemicunya menyebut tampilan yang sedang aktif", () => {
    render(
      <ViewPicker
        value="finance"
        groups={["finance", "umum"]}
        onPick={() => {}}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Tampilan dashboard: Keuangan",
    });

    expect(trigger.textContent).toContain("Keuangan");
  });

  test("memilih tampilan meneruskan grupnya ke pemanggil", () => {
    const dipilih: string[] = [];

    render(
      <ViewPicker
        value="all"
        groups={["finance", "umum"]}
        onPick={(view) => dipilih.push(view)}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    const item = screen.getByRole("menuitemradio", { name: "Keuangan" });

    expect(
      screen
        .getByRole("menuitemradio", { name: "Semua" })
        .getAttribute("aria-checked"),
    ).toBe("true");

    fireEvent.click(item);

    expect(dipilih).toEqual(["finance"]);
  });
});
