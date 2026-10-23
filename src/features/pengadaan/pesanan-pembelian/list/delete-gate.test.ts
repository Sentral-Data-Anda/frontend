import { describe, expect, mock, test } from "bun:test";

import type { Order } from "../types";

import { orderTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    supplier: { name: "Pemasok" },
    orderDate: "2026-10-01T00:00:00.000Z",
    ...patch,
  }) as unknown as Order;

describe("orderTable: hapus pesanan pembelian", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = orderTable(true, onDelete);
    const row = rowOf({ status: "ISSUED" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "RECEIVED" }))?.remove,
    ).toBeUndefined(); // sudah diterima
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = orderTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "ISSUED" }))?.remove,
    ).toBeUndefined();
  });
});
