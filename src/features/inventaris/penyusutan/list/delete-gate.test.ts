import { describe, expect, mock, test } from "bun:test";

import type { Run } from "../types";

import { penyusutanTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    year: 2026,
    month: 10,
    ...patch,
  }) as unknown as Run;

describe("penyusutanTable: hapus penyusutan", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = penyusutanTable(onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "POSTED" }))?.remove,
    ).toBeUndefined(); // sudah diposting
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = penyusutanTable();

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
