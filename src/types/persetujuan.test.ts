import { describe, expect, test } from "bun:test";

import {
  APPROVAL_DOCUMENT_LABEL,
  APPROVAL_DOCUMENT_MENU,
  APPROVAL_DOCUMENT_TYPES,
  approvalDocumentHref,
  amountUnitOf,
  formatApprovalAmount,
} from "./persetujuan";

const ref = (code: string) => ({ publicId: `pub-${code}`, code });

describe("jenis dokumen persetujuan", () => {
  test("sepuluh jenis, urutan enum be-sada, semuanya berlabel", () => {
    expect(APPROVAL_DOCUMENT_TYPES).toHaveLength(10);
    expect(APPROVAL_DOCUMENT_TYPES.slice(-3)).toEqual([
      "PURCHASE_RETURN",
      "LOAN_ROOM",
      "ASSET_DISPOSAL",
    ]);
    expect(Object.keys(APPROVAL_DOCUMENT_LABEL)).toEqual([
      ...APPROVAL_DOCUMENT_TYPES,
    ]);
  });

  test("cuti dihitung hari, selain itu rupiah", () => {
    expect(amountUnitOf("LEAVE_REQUEST")).toBe("hari");
    expect(amountUnitOf("PAYROLL_RUN")).toBe("rupiah");
    expect(formatApprovalAmount("LEAVE_REQUEST", "3")).toBe("3 hari");
    expect(formatApprovalAmount("CASH_EXPENSE", "4500000")).toBe(
      "Rp 4.500.000",
    );
  });
});

describe("tautan halaman dokumen", () => {
  test("permintaan pembelian dan pelepasan barang punya halaman", () => {
    expect(approvalDocumentHref("PURCHASE_REQUEST", ref("PRQ-2026-0001"))).toBe(
      "/pengadaan/permintaan-pembelian/PRQ-2026-0001",
    );
    expect(approvalDocumentHref("ASSET_DISPOSAL", ref("SKA-2026-0003"))).toBe(
      "/inventaris/siklus-aset/pelepasan/SKA-2026-0003",
    );
  });

  test("dokumen tanpa layar tidak bertaut", () => {
    expect(
      approvalDocumentHref("PURCHASE_RETURN", ref("RTR-2026-0001")),
    ).toBeNull();
    expect(approvalDocumentHref("LOAN_ROOM", ref("PRG-2026-0001"))).toBeNull();
  });

  test("setiap dokumen bertaut punya menu penjaga", () => {
    for (const type of APPROVAL_DOCUMENT_TYPES) {
      const href = approvalDocumentHref(type, ref("X"));
      expect(href === null).toBe(APPROVAL_DOCUMENT_MENU[type] === undefined);
    }
  });
});

describe("kas keluar bertaut lewat publicId", () => {
  test("rute kas keluar memakai publicId, bukan kode", () => {
    expect(
      approvalDocumentHref("CASH_EXPENSE", {
        publicId: "ce-9f2a",
        code: "KK-2026-0001",
      }),
    ).toBe("/keuangan/kas-keluar/ce-9f2a");
  });
});
