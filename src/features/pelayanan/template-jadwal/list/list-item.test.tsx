import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { TemplateJadwalListItem } from "../types";

import { TemplateJadwalListItemRow, templateJadwalTable } from "./list-item";

afterEach(cleanup);

const TEMPLATE: TemplateJadwalListItem = {
  code: "TMP_JDL_0002-0001",
  name: "Ibadah Pemuda",
  startTime: "17:00",
  endTime: "19:00",
  bapel: "Komisi Pemuda",
  detail: [
    { order: 3, roleName: "Multimedia" },
    { order: 1, roleName: "Pemandu Pujian" },
    { order: 2, roleName: "Pemusik" },
  ],
};

const EDIT_HREF = "/pelayanan/template-jadwal/TMP_JDL_0002-0001/ubah";

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <TemplateJadwalListItemRow
        template={TEMPLATE}
        isCanUpdate={isCanUpdate}
      />
    </ul>,
  );

describe("baris HP", () => {
  test("meta badan pelayanan, jam, jumlah tugas; pensil dengan UPDATE", () => {
    onRenderRow(true);

    expect(
      screen.getByText("Komisi Pemuda · 17:00–19:00 · 3 tugas"),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-row-id="TMP_JDL_0002-0001"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Ubah Ibadah Pemuda" })
        .getAttribute("href"),
    ).toBe(EDIT_HREF);
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom dan rasio sesuai brief, Kode pelengkap", () => {
    const table = templateJadwalTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Nama", "minmax(0,2fr)", false],
      ["Badan pelayanan", "minmax(0,1.5fr)", false],
      ["Jam", "minmax(0,1fr)", false],
      ["Tugas", "minmax(0,2.5fr)", false],
      ["Kode", "minmax(0,1.2fr)", true],
    ]);
    expect(table.getRowHref?.(TEMPLATE)).toBe(EDIT_HREF);
    expect(templateJadwalTable(false).getRowHref).toBeUndefined();
  });

  test("sel Tugas urut order, dipisah koma, dengan title daftar penuh", () => {
    const roles = templateJadwalTable(false).columns.find(
      (column) => column.key === "roles",
    );

    render(<div>{roles?.cell(TEMPLATE)}</div>);

    const cell = screen.getByText("Pemandu Pujian, Pemusik, Multimedia");
    expect(cell.getAttribute("title")).toBe(
      "Pemandu Pujian, Pemusik, Multimedia",
    );
  });
});
