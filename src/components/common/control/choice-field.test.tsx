import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { FormField } from "../form/form-field";

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

// Dirender DI DALAM `FormField`, bukan dengan prop yang ditulis tangan:
// yang pernah rusak adalah sambungannya. `FormField` menyuntikkan ketiga
// prop lewat `cloneElement`, dan `ChoiceField` dulu membuang dua di antaranya —
// jadi pertanyaan yang wajib dijawab hanya dapat teks merah, tanpa keadaan
// invalid, dengan `aria-describedby` menunjuk id yang tidak terpasang.
describe("ChoiceField di dalam FormField", () => {
  const onRender = (error?: string) =>
    render(
      <FormField label="Belanja komisi" htmlFor="bapelChoice" error={error}>
        <ChoiceField
          id="bapelChoice"
          label="Belanja komisi"
          isLabelVisible={false}
          value=""
          onValueChange={() => {}}
          options={OPTIONS}
        />
      </FormField>,
    );

  test("galat: pilihan pertama invalid, dan pesannya benar-benar tersambung", () => {
    onRender("Jawab lebih dulu");

    const first = screen.getByRole("radio", { name: "Menunggu saya" });

    expect(first.getAttribute("aria-invalid")).toBe("true");

    const describedBy = screen
      .getByRole("group", { name: "Belanja komisi" })
      .getAttribute("aria-describedby");

    expect(describedBy).toBe("bapelChoice-error");
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Jawab lebih dulu",
    );
  });

  test("tanpa galat tidak ada yang ditandai invalid", () => {
    onRender();

    expect(
      screen
        .getByRole("radio", { name: "Menunggu saya" })
        .getAttribute("aria-invalid"),
    ).toBeNull();
  });

  // Nama pilihan tidak boleh tertimpa nama grup. Memberi `id` ke radio pertama
  // supaya `<label for>` milik `FormField` bisa diklik justru melakukan itu.
  test("nama tiap pilihan tetap namanya sendiri", () => {
    onRender("Jawab lebih dulu");

    expect(screen.getByRole("radio", { name: "Menunggu saya" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Pengajuan saya" })).toBeTruthy();
  });
});

describe("ChoiceField — error dan hint sendiri", () => {
  const onShow = (extra: { error?: string; hint?: string }) =>
    render(
      <ChoiceField
        id="tipe"
        label="Tipe"
        value=""
        onValueChange={mock()}
        options={OPTIONS}
        {...extra}
      />,
    );

  test("error: pilihan pertama invalid dan grup menunjuk pesannya", () => {
    onShow({ error: "Pilih tipe", hint: "Petunjuk" });

    const group = screen.getByRole("group");
    const first = screen.getByRole("radio", { name: "Menunggu saya" });

    expect(first.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe("tipe-error");
    expect(document.getElementById("tipe-error")?.textContent).toBe(
      "Pilih tipe",
    );
    expect(screen.queryByText("Petunjuk")).toBeNull();
  });

  test("hint saja: tersambung, tidak invalid", () => {
    onShow({ hint: "Petunjuk" });

    expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe(
      "tipe-hint",
    );
    expect(document.getElementById("tipe-hint")?.textContent).toBe("Petunjuk");
    expect(
      screen
        .getAllByRole("radio")
        .filter((radio) => radio.getAttribute("aria-invalid") !== null),
    ).toEqual([]);
  });

  test("tanpa keduanya tidak ada pesan", () => {
    onShow({});

    expect(
      screen.getByRole("group").getAttribute("aria-describedby"),
    ).toBeNull();
    expect(document.querySelector("p")).toBeNull();
  });
});
