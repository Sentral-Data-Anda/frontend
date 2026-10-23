import { describe, expect, mock, test } from "bun:test";

import type { BudgetReport } from "../types";

import { reportTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    ...patch,
  }) as unknown as BudgetReport;

describe("reportTable: hapus laporan budget", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = reportTable(true, onDelete);
    const row = rowOf({ status: "DRAFT", approval: null });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "APPROVED", approval: null }))
        ?.remove,
    ).toBeUndefined(); // sudah disetujui
    expect(
      table.getRowActions?.(
        rowOf({ status: "DRAFT", approval: { status: "PENDING" } }),
      )?.remove,
    ).toBeUndefined(); // sedang ditandatangani
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = reportTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT", approval: null }))?.remove,
    ).toBeUndefined();
  });
});
