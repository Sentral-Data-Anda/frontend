import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { SkillMusik } from "../types";

import { SkillMusikListItemRow, skillMusikTable } from "./list-item";

afterEach(cleanup);

const GITAR: SkillMusik = { id: 2, publicId: "p2", name: "Gitar" };

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <RowActionsProvider
      value={skillMusikTable(isCanUpdate).getRowActions?.(GITAR)}
    >
      <ul>
        <SkillMusikListItemRow skillMusik={GITAR} />
      </ul>
    </RowActionsProvider>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: pensil menunjuk rute id, baris bertanda id", () => {
    onRenderRow(true);

    expect(
      screen.getByRole("link", { name: "Ubah Gitar" }).getAttribute("href"),
    ).toBe("/pelayanan/skill-musik/edit/2");
    expect(document.querySelector('[data-row-id="2"]')).not.toBeNull();
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(false);

    expect(screen.getByText("Gitar")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("satu kolom Nama 1fr; tautan baris hanya dengan UPDATE", () => {
    const table = skillMusikTable(true);

    expect(
      table.columns.map((column) => [column.header, column.width]),
    ).toEqual([["Nama", "minmax(0,1fr)"]]);
    expect(table.getRowActions?.(GITAR)?.edit?.href).toBe(
      "/pelayanan/skill-musik/edit/2",
    );
    expect(
      skillMusikTable(false).getRowActions?.(GITAR)?.edit?.href,
    ).toBeUndefined();
  });
});
