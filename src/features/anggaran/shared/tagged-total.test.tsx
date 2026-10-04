import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { TaggedTotal, type TaggedPart } from "./tagged-total";

afterEach(cleanup);

const PARTS: TaggedPart[] = [
  { key: "a", label: "Komisi Pemuda", amount: "4000000" },
  { key: "b", label: "Komisi Anak", amount: "1000000" },
];

const view = (untagged: string, parts: TaggedPart[] = PARTS) =>
  render(
    <TaggedTotal
      label="Belanja per komisi"
      parts={parts}
      untaggedLabel="Pengeluaran tanpa komisi"
      untagged={untagged}
      untaggedHint="Tagihan gereja, gaji, dan yang belum ditandai."
    />,
  );

const untaggedRow = () =>
  document.querySelector<HTMLElement>("[data-untagged]");

describe("TaggedTotal", () => {
  test("sisa tak-bertanda tetap dirender saat nol", () => {
    view("0");

    expect(screen.getByText("Pengeluaran tanpa komisi")).toBeTruthy();
    expect(untaggedRow()?.textContent).toContain("Rp 0");
  });

  test("ketonjolan sisa sama dengan baris bertanda", () => {
    view("250000000");

    const untagged = untaggedRow();
    const part = screen.getByText("Komisi Pemuda").closest("div");

    expect(untagged?.className).toBe(part?.className);
    expect(untagged?.className).not.toContain("text-muted-foreground");
    expect(untagged?.className).not.toContain("text-caption");
  });

  test("total memuat sisa tak-bertanda, bukan hanya yang bertanda", () => {
    view("250000000");

    expect(screen.getByText("Rp 255.000.000")).toBeTruthy();
  });

  test("tanpa baris bertanda, sisa dan total tetap tampil", () => {
    view("300000000", []);

    expect(untaggedRow()?.textContent).toContain("Rp 300.000.000");
    expect(screen.getByText("Total")).toBeTruthy();
  });
});
