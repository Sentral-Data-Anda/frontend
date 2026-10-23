import { describe, expect, mock, test } from "bun:test";

import type { Invoice } from "../types";

import { invoiceTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    supplier: { name: "Pemasok" },
    dueDate: "2026-10-01T00:00:00.000Z",
    ...patch,
  }) as unknown as Invoice;

describe("invoiceTable: hapus faktur supplier", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = invoiceTable(true, onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "AWAITING_PAYMENT" }))?.remove,
    ).toBeUndefined(); // sudah terbit
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = invoiceTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
