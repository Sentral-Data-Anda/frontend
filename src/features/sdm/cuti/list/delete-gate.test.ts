import { describe, expect, mock, test } from "bun:test";

import type { Cuti } from "../types";

import { cutiTable } from "./list-item";

const rowOf = (patch: Record<string, unknown>) =>
  ({
    id: 1,
    publicId: "00000000-0000-4000-8000-000000000001",
    code: "DOC-1",
    name: "Dokumen",
    label: "Dokumen",
    karyawan: { name: "Karyawan" },
    ...patch,
  }) as unknown as Cuti;

describe("cutiTable: hapus pengajuan cuti", () => {
  test("hanya baris yang masih boleh dihapus punya aksi hapus", () => {
    const onDelete = mock(() => {});
    const table = cutiTable(onDelete);
    const row = rowOf({ status: "PENDING", approval: null });

    table.getRowActions?.(row)?.remove?.onSelect?.();

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(
      table.getRowActions?.(rowOf({ status: "APPROVED", approval: null }))
        ?.remove,
    ).toBeUndefined(); // sudah disetujui
    expect(
      table.getRowActions?.(
        rowOf({ status: "PENDING", approval: { status: "PENDING" } }),
      )?.remove,
    ).toBeUndefined(); // sedang ditandatangani
  });

  test("tanpa pengendali tidak ada aksi hapus", () => {
    const table = cutiTable();

    expect(
      table.getRowActions?.(rowOf({ status: "PENDING", approval: null }))
        ?.remove,
    ).toBeUndefined();
  });
});
