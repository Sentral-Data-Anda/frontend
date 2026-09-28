import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { SkillMusik } from "../types";

import { SkillMusikListItemRow, skillMusikTable } from "./list-item";

afterEach(cleanup);

const GITAR: SkillMusik = { id: 2, name: "Gitar" };

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <SkillMusikListItemRow skillMusik={GITAR} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: pensil menunjuk rute id, baris bertanda id", () => {
    onRenderRow(true);

    expect(
      screen.getByRole("link", { name: "Ubah Gitar" }).getAttribute("href"),
    ).toBe("/pelayanan/skill-musik/2/ubah");
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
    expect(table.getRowHref?.(GITAR)).toBe("/pelayanan/skill-musik/2/ubah");
    expect(skillMusikTable(false).getRowHref).toBeUndefined();
  });
});
