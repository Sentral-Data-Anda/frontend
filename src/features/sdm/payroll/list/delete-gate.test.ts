import { describe, expect, mock, test } from "bun:test";

import type { PayrollRun } from "../types";

import { payrollTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    ...patch,
  }) as unknown as PayrollRun;

describe("payrollTable: hapus penggajian", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = payrollTable(onDelete);
    const row = rowOf({ status: "CALCULATED" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "APPROVED" }))?.remove,
    ).toBeUndefined(); // sudah disetujui
    expect(
      table.getRowActions?.(rowOf({ status: "PAID" }))?.remove,
    ).toBeUndefined(); // sudah dibayar
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = payrollTable();

    expect(
      table.getRowActions?.(rowOf({ status: "CALCULATED" }))?.remove,
    ).toBeUndefined();
  });
});
