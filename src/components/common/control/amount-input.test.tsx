import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useState } from "react";

import { AmountInput } from "./amount-input";

afterEach(cleanup);

const values: string[] = [];

const Harness = (props: { initial: string; maxFraction?: number }) => {
  const [value, setValue] = useState(props.initial);

  const onValueChange = (next: string) => {
    values.push(next);
    setValue(next);
  };

  return (
    <AmountInput
      aria-label="Harga"
      value={value}
      onValueChange={onValueChange}
      maxDigits={13}
      maxFraction={props.maxFraction}
    />
  );
};

const input = () => screen.getByLabelText("Harga") as HTMLInputElement;

describe("AmountInput", () => {
  test("rupiah: tampil bertitik ribuan, nilai tanpa pemisah", () => {
    render(<Harness initial="185000" />);

    expect(input().value).toBe("185.000");
    expect(input().getAttribute("inputmode")).toBe("numeric");

    fireEvent.change(input(), { target: { value: "1.850.000" } });

    expect(values.at(-1)).toBe("1850000");
    expect(input().value).toBe("1.850.000");
  });

  test("huruf dan koma dibuang untuk bilangan bulat", () => {
    render(<Harness initial="" />);

    fireEvent.change(input(), { target: { value: "Rp 12,5" } });

    expect(values.at(-1)).toBe("125");
  });

  test("valas: koma desimal, nilai bertitik desimal", () => {
    render(<Harness initial="" maxFraction={2} />);

    fireEvent.change(input(), { target: { value: "15800,505" } });

    expect(values.at(-1)).toBe("15800.50");
    expect(input().value).toBe("15.800,50");
    expect(input().getAttribute("inputmode")).toBe("decimal");
  });

  test("kosong tetap kosong", () => {
    render(<Harness initial="" />);

    expect(input().value).toBe("");
  });
});
