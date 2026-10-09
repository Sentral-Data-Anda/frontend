import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { Run } from "../types";

import { PenyusutanListItemRow } from "./list-item";

afterEach(cleanup);

const ROW: Run = {
  publicId: "r",
  code: "PNY-2026-0003",
  year: 2026,
  month: 8,
  status: "POSTED",
  totalAmount: "1234567890.00",
  postedAt: "2026-09-02T03:00:00.000Z",
  updatedAt: "2026-09-01T03:00:00.000Z",
  entryCount: 4,
};

describe("baris periode", () => {
  test("diposting: periode, kode + jumlah barang, total Rupiah, tautan halaman", () => {
    render(<PenyusutanListItemRow run={ROW} />);

    expect(screen.getByText("PNY-2026-0003 · 4 barang")).toBeTruthy();
    expect(screen.getByText("Rp 1.234.567.890,00")).toBeTruthy();
    expect(screen.getByText("Diposting")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat penyusutan Agustus 2026" })
        .getAttribute("href"),
    ).toBe("/fixed-asset/depreciation/PNY-2026-0003");
  });

  test("draf belum dihitung: tanpa total dan jumlah barang", () => {
    render(
      <PenyusutanListItemRow
        run={{
          ...ROW,
          status: "DRAFT",
          totalAmount: "0.00",
          postedAt: null,
          updatedAt: null,
          entryCount: 0,
        }}
      />,
    );

    expect(screen.getByText("PNY-2026-0003")).toBeTruthy();
    expect(screen.getByText("Draf · belum dihitung")).toBeTruthy();
    expect(screen.queryByText("Rp 0")).toBeNull();
  });
});
