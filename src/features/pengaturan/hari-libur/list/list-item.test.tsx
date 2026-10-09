import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { HolidayRow } from "../types";

import { HolidayListItemRow, holidayTable } from "./list-item";

afterEach(cleanup);

const HOLIDAY: HolidayRow = {
  id: 9,
  publicId: "a",
  date: "2026-08-17T00:00:00.000Z",
  name: "Hari Kemerdekaan",
  type: "NASIONAL",
  isRecurring: false,
  originDate: "2026-08-17T00:00:00.000Z",
};

const onRenderRow = (isCanUpdate: boolean, holiday = HOLIDAY) =>
  render(
    <ul>
      <HolidayListItemRow holiday={holiday} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute id", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Hari Kemerdekaan" });
    expect(action.getAttribute("href")).toBe("/settings/holiday/9/ubah");
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("meta = hari, tanggal · tipe; tanggal dari server, badge Berulang sejak tahun asal", () => {
    onRenderRow(true);

    expect(screen.getByText("Senin, 17 Agustus 2026 · Nasional")).toBeTruthy();
    expect(document.querySelector('[data-row-id="9"]')).not.toBeNull();
    expect(screen.queryByText(/Berulang/)).toBeNull();

    cleanup();
    onRenderRow(true, {
      ...HOLIDAY,
      date: "2026-09-27T00:00:00.000Z",
      originDate: "1985-09-27T00:00:00.000Z",
      name: "HUT Gereja",
      type: "GEREJA",
      isRecurring: true,
    });
    expect(screen.getByText("Minggu, 27 September 2026 · Gereja")).toBeTruthy();
    expect(screen.getByText("Berulang sejak 1985")).toBeTruthy();
  });
});

describe("konfigurasi tabel", () => {
  test("Tanggal 1.25fr | Nama 2fr | Tipe 1fr | Berulang 0.75fr pelengkap", () => {
    const table = holidayTable(true);

    expect(
      table.columns.map((column) => [
        column.header,
        column.width,
        Boolean(column.isSecondary),
      ]),
    ).toEqual([
      ["Tanggal", "minmax(0,1.25fr)", false],
      ["Nama", "minmax(0,2fr)", false],
      ["Tipe", "minmax(0,1fr)", false],
      ["Berulang", "minmax(0,0.75fr)", true],
    ]);
    expect(table.getRowHref?.(HOLIDAY)).toBe("/settings/holiday/9/ubah");
    expect(holidayTable(false).getRowHref).toBeUndefined();
  });
});
