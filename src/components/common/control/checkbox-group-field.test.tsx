import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { CheckboxGroupField } from "./checkbox-group-field";

afterEach(cleanup);

const OPTIONS = [
  { value: "1", label: "Liturgis" },
  { value: "2", label: "Pemusik" },
  { value: "3", label: "Singer" },
];

const onRender = (
  value: string[],
  extra: Partial<Parameters<typeof CheckboxGroupField>[0]> = {},
) => {
  const picked: string[][] = [];

  render(
    <CheckboxGroupField
      id="rolePelayan"
      label="Tugas"
      value={value}
      onValueChange={(next) => picked.push(next)}
      options={OPTIONS}
      {...extra}
    />,
  );

  return picked;
};

describe("CheckboxGroupField", () => {
  test("legend menjadi nama grup; centang mengikuti nilai", () => {
    onRender(["2"]);

    expect(screen.getByRole("group", { name: "Tugas" })).toBeTruthy();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", { name: "Pemusik" })
        .checked,
    ).toBe(true);
  });

  test("menambah menjaga urutan opsi, bukan urutan klik", () => {
    const picked = onRender(["3"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "Liturgis" }));

    expect(picked).toEqual([["1", "3"]]);
  });

  test("mencabut centang membuang nilainya", () => {
    const picked = onRender(["1", "3"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "Liturgis" }));

    expect(picked).toEqual([["3"]]);
  });

  test("galat: checkbox pertama membawa id dan aria-invalid; grup menunjuk pesannya", () => {
    onRender([], { error: "Pilih minimal satu tugas." });

    const first = screen.getByRole("checkbox", { name: "Liturgis" });
    expect(first.id).toBe("rolePelayan");
    expect(first.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe(
      "rolePelayan-error",
    );
    expect(screen.getByText("Pilih minimal satu tugas.")).toBeTruthy();
  });

  test("disabled dan isDisabled per opsi mengunci checkbox", () => {
    onRender([], {
      options: [
        ...OPTIONS,
        { value: "4", label: "Kolektan", isDisabled: true },
      ],
    });

    expect(
      screen
        .getByRole("checkbox", { name: "Kolektan" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("checkbox", { name: "Liturgis" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  test("tanpa opsi menampilkan pesan kosong", () => {
    onRender([], { options: [], emptyMessage: "Belum ada alat musik" });

    expect(screen.getByText("Belum ada alat musik")).toBeTruthy();
  });
});
