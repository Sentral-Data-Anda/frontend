import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useForm } from "react-hook-form";

import { RowOrderControls } from "./row-order-controls";
import { useOrderedRows } from "./use-ordered-rows";

afterEach(cleanup);

type Values = { slots: { role: string }[] };

const Harness = () => {
  const form = useForm<Values>({
    defaultValues: { slots: [{ role: "A" }, { role: "B" }, { role: "C" }] },
  });
  const rows = useOrderedRows({
    control: form.control,
    name: "slots",
    prefix: "slot",
    noun: "petugas",
    addId: "slots-add",
    pickAddFocus: (index) => `#slot-input-${index}`,
  });

  return (
    <form>
      <ol>
        {rows.fields.map((row, index) => (
          <li key={row.id}>
            <input
              id={`slot-input-${index}`}
              {...form.register(`slots.${index}.role`)}
            />
            <RowOrderControls
              prefix="slot"
              noun="petugas"
              index={index}
              total={rows.total}
              isDisabled={false}
              onMove={rows.onMove}
              onRemove={rows.onRemove}
            />
          </li>
        ))}
      </ol>
      <button
        id="slots-add"
        type="button"
        onClick={() => rows.onAdd({ role: "" })}
      >
        Tambah
      </button>
      <p>{rows.announcement}</p>
    </form>
  );
};

const valuesOf = () =>
  screen.getAllByRole<HTMLInputElement>("textbox").map((input) => input.value);

describe("useOrderedRows + RowOrderControls", () => {
  test("tombol ujung nonaktif; label menyebut noun dan nomor", () => {
    render(<Harness />);

    expect(
      screen
        .getByRole("button", { name: "Naikkan petugas 1" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Turunkan petugas 3" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  test("turunkan: urutan berubah, pengumuman, fokus ke tombol sejenis di posisi baru", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Turunkan petugas 1" }));

    expect(valuesOf()).toEqual(["B", "A", "C"]);
    expect(screen.getByText("Petugas 1 dipindah ke posisi 2")).toBeTruthy();
    expect(document.activeElement?.id).toBe("slot-1-down");
  });

  test("turunkan ke ujung: fokus pindah ke tombol naikkan", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Turunkan petugas 2" }));

    expect(document.activeElement?.id).toBe("slot-2-up");
  });

  test("hapus: pengumuman dan fokus ke tombol hapus baris berikutnya", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus petugas 1" }));

    expect(valuesOf()).toEqual(["B", "C"]);
    expect(screen.getByText("Petugas 1 dihapus")).toBeTruthy();
    expect(document.activeElement?.id).toBe("slot-0-remove");
  });

  test("tambah: baris baru di akhir dan fokus ke field pilihan pemanggil", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));

    expect(valuesOf()).toEqual(["A", "B", "C", ""]);
    expect(document.activeElement?.id).toBe("slot-input-3");
  });
});
