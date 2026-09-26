import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { MarriageListItem } from "../types";

import { MarriageListItemRow, marriageTable } from "./list-item";

afterEach(cleanup);

const MARRIAGE: MarriageListItem = {
  id: "6f1c2a3e-0000-4000-8000-000000000001",
  husband: { jemaatCode: "JMT-0001", name: "Andreas Sitanggang" },
  wife: { jemaatCode: null, name: "Ruth Siregar" },
  marriedAt: "2012-06-16T00:00:00.000Z",
  marriedPlace: "GKI Sada",
  blessedHere: true,
  endedAt: null,
  endReason: null,
  endNote: null,
};

const onRenderRow = (isCanUpdate: boolean, marriage = MARRIAGE) =>
  render(
    <ul>
      <MarriageListItemRow marriage={marriage} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris pernikahan", () => {
  test("judul pasangan, meta tanggal · tempat, status Aktif", () => {
    onRenderRow(false);

    expect(screen.getByText("Andreas Sitanggang & Ruth Siregar")).toBeTruthy();
    expect(screen.getByText("16 Juni 2012 · GKI Sada")).toBeTruthy();
    expect(screen.getByText("Aktif")).toBeTruthy();
  });

  test("pernikahan yang berakhir berstatus Berakhir", () => {
    onRenderRow(false, { ...MARRIAGE, endedAt: "2021-11-03T00:00:00.000Z" });

    expect(screen.getByText("Berakhir")).toBeTruthy();
  });

  test("dengan UPDATE: tautan ubah menunjuk rute publicId", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", {
      name: "Ubah pernikahan Andreas Sitanggang & Ruth Siregar",
    });
    expect(action.getAttribute("href")).toBe(
      `/kejemaatan/pernikahan/${MARRIAGE.id}/ubah`,
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("baris membawa id supaya bisa disorot saat kembali", () => {
    onRenderRow(true);

    expect(
      document.querySelector(`[data-row-id="${MARRIAGE.id}"]`),
    ).not.toBeNull();
  });
});

describe("marriageTable", () => {
  test("kolom sesuai brief, Tempat sekunder", () => {
    const { columns } = marriageTable(true);

    expect(columns.map((column) => [column.header, column.width])).toEqual([
      ["Suami", "minmax(0,2fr)"],
      ["Istri", "minmax(0,2fr)"],
      ["Tanggal menikah", "minmax(0,1fr)"],
      ["Tempat", "minmax(0,1.5fr)"],
      ["Status", "minmax(0,1fr)"],
    ]);
    expect(
      columns.filter((column) => column.isSecondary).map((c) => c.key),
    ).toEqual(["marriedPlace"]);
  });

  test("baris hanya bertautan bila UPDATE", () => {
    expect(marriageTable(false).getRowHref).toBeUndefined();
    expect(marriageTable(true).getRowHref?.(MARRIAGE)).toBe(
      `/kejemaatan/pernikahan/${MARRIAGE.id}/ubah`,
    );
  });
});
