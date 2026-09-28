import { describe, expect, test } from "bun:test";

import {
  APPROVAL_DOCUMENT_LABEL,
  APPROVAL_DOCUMENT_TYPES,
  amountUnitOf,
  formatApprovalAmount,
} from "./persetujuan";

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
