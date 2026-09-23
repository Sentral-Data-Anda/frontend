import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ComboboxField } from "./combobox-field";
import { ConfirmDialog } from "./confirm-dialog";
import { DateField } from "./date-field";
import { FormField } from "./form-field";
import { FormActions, FormLayout, FormSection } from "./form-layout";
import { SelectField } from "./select-field";
import { Textarea } from "./textarea";

afterEach(cleanup);

const OPTIONS = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
];

/**
 * Satu hal yang diperiksa untuk SETIAP kontrol baru: ia menerima `id`,
 * `aria-invalid`, dan `aria-describedby` dari `FormField` lewat `cloneElement`,
 * persis seperti `Input`. Tanpa itu, label dan pesan galatnya tidak pernah
 * sampai ke pembaca layar — dan kegagalannya tidak terlihat sama sekali di
 * layar yang dilihat mata.
 */
describe("kontrol baru tersambung ke FormField", () => {
  test.each([
    [
      "SelectField",
      <SelectField
        key="s"
        value=""
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    ],
    [
      "ComboboxField",
      <ComboboxField
        key="c"
        value=""
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    ],
    ["DateField", <DateField key="d" />],
    ["Textarea", <Textarea key="t" />],
  ])("%s menerima id dan aria dari FormField", (_name, control) => {
    render(
      <FormField label="Jenis kelamin" htmlFor="gender" error="Wajib dipilih">
        {control}
      </FormField>,
    );

    const field = screen.getByLabelText("Jenis kelamin");
    expect(field.id).toBe("gender");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe("gender-error");
  });
});

describe("SelectField", () => {
  test("tanpa nilai menampilkan placeholder, bukan pilihan pertama", () => {
    render(
      <SelectField
        value=""
        onValueChange={() => {}}
        options={OPTIONS}
        placeholder="Pilih jenis kelamin"
      />,
    );

    expect(screen.getByText("Pilih jenis kelamin")).toBeTruthy();
  });

  test("nilai terisi menampilkan labelnya, bukan kode enum", () => {
    render(
      <SelectField value="P" onValueChange={() => {}} options={OPTIONS} />,
    );

    expect(screen.getByRole("combobox").textContent).toContain("Perempuan");
    expect(screen.getByRole("combobox").textContent).not.toContain("P,");
  });

  test("disabled tidak bisa ditekan", () => {
    render(
      <SelectField
        value=""
        onValueChange={() => {}}
        options={OPTIONS}
        disabled
      />,
    );

    expect(screen.getByRole("combobox").hasAttribute("disabled")).toBe(true);
  });
});

describe("ComboboxField", () => {
  test("memuat: placeholder berganti dan kontrol terkunci", () => {
    render(
      <ComboboxField
        value=""
        onValueChange={() => {}}
        options={[]}
        isLoading
      />,
    );

    const input = screen.getByRole("combobox");
    expect(input.getAttribute("placeholder")).toBe("Memuat…");
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  test("tombol kosongkan hanya muncul untuk field opsional yang terisi", () => {
    const { rerender } = render(
      <ComboboxField value="L" onValueChange={() => {}} options={OPTIONS} />,
    );
    expect(screen.queryByLabelText("Kosongkan pilihan")).toBeNull();

    rerender(
      <ComboboxField
        value="L"
        onValueChange={() => {}}
        options={OPTIONS}
        isClearable
      />,
    );
    expect(screen.getByLabelText("Kosongkan pilihan")).toBeTruthy();
  });
});

describe("DateField", () => {
  test("input tanggal native, bukan kalender bikinan sendiri", () => {
    render(
      <FormField label="Tanggal lahir" htmlFor="birthDate">
        <DateField />
      </FormField>,
    );

    expect(screen.getByLabelText("Tanggal lahir").getAttribute("type")).toBe(
      "date",
    );
  });
});

describe("FormLayout", () => {
  test("fieldset disabled mematikan seluruh kontrol di dalamnya", () => {
    render(
      <FormLayout>
        <FormSection legend="Identitas" disabled>
          <FormField label="Nama" htmlFor="name">
            <input />
          </FormField>
        </FormSection>
      </FormLayout>,
    );

    // `input.disabled` TIDAK ikut berubah — properti itu hanya mencerminkan
    // atribut milik input sendiri. Yang dimatikan fieldset adalah keadaannya
    // di CSS dan di interaksi, jadi yang diperiksa `:disabled`.
    const fieldset = screen
      .getByLabelText("Nama")
      .closest("fieldset") as HTMLFieldSetElement;

    // happy-dom tidak menurunkan keadaan itu ke anaknya, jadi yang bisa
    // diperiksa di sini hanya fieldset-nya. Efek ke kontrol di dalamnya
    // diperiksa lewat render di peramban sungguhan.
    expect(fieldset.disabled).toBe(true);
  });

  test("legend dirender sebagai grup bernama, bukan sekadar teks tebal", () => {
    render(
      <FormLayout>
        <FormSection legend="Identitas">
          <input aria-label="Nama" />
        </FormSection>
        <FormActions>
          <button type="submit">Simpan</button>
        </FormActions>
      </FormLayout>,
    );

    expect(screen.getByRole("group", { name: "Identitas" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Simpan" })).toBeTruthy();
  });

  test("form tidak memakai validasi bawaan peramban", () => {
    const { container } = render(<FormLayout>{null}</FormLayout>);

    expect(container.querySelector("form")?.hasAttribute("novalidate")).toBe(
      true,
    );
  });
});

describe("ConfirmDialog", () => {
  const onRender = (isOpen: boolean) =>
    render(
      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={() => {}}
        title="Buang perubahan?"
        description="Isian yang belum disimpan akan hilang."
        confirmLabel="Buang"
        isDestructive
        onConfirm={() => {}}
      />,
    );

  test("tertutup: tidak ada apa pun di DOM", () => {
    onRender(false);

    expect(screen.queryByText("Buang perubahan?")).toBeNull();
  });

  test("terbuka: judul, penjelasan, dan dua aksi", () => {
    onRender(true);

    expect(screen.getByText("Buang perubahan?")).toBeTruthy();
    expect(
      screen.getByText("Isian yang belum disimpan akan hilang."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buang" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Batal" })).toBeTruthy();
  });
});
