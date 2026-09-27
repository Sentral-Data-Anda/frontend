import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ChoiceField } from "./choice-field";

afterEach(cleanup);

const OPTIONS = [
  { value: "", label: "Menunggu saya" },
  { value: "pengajuan", label: "Pengajuan saya" },
];

describe("ChoiceField", () => {
  test("label tersembunyi tetap menjadi nama grup; memilih memanggil onValueChange", () => {
    const onValueChange = mock();

    render(
      <ChoiceField
        id="tampil"
        label="Tampilkan"
        isLabelVisible={false}
        value=""
        onValueChange={onValueChange}
        options={OPTIONS}
      />,
    );

    expect(screen.getByRole("group", { name: "Tampilkan" })).toBeTruthy();
    expect(
      (screen.getByRole("radio", { name: "Menunggu saya" }) as HTMLInputElement)
        .checked,
    ).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Pengajuan saya" }));

    expect(onValueChange).toHaveBeenCalledWith("pengajuan");
  });

  test("disabled mematikan semua pilihan", () => {
    render(
      <ChoiceField
        id="kind"
        label="Penanda tangan"
        value=""
        onValueChange={mock()}
        options={OPTIONS}
        disabled
      />,
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect((radio as HTMLInputElement).disabled).toBe(true);
    }
  });
});
