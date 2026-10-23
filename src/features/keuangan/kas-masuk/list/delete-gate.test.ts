import { describe, expect, mock, test } from "bun:test";

import type { CashReceipt } from "../types";

import { receiptTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    payer: "Pembayar",
    receiptDate: "2026-10-01T00:00:00.000Z",
    ...patch,
  }) as unknown as CashReceipt;

describe("receiptTable: hapus kas masuk", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = receiptTable(true, onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "PAID" }))?.remove,
    ).toBeUndefined(); // sudah diterima
    expect(
      table.getRowActions?.(rowOf({ status: "CANCELLED" }))?.remove,
    ).toBeUndefined(); // dibatalkan
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = receiptTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
