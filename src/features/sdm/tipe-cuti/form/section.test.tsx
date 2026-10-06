import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useForm } from "react-hook-form";

import { EMPTY_TIPE_CUTI_FORM, type TipeCutiFormValues } from "../model";

import { TypeSection } from "./type-section";

afterEach(cleanup);

const Harness = (props: { code?: string }) => {
  const form = useForm<TipeCutiFormValues>({
    defaultValues: EMPTY_TIPE_CUTI_FORM,
  });

  return <TypeSection form={form} isDisabled={false} code={props.code} />;
};

describe("catatan jatah", () => {
  test("tambah: tidak menyebut cuti yang sudah disetujui — belum ada", () => {
    render(<Harness />);

    expect(screen.queryByText(/cuti yang sudah disetujui/)).toBeNull();
    expect(
      screen.getByText("Jatah yang dihitung per tahun kalender."),
    ).toBeTruthy();
  });

  test("ubah: menyebut akibat menurunkan jatah", () => {
    render(<Harness code="TCT-0001" />);

    expect(screen.getByText(/Menurunkan jatah tidak membatalkan/)).toBeTruthy();
    expect(screen.getByText(/tercatat sisa 0 hari/)).toBeTruthy();
  });
});
