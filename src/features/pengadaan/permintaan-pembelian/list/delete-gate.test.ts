import { describe, expect, mock, test } from "bun:test";

import type { PurchaseRequest } from "../types";

import { requestTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    ...patch,
  }) as unknown as PurchaseRequest;

describe("requestTable: hapus permintaan pembelian", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = requestTable(true, onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "APPROVED" }))?.remove,
    ).toBeUndefined(); // sudah disetujui
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = requestTable(true);

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
