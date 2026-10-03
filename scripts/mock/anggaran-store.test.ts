import { afterEach, describe, expect, test } from "bun:test";

import { addDays, addMonths, startOfMonth } from "../../src/lib/date";

import {
  BUDGET_ALLOCATION,
  bapelRef,
  BUDGET_SETTING,
  BUDGET_USAGE_REPORT,
  GATE_WAIVER,
  PROGRAM,
  TODAY,
  budgetYearOf,
  budgetYearRange,
  budgetYearView,
  ceilingUsage,
  complianceStateOf,
  gateFailureOf,
  isWithinCeiling,
  previousMonth,
  programItem,
  remainingFor,
} from "./anggaran-store";
import { CASH_EXPENSE, cashExpenseLine } from "./keuangan-store";

const BAPEL = 2;

const monthKey = (date: string) => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

const reset = () => {
  BUDGET_SETTING.startMonth = 1;
  BUDGET_ALLOCATION.length = 0;
  PROGRAM.length = 0;
  BUDGET_USAGE_REPORT.length = 0;
  GATE_WAIVER.length = 0;
};

afterEach(reset);

const allocate = (year: number, amount: string) => {
  BUDGET_ALLOCATION.push({
    id: BUDGET_ALLOCATION.length + 1,
    publicId: `bga-${BUDGET_ALLOCATION.length + 1}`,
    bapelId: BAPEL,
    year,
    amount,
  });
};

const propose = (year: number, unitPrice: string, id = PROGRAM.length + 1) => {
  PROGRAM.push({
    id,
    publicId: `prg-${id}`,
    code: `PRG-${year}-${id}`,
    name: `Program ${id}`,
    year,
    bapelId: BAPEL,
    status: "DRAFT",
    isUnplanned: false,
    startDate: null,
    endDate: null,
    description: null,
    cancelReason: null,
    cancelledById: null,
    cancelledAt: null,
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    items: [programItem(1, "Sewa", "1", unitPrice)],
    approvals: [],
  });

  return id;
};

describe("tahun pelayanan", () => {
  test("bulan mulai Januari: tahun pelayanan = tahun kalender", () => {
    BUDGET_SETTING.startMonth = 1;

    expect(budgetYearOf(TODAY)).toBe(Number(TODAY.slice(0, 4)));
    expect(budgetYearView(2027).label).toBe("2027");
  });

  test("bulan sebelum bulan mulai masih milik tahun sebelumnya", () => {
    BUDGET_SETTING.startMonth = 7;

    const june = `${2027}-06-15`;
    const july = `${2027}-07-01`;

    expect(budgetYearOf(june)).toBe(2026);
    expect(budgetYearOf(july)).toBe(2027);
  });

  test("rentang tahun pelayanan menutup dua belas bulan tanpa celah", () => {
    for (const startMonth of [1, 7, 12]) {
      BUDGET_SETTING.startMonth = startMonth;

      const year = budgetYearOf(TODAY);
      const { from, to } = budgetYearRange(year);

      expect(to).toBe(addDays(addMonths(from, 12), -1));
      expect(budgetYearOf(from)).toBe(year);
      expect(budgetYearOf(to)).toBe(year);
      expect(budgetYearOf(addDays(to, 1))).toBe(year + 1);
      expect(budgetYearOf(addDays(from, -1))).toBe(year - 1);
    }
  });

  test("label menyebut rentangnya bila bukan tahun kalender", () => {
    BUDGET_SETTING.startMonth = 7;

    expect(budgetYearView(2026).label).toContain("2026/2027");
    expect(budgetYearView(2026).label).toContain("Juli 2026");
  });
});

describe("previousMonth", () => {
  test("Januari mundur ke Desember tahun sebelumnya", () => {
    expect(previousMonth(2027, 1)).toEqual({ year: 2026, month: 12 });
  });

  test("bulan lain mundur satu di tahun yang sama", () => {
    expect(previousMonth(2027, 3)).toEqual({ year: 2027, month: 2 });
  });
});

describe("batas pagu inklusif", () => {
  test("tepat di pagu diterima, satu rupiah di atasnya ditolak", () => {
    const year = budgetYearOf(TODAY);
    allocate(year, "5000000");

    expect(isWithinCeiling(BAPEL, year, "5000000")).toBe(true);
    expect(isWithinCeiling(BAPEL, year, "5000001")).toBe(false);
  });

  test("tanpa baris pagu adalah penolakan, bukan tanpa batas", () => {
    const year = budgetYearOf(TODAY);

    expect(isWithinCeiling(BAPEL, year, "1")).toBe(false);
    expect(remainingFor(BAPEL, year)).toBeNull();
    expect(ceilingUsage(BAPEL, year).ceiling).toBeNull();
  });

  test("program dikecualikan dari komitmennya sendiri", () => {
    const year = budgetYearOf(TODAY);
    allocate(year, "5000000");
    const id = propose(year, "5000000");

    expect(isWithinCeiling(BAPEL, year, "5000000", id)).toBe(true);
    expect(isWithinCeiling(BAPEL, year, "5000000")).toBe(false);
  });

  test("program dibatalkan membebaskan pagunya", () => {
    const year = budgetYearOf(TODAY);
    allocate(year, "5000000");
    const id = propose(year, "5000000");

    expect(remainingFor(BAPEL, year)).toBe("0");

    const row = PROGRAM.find((item) => item.id === id);
    if (row) row.status = "CANCELLED";

    expect(remainingFor(BAPEL, year)).toBe("5000000");
  });
});

describe("gerbang pencairan", () => {
  const paid = (date: string, bapelId: number | null) => {
    const id = 9000 + CASH_EXPENSE.length;

    CASH_EXPENSE.push({
      id,
      publicId: `bkk-${id}`,
      code: `BKK-${id}`,
      expenseDate: date,
      description: "Uji gerbang",
      payee: "Uji",
      paidFromAccountId: 4,
      bapelId,
      method: null,
      reference: null,
      status: "PAID",
      cancelReason: null,
      approvals: [],
      approvedById: null,
      approvedAt: null,
      deletedAt: null,
      lines: [cashExpenseLine(22, "100000")],
      notes: [],
    });

    return id;
  };

  const dropSeeded = (ids: number[]) => {
    for (const id of ids) {
      const index = CASH_EXPENSE.findIndex((row) => row.id === id);
      if (index >= 0) CASH_EXPENSE.splice(index, 1);
    }
  };

  test("pengeluaran tanpa komisi tidak pernah masuk gerbang", () => {
    expect(gateFailureOf(null, TODAY)).toBeNull();
  });

  test("nol pencairan bulan lalu berarti tidak wajib lapor", () => {
    const previous = monthKey(addMonths(startOfMonth(TODAY), -1));

    expect(complianceStateOf(BAPEL, previous.year, previous.month)).toBe(
      "NOT_DUE",
    );
    expect(gateFailureOf(BAPEL, TODAY)).toBeNull();
  });

  test("ada pencairan tanpa laporan memblokir, dengan code", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, BAPEL)];

    expect(complianceStateOf(BAPEL, previous.year, previous.month)).toBe(
      "MISSING",
    );
    expect(gateFailureOf(BAPEL, TODAY)?.code).toBe("BUDGET_REPORT_PENDING");

    dropSeeded(ids);
  });

  test("laporan draf tetap memblokir; disetujui melepas", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, BAPEL)];

    BUDGET_USAGE_REPORT.push({
      id: 1,
      publicId: "lpb-1",
      code: "LPB-1",
      bapelId: BAPEL,
      year: previous.year,
      month: previous.month,
      status: "DRAFT",
      note: null,
      approvedById: null,
      approvedAt: null,
      deletedAt: null,
      lines: [],
      receipts: [],
      approvals: [],
    });

    expect(complianceStateOf(BAPEL, previous.year, previous.month)).toBe(
      "DRAFT",
    );
    expect(gateFailureOf(BAPEL, TODAY)).not.toBeNull();

    const report = BUDGET_USAGE_REPORT[0];
    if (report) report.status = "APPROVED";

    expect(gateFailureOf(BAPEL, TODAY)).toBeNull();

    dropSeeded(ids);
  });

  test("pembebasan melepas tanpa laporan, dan menang atas MISSING", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, BAPEL)];

    GATE_WAIVER.push({
      id: 1,
      bapelId: BAPEL,
      year: previous.year,
      month: previous.month,
      reason: "Pengurus baru belum dilantik",
      createdById: 1,
      createdAt: TODAY,
      deletedAt: null,
    });

    expect(complianceStateOf(BAPEL, previous.year, previous.month)).toBe(
      "WAIVED",
    );
    expect(gateFailureOf(BAPEL, TODAY)).toBeNull();

    dropSeeded(ids);
  });

  test("sisa tak-bertanda ikut dihitung dan tidak pernah undefined", () => {
    const year = budgetYearOf(TODAY);
    const ids = [paid(TODAY, null)];
    const usage = ceilingUsage(BAPEL, year);

    expect(usage.untagged).not.toBe("0");
    expect(typeof usage.untagged).toBe("string");

    dropSeeded(ids);
  });
});

describe("bentuk komisi di bacaan", () => {
  test("memakai publicId seperti be-sada, bukan id numerik", () => {
    const ref = bapelRef(2);

    expect(ref).not.toBeNull();
    expect(ref).toHaveProperty("publicId");
    expect(ref).not.toHaveProperty("id");
  });

  test("komisi yang tidak ada menjadi null, bukan undefined", () => {
    expect(bapelRef(9999)).toBeNull();
  });
});
