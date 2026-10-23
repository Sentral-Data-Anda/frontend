import { describe, expect, mock, test } from "bun:test";

import type { CashExpense } from "../types";

import { expenseTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    ...patch,
  }) as unknown as CashExpense;

describe("expenseTable: hapus kas keluar", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = expenseTable(true, onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "PAID" }))?.remove,
    ).toBeUndefined(); // sudah dibayar
    expect(
      table.getRowActions?.(rowOf({ status: "CANCELLED" }))?.remove,
    ).toBeUndefined(); // dibatalkan
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = expenseTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
