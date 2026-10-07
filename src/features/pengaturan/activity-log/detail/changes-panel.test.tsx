import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { onStubViewport } from "../../../../../tests/viewport";
import type { Change } from "../model";
import type { LogAction } from "../types";

import { ChangesPanel } from "./changes-panel";

let viewport: ReturnType<typeof onStubViewport> | undefined;

afterEach(() => {
  cleanup();
  viewport?.onRestore();
});

const onRender = (action: LogAction, changes: Change[], isTable: boolean) => {
  viewport = onStubViewport(isTable);

  render(<ChangesPanel action={action} changes={changes} />);
};

const headers = () =>
  screen.getAllByRole("columnheader").map((header) => header.textContent);

describe.each([true, false])("panel perubahan (tabel: %p)", (isTable) => {
  test("create: satu nilai per field, tanpa sisi Sebelum", () => {
    onRender(
      "create",
      [{ field: "name", before: undefined, after: "Perawat" }],
      isTable,
    );

    if (isTable) expect(headers()).toEqual(["Field", "Nilai"]);
    expect(screen.queryByText("Sebelum")).toBeNull();
    expect(screen.queryByText("Sesudah")).toBeNull();
    expect(screen.getByText("Perawat")).toBeTruthy();
  });

  test("delete: nilai yang ditampilkan adalah data lama", () => {
    onRender(
      "delete",
      [{ field: "roleInFamily", before: "ANAK", after: undefined }],
      isTable,
    );

    if (isTable) expect(headers()).toEqual(["Field", "Nilai"]);
    expect(screen.queryByText("Sebelum")).toBeNull();
    expect(screen.getByText("ANAK")).toBeTruthy();
  });

  test("update: Sebelum dan Sesudah tetap berdampingan", () => {
    onRender(
      "update",
      [{ field: "phone", before: "0812", after: "0813" }],
      isTable,
    );

    if (isTable) expect(headers()).toEqual(["Field", "Sebelum", "Sesudah"]);
    else expect(screen.getByText("Sebelum")).toBeTruthy();
    expect(screen.getByText("0812")).toBeTruthy();
    expect(screen.getByText("0813")).toBeTruthy();
  });
});
