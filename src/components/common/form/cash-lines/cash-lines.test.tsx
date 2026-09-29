import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useFieldArray, useForm } from "react-hook-form";

import { CashLineList } from "./cash-line-list";

afterEach(cleanup);

type Values = {
  lines: { accountId: string; amount: string; description: string }[];
};

const blank = () => ({ accountId: "", amount: "", description: "" });

const Harness = (props: { lines?: Values["lines"] }) => {
  const form = useForm<Values>({
    defaultValues: { lines: props.lines ?? [blank()] },
  });
  const array = useFieldArray({ control: form.control, name: "lines" });

  return (
    <CashLineList
      form={form}
      name="lines"
      fieldIds={array.fields.map((field) => field.id)}
      onAdd={() => array.append(blank())}
      onRemove={(index) => array.remove(index)}
    />
  );
};

const onRender = (lines?: Values["lines"]) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness lines={lines} />
    </QueryClientProvider>,
  );

describe("CashLineList", () => {
  test("berbicara Pos, bukan Debit atau Kredit", () => {
    const { container } = onRender();

    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(1);
    expect(container.textContent).not.toContain("Debit");
    expect(container.textContent).not.toContain("Kredit");
  });

  test("total menjumlah semua baris", () => {
    onRender([
      { accountId: "", amount: "1850000", description: "Listrik" },
      { accountId: "", amount: "275000", description: "Materai" },
    ]);

    expect(screen.getByText(/Total/).textContent).toContain("2.125.000");
  });

  test("total ikut berubah saat nominal diketik", () => {
    onRender([{ accountId: "", amount: "1000", description: "" }]);

    fireEvent.change(screen.getAllByLabelText(/Nominal \(Rp\) baris 1/)[0]!, {
      target: { value: "2500" },
    });

    expect(screen.getByText(/Total/).textContent).toContain("2.500");
  });

  test("baris kosong memberi total nol, bukan galat", () => {
    onRender();

    expect(screen.getByText(/Total/).textContent).toContain("0");
  });

  test("tombol tambah menambah baris", () => {
    onRender();
    fireEvent.click(screen.getByRole("button", { name: "Tambah baris" }));

    expect(screen.getAllByLabelText(/^Pos baris/).length).toBe(2);
  });
});
