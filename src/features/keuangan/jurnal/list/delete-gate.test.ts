import { describe, expect, mock, test } from "bun:test";

import type { JournalEntry } from "../types";

import { journalTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    entryDate: "2026-10-01T00:00:00.000Z",
    description: "Dokumen",
    ...patch,
  }) as unknown as JournalEntry;

describe("journalTable: hapus jurnal", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = journalTable(onDelete);
    const row = rowOf({ status: "DRAFT" });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "POSTED" }))?.remove,
    ).toBeUndefined(); // sudah diposting
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = journalTable();

    expect(
      table.getRowActions?.(rowOf({ status: "DRAFT" }))?.remove,
    ).toBeUndefined();
  });
});
