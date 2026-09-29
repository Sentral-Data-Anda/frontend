import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useFieldArray, useForm, type Control } from "react-hook-form";

import { LineItemCard } from "./line-item-card";
import { LineItemList } from "./line-item-list";
import { useLineItemErrors } from "./use-line-item-errors";

afterEach(cleanup);

type Values = { items: { name: string; quantity: string }[] };

const FIELDS = ["name", "quantity"] as const;

interface RowProps {
  control: Control<Values>;
  index: number;
  onRemove: (index: number) => void;
}

const Row = (props: RowProps) => {
  const { control, index, onRemove } = props;

  const errors = useLineItemErrors(control, "items", index, FIELDS);

  return (
    <LineItemCard
      index={index}
      title={`Barang ${index + 1}`}
      meta="Dipesan 2 buah"
      removeLabel={`Hapus barang ${index + 1}`}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <input
        id={errors.idOf("name")}
        aria-label={`Nama ${index + 1}`}
        aria-invalid={errors.isInvalid("name") || undefined}
        aria-describedby={errors.messageIdOf("name")}
      />
    </LineItemCard>
  );
};

const Harness = (props: { initial: number }) => {
  const form = useForm<Values>({
    defaultValues: {
      items: Array.from({ length: props.initial }, () => ({
        name: "",
        quantity: "",
      })),
    },
  });
  const rows = useFieldArray({ control: form.control, name: "items" });

  return (
    <>
      <button
        type="button"
        onClick={() =>
          form.setError("items.1.name", { message: "Salah di items.1.name" })
        }
      >
        Tandai galat
      </button>
      <LineItemList
        label="Barang dipesan"
        count={rows.fields.length}
        onAdd={() => rows.append({ name: "", quantity: "" })}
        empty="Belum ada barang."
        summary={`${rows.fields.length} barang`}
      >
        {rows.fields.map((row, index) => (
          <Row
            key={row.id}
            control={form.control}
            index={index}
            onRemove={rows.remove}
          />
        ))}
      </LineItemList>
    </>
  );
};

describe("LineItemList", () => {
  test("kosong: teks kosong, tanpa daftar; tambah membuat kartu", () => {
    render(<Harness initial={0} />);

    expect(screen.getByText("Belum ada barang.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));

    expect(screen.getByRole("list", { name: "Barang dipesan" })).toBeTruthy();
    expect(screen.getByText("1 barang")).toBeTruthy();
  });

  test("hapus kartu memanggil indeks yang benar", () => {
    render(<Harness initial={3} />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus barang 2" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("2 barang")).toBeTruthy();
  });
});

describe("LineItemCard + useLineItemErrors", () => {
  test("galat baris tampil di kartunya dan tertaut ke field", () => {
    render(<Harness initial={2} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Tandai galat" }));
    });

    const input = screen.getByLabelText("Nama 2");
    const message = screen.getByText("Salah di items.1.name");

    expect(input.getAttribute("id")).toBe("items.1.name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(message.id);
    expect(screen.getByLabelText("Nama 1").getAttribute("aria-invalid")).toBe(
      null,
    );
    expect(
      screen.getAllByRole("listitem")[1]?.getAttribute("data-invalid"),
    ).toBe("true");
  });
});
