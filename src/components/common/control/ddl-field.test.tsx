import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { DdlField, SELECT_LIMIT } from "./ddl-field";

afterEach(cleanup);

const optionsOf = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    value: String(index + 1),
    label: `Pilihan ${index + 1}`,
  }));

const renderField = (count: number, isLoading = false) =>
  render(
    <DdlField
      id="ruang"
      value=""
      onValueChange={() => {}}
      options={optionsOf(count)}
      isLoading={isLoading}
      disabled={false}
      placeholder="Pilih ruang"
      emptyMessage="Belum ada ruang"
    />,
  );

describe("DdlField", () => {
  test("sampai batas memakai select, bukan kotak ketik", () => {
    renderField(SELECT_LIMIT);

    expect(document.querySelector("input#ruang")).toBeNull();
    expect(screen.getByText("Pilih ruang")).toBeTruthy();
  });

  test("select yang memuat menampilkan Memuat…", () => {
    renderField(0, true);

    expect(screen.getByText("Memuat…")).toBeTruthy();
  });

  test("di atas batas memakai combobox yang bisa diketik", () => {
    renderField(SELECT_LIMIT + 1);

    expect(document.querySelector("input#ruang")).not.toBeNull();
  });
});
