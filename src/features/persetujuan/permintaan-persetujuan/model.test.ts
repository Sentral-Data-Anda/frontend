import { describe, expect, test } from "bun:test";

import { toApiQuery, type ListState } from "@/hooks/use-list-params";
import { formatApprovalAmount } from "@/types/persetujuan";

import { approvalDetail } from "./fixtures";
import {
  approverLabel,
  documentTitle,
  rejectSchema,
  stageLabel,
  stepStateOf,
  toPermintaanParams,
  viewOf,
  waitingAge,
} from "./model";

const params = (next: Partial<ListState> = {}): ListState => ({
  page: 1,
  limit: 10,
  search: "",
  status: "",
  filters: {},
  apiFilters: {},
  isFiltered: false,
  onSearch: () => {},
  onApplyFilters: () => {},
  onClearFilters: () => {},
  onPickPage: () => {},
  onPickLimit: () => {},
  onPickFilter: () => {},
  ...next,
});

describe("stepStateOf", () => {
  const pending = { status: "PENDING" as const, currentOrder: 2 };

  test("lima keadaan tahap", () => {
    expect(stepStateOf(pending, { status: "APPROVED", order: 1 })).toBe(
      "approved",
    );
    expect(
      stepStateOf(
        { status: "REJECTED", currentOrder: 2 },
        { status: "REJECTED", order: 2 },
      ),
    ).toBe("rejected");
    expect(stepStateOf(pending, { status: "PENDING", order: 2 })).toBe(
      "waiting",
    );
    expect(stepStateOf(pending, { status: "PENDING", order: 3 })).toBe(
      "upcoming",
    );
    expect(
      stepStateOf(
        { status: "REJECTED", currentOrder: 2 },
        { status: "PENDING", order: 3 },
      ),
    ).toBe("skipped");
    expect(
      stepStateOf(
        { status: "CANCELLED", currentOrder: 1 },
        { status: "PENDING", order: 1 },
      ),
    ).toBe("skipped");
  });
});

describe("label", () => {
  const request = approvalDetail();

  test("penanda tangan: role sistem vs jabatan komisi", () => {
    expect(approverLabel(request.steps[0])).toBe("Bendahara");
    expect(approverLabel(request.steps[1])).toBe("Ketua · Majelis Jemaat");
    expect(stageLabel(request)).toBe("2 dari 2 · Ketua · Majelis Jemaat");
  });

  test("judul dokumen dengan dan tanpa dokumen", () => {
    expect(documentTitle(request)).toBe("Kas keluar · CAS-2026-0014");
    expect(documentTitle({ ...request, document: null })).toBe("Kas keluar");
  });

  test("nominal rupiah vs hari", () => {
    expect(formatApprovalAmount("CASH_EXPENSE", "4500000")).toBe(
      "Rp 4.500.000",
    );
    expect(formatApprovalAmount("LEAVE_REQUEST", "3")).toBe("3 hari");
  });

  test("lama menunggu", () => {
    const now = new Date("2026-09-27T05:00:00.000Z");

    expect(waitingAge("2026-09-27T01:00:00.000Z", now)).toBe("hari ini");
    expect(waitingAge("2026-09-24T01:00:00.000Z", now)).toBe("3 hari");
  });
});

describe("bacaan → query be-sada", () => {
  const withStatus = params({
    status: "REJECTED",
    page: 2,
    apiFilters: { documentType: "PROGRAM" },
  });

  test("antrean: menunggu=saya, tanpa status dan tampil", () => {
    const query = toApiQuery(toPermintaanParams(withStatus, "menunggu"));

    expect(query).toBe("page=2&limit=10&menunggu=saya&documentType=PROGRAM");
  });

  test("pengajuan: meneruskan status, tanpa menunggu/diproses", () => {
    const query = toApiQuery(toPermintaanParams(withStatus, "pengajuan"));

    expect(query).toBe("page=2&limit=10&status=REJECTED&documentType=PROGRAM");
  });

  test("riwayat: diproses=saya, tanpa status", () => {
    const query = toApiQuery(toPermintaanParams(withStatus, "riwayat"));

    expect(query).toBe("page=2&limit=10&diproses=saya&documentType=PROGRAM");
  });

  test("nilai tampil tak dikenal = antrean", () => {
    expect(viewOf(null)).toBe("menunggu");
    expect(viewOf("lain")).toBe("menunggu");
    expect(viewOf("riwayat")).toBe("riwayat");
  });
});

describe("rejectSchema", () => {
  test("wajib setelah trim", () => {
    const result = rejectSchema.safeParse({ note: "   " });

    expect(result.error?.issues[0].message).toBe(
      "Isi alasan penolakan supaya pengaju tahu apa yang harus diperbaiki.",
    );
  });

  test("lebih dari 250 karakter ditolak, 250 lolos", () => {
    expect(
      rejectSchema.safeParse({ note: "a".repeat(251) }).error?.issues[0]
        .message,
    ).toBe("Alasan maksimal 250 karakter");
    expect(rejectSchema.safeParse({ note: "a".repeat(250) }).success).toBe(
      true,
    );
  });

  test("isian dikirim ter-trim", () => {
    expect(rejectSchema.parse({ note: "  Lampirkan nota.  " }).note).toBe(
      "Lampirkan nota.",
    );
  });
});
