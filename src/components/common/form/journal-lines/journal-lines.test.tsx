import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useFieldArray, useForm } from "react-hook-form";

import { BalanceSummary } from "./balance-summary";
import { JournalLineList } from "./journal-line-list";

afterEach(cleanup);

type Values = {
  lines: {
    accountId: string;
    debit: string;
    credit: string;
    description: string;
  }[];
};

const blank = () => ({ accountId: "", debit: "", credit: "", description: "" });

const Harness = (props: { lines?: Values["lines"] }) => {
  const form = useForm<Values>({
    defaultValues: { lines: props.lines ?? [blank(), blank()] },
  });
  const array = useFieldArray({ control: form.control, name: "lines" });

  return (
    <JournalLineList
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

describe("BalanceSummary", () => {
  test("seimbang memakai kata, bukan hanya angka", () => {
    render(
      <BalanceSummary
        debit="1500000"
        credit="1500000"
        difference="0"
        shortSide={null}
        isBalanced
      />,
    );

    expect(screen.getByText("Seimbang")).toBeDefined();
  });

  test("kredit kurang: menyebut sisi yang kurang, bukan hanya nominal", () => {
    render(
      <BalanceSummary
        debit="1550000"
        credit="1500000"
        difference="50000"
        shortSide="credit"
        isBalanced={false}
      />,
    );

    const verdict = screen.getByText(/kurang/);

    expect(verdict.textContent).toContain("Kredit kurang");
    expect(verdict.textContent).toContain("50.000");
  });

  test("debit kurang: sisi yang disebut ikut berbalik", () => {
    render(
      <BalanceSummary
        debit="1000"
        credit="2500"
        difference="1500"
        shortSide="debit"
        isBalanced={false}
      />,
    );

    expect(screen.getByText(/kurang/).textContent).toContain("Debit kurang");
  });

  test("form kosong tidak memberi peringatan", () => {
    render(
      <BalanceSummary
        debit="0"
        credit="0"
        difference="0"
        shortSide={null}
        isBalanced={false}
      />,
    );

    expect(screen.getByText("Belum ada nominal")).toBeDefined();
    expect(screen.queryByText(/kurang/)).toBeNull();
  });
});

describe("JournalLineList", () => {
  test("mengisi debit mengosongkan kredit di baris yang sama", () => {
    onRender([
      { accountId: "", debit: "", credit: "900", description: "" },
      blank(),
    ]);

    const debit = screen.getAllByLabelText(
      /Debit baris 1/,
    )[0] as HTMLInputElement;
    fireEvent.change(debit, { target: { value: "1500" } });

    const credit = screen.getAllByLabelText(
      /Kredit baris 1/,
    )[0] as HTMLInputElement;

    expect(credit.value).toBe("");
    expect(debit.value).toBe("1.500");
  });

  test("mengisi kredit mengosongkan debit di baris yang sama", () => {
    onRender([
      { accountId: "", debit: "700", credit: "", description: "" },
      blank(),
    ]);

    const credit = screen.getAllByLabelText(
      /Kredit baris 1/,
    )[0] as HTMLInputElement;
    fireEvent.change(credit, { target: { value: "700" } });

    expect(
      (screen.getAllByLabelText(/Debit baris 1/)[0] as HTMLInputElement).value,
    ).toBe("");
  });

  test("ringkasan ikut berubah saat nominal diketik", () => {
    onRender([
      { accountId: "", debit: "1000", credit: "", description: "" },
      { accountId: "", debit: "", credit: "1000", description: "" },
    ]);

    expect(screen.getByText("Seimbang")).toBeDefined();

    fireEvent.change(screen.getAllByLabelText(/Debit baris 1/)[0]!, {
      target: { value: "1500" },
    });

    expect(screen.getByText(/kurang/).textContent).toContain("Kredit kurang");
  });

  test("satu baris terisi sebelah: ringkasan menunjuk sisi yang belum diisi", () => {
    onRender([
      { accountId: "", debit: "500000", credit: "", description: "" },
      blank(),
    ]);

    expect(screen.getByText(/kurang/).textContent).toContain("Kredit kurang");
  });

  test("tombol tambah menambah baris", () => {
    onRender();
    fireEvent.click(screen.getByRole("button", { name: "Tambah baris" }));

    expect(screen.getAllByLabelText(/^Akun baris/).length).toBe(3);
  });
});
