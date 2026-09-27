import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useEffect } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { FIRST_INVALID, revealField } from "@/lib/form-error";

import { ComboboxField } from "./combobox-field";

afterEach(cleanup);

const SavingForm = ({ field }: { field: string }) => {
  const isBusy = useBoolean(true);

  useEffect(() => {
    if (!isBusy.value) revealField(field);
  }, [isBusy.value, field]);

  return (
    <form>
      <button type="button" onClick={isBusy.onFalse}>
        Selesai
      </button>

      <fieldset disabled={isBusy.value}>
        <ComboboxField
          id="jemaat"
          value=""
          onValueChange={() => {}}
          options={[{ value: "1", label: "Budi" }]}
          disabled={isBusy.value}
          aria-invalid
        />
      </fieldset>
    </form>
  );
};

describe("ComboboxField sesudah simpan ditolak", () => {
  test.each([
    ["galat klien (FIRST_INVALID)", FIRST_INVALID],
    ["galat server (id field)", "jemaat"],
  ])("%s: fokus masuk ke input pada render yang sama", (_, field) => {
    render(<SavingForm field={field} />);
    screen.getByRole("combobox").scrollIntoView = () => {};

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));

    expect(document.activeElement?.id).toBe("jemaat");
  });
});

describe("ComboboxField dengan onCreate", () => {
  const OPTIONS = [
    { value: "1", label: "Petani" },
    { value: "2", label: "PNS/ASN" },
  ];

  const onRender = (onCreate?: (text: string) => void) => {
    const picked: string[] = [];

    render(
      <ComboboxField
        value=""
        onValueChange={(value) => picked.push(value)}
        options={OPTIONS}
        onCreate={onCreate}
      />,
    );

    return picked;
  };

  const onType = (text: string) => {
    const input = screen.getByRole("combobox");

    fireEvent.focus(input);
    fireEvent.input(input, {
      target: { value: text },
      inputType: "insertText",
    });

    return input;
  };

  test("teks baru: item Tambah dengan nama ternormalisasi muncul di akhir", async () => {
    onRender(() => {});
    onType("  petani   sawit ");

    const options = await screen.findAllByRole("option");

    expect(options.at(-1)?.textContent).toBe("Tambah “Petani Sawit”");
  });

  test("teks sama dengan opsi (beda huruf besar): tidak ada item Tambah", async () => {
    onRender(() => {});
    onType("pns/asn");

    await screen.findByRole("option", { name: "PNS/ASN" });
    expect(screen.queryByRole("option", { name: /^Tambah/ })).toBeNull();
  });

  test("tanpa onCreate: tidak ada item Tambah", async () => {
    onRender();
    onType("petani sawit");

    await screen.findByText("Tidak ada yang cocok");
    expect(screen.queryByRole("option", { name: /^Tambah/ })).toBeNull();
  });

  test("dipilih dengan keyboard: onCreate dipanggil, nilai field tidak berubah", async () => {
    const created: string[] = [];
    const picked = onRender((text) => created.push(text));
    const input = onType("tukang las");

    await screen.findByRole("option", { name: "Tambah “Tukang Las”" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(created).toEqual(["Tukang Las"]);
    expect(picked).toEqual([]);
  });

  test("dipilih dengan klik: onCreate dipanggil", async () => {
    const created: string[] = [];
    onRender((text) => created.push(text));
    onType("tukang las");

    fireEvent.click(
      await screen.findByRole("option", { name: "Tambah “Tukang Las”" }),
    );

    expect(created).toEqual(["Tukang Las"]);
  });
});

describe("ComboboxField dengan hint", () => {
  test("hint tampil di item, bukan di input terpilih; penyaringan tetap pada label", async () => {
    render(
      <ComboboxField
        value="1"
        onValueChange={() => {}}
        options={[
          { value: "1", label: "Keluarga Halim", hint: "Belum pernah" },
          { value: "2", label: "Keluarga Saragih" },
        ]}
      />,
    );

    const input = screen.getByRole<HTMLInputElement>("combobox");
    expect(input.value).toBe("Keluarga Halim");

    fireEvent.focus(input);
    fireEvent.input(input, {
      target: { value: "belum" },
      inputType: "insertText",
    });

    await screen.findByText("Tidak ada yang cocok");
  });

  test("item ber-hint memuat label dan hint", async () => {
    render(
      <ComboboxField
        value=""
        onValueChange={() => {}}
        options={[
          { value: "1", label: "Keluarga Halim", hint: "Belum pernah" },
          { value: "2", label: "Keluarga Saragih" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan" }));

    const options = await screen.findAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual([
      "Keluarga HalimBelum pernah",
      "Keluarga Saragih",
    ]);
  });
});
