import { describe, expect, mock, test } from "bun:test";

import type { PurchaseReturn } from "../types";

import { returnTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    ...patch,
  }) as unknown as PurchaseReturn;

describe("returnTable: hapus retur pembelian", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = returnTable(true, onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "SUBMITTED" }))?.remove,
    ).toBeUndefined(); // sudah diajukan
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = returnTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
