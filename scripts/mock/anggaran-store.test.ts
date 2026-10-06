import { afterEach, describe, expect, test } from "bun:test";

import { addDays, addMonths, startOfMonth } from "../../src/lib/date";

import { resetAnggaranStores } from "./anggaran-reset";
import {
  type BudgetReportRow,
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
  disbursementsIn,
  ceilingUsage,
  complianceStateOf,
  gateFailureOf,
  isLive,
  isVisibleBapel,
  isWithinCeiling,
  komisiScopeOf,
  myBapelIds,
  previousMonth,
  programItem,
  remainingFor,
  untaggedMonth,
} from "./anggaran-store";
import {
  CASH_EXPENSE,
  CASH_EXPENSE_SOURCE,
  JOURNAL_ENTRY,
  cashExpenseLine,
} from "./keuangan-store";

const BAPEL = 2;

// Komisi yang tidak disentuh seed Kas Keluar mana pun. Kasus "tidak wajib
// lapor" harus bergantung pada komisi yang memang sepi, bukan pada ketiadaan
// seed — menambahkan satu pencairan nanti tidak boleh mematahkan test ini.
const QUIET_BAPEL = 6;

// Komisi yang benihnya memang tinggalkan terutang laporan bulan lalu: ia
// mencairkan, dan satu-satunya laporannya untuk bulan itu sudah dihapus.
const OWING_BAPEL = 4;

// Tahun pelayanan yang tidak disentuh seed mana pun. Aritmetika pagu di bawah
// menguji rumus, bukan isi seed: menjalankannya di tahun berjalan membuatnya
// bergantung pada larik yang kosong, dan larik itu hanya kosong selama tidak
// ada berkas test lain yang memuat handler lebih dulu.
const MATH_YEAR = budgetYearOf(TODAY) + 5;

const monthKey = (date: string) => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

// Dikembalikan ke benih milik modul store, bukan ke snapshot yang berkas ini
// ambil sendiri: lihat alasannya di `anggaran-reset.ts`.
afterEach(resetAnggaranStores);

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
  const year = MATH_YEAR;

  test("tepat di pagu diterima, satu rupiah di atasnya ditolak", () => {
    allocate(year, "5000000");

    expect(isWithinCeiling(BAPEL, year, "5000000")).toBe(true);
    expect(isWithinCeiling(BAPEL, year, "5000001")).toBe(false);
  });

  test("tanpa baris pagu adalah penolakan, bukan tanpa batas", () => {
    expect(isWithinCeiling(BAPEL, year, "1")).toBe(false);
    expect(remainingFor(BAPEL, year)).toBeNull();
    expect(ceilingUsage(BAPEL, year).ceiling).toBeNull();
  });

  test("program dikecualikan dari komitmennya sendiri", () => {
    allocate(year, "5000000");
    const id = propose(year, "5000000");

    expect(isWithinCeiling(BAPEL, year, "5000000", id)).toBe(true);
    expect(isWithinCeiling(BAPEL, year, "5000000")).toBe(false);
  });

  test("program dibatalkan membebaskan pagunya", () => {
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
      bapelChoice: bapelId === null ? null : "KOMISI",
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

    expect(disbursementsIn(QUIET_BAPEL, previous.year, previous.month)).toEqual(
      [],
    );
    expect(complianceStateOf(QUIET_BAPEL, previous.year, previous.month)).toBe(
      "NOT_DUE",
    );
    expect(gateFailureOf(QUIET_BAPEL, TODAY)).toBeNull();
  });

  // Dua arah pada benih apa adanya: komisi yang mencairkan lalu laporannya
  // disetujui lolos, komisi yang mencairkan tapi tidak punya laporan hidup
  // tertahan. Komisi kedua punya laporan yang DIHAPUS untuk bulan itu, jadi
  // test ini sekalian menjaga bahwa hapus lunak tidak dihitung sebagai lapor.
  // Kalau benihnya berubah sampai keduanya sama, test ini jatuh — dan itu
  // memang maunya: gerbangnya kehilangan contoh yang membedakan.
  test("benihnya memisahkan komisi yang lolos dari yang tertahan", () => {
    const previous = monthKey(addMonths(startOfMonth(TODAY), -1));

    expect(
      disbursementsIn(BAPEL, previous.year, previous.month).length,
    ).toBeGreaterThan(0);
    expect(complianceStateOf(BAPEL, previous.year, previous.month)).toBe(
      "APPROVED",
    );
    expect(gateFailureOf(BAPEL, TODAY)).toBeNull();

    expect(
      disbursementsIn(OWING_BAPEL, previous.year, previous.month).length,
    ).toBeGreaterThan(0);
    expect(complianceStateOf(OWING_BAPEL, previous.year, previous.month)).toBe(
      "MISSING",
    );
    expect(gateFailureOf(OWING_BAPEL, TODAY)?.code).toBe(
      "BUDGET_REPORT_PENDING",
    );
  });

  test("ada pencairan tanpa laporan memblokir, dengan code", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, QUIET_BAPEL)];

    expect(complianceStateOf(QUIET_BAPEL, previous.year, previous.month)).toBe(
      "MISSING",
    );
    expect(gateFailureOf(QUIET_BAPEL, TODAY)?.code).toBe(
      "BUDGET_REPORT_PENDING",
    );

    dropSeeded(ids);
  });

  test("laporan draf tetap memblokir; disetujui melepas", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, QUIET_BAPEL)];

    const report: BudgetReportRow = {
      id: 4101,
      publicId: "lpb-draft-then-approved",
      code: "LPB-DA",
      bapelId: QUIET_BAPEL,
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
    };

    BUDGET_USAGE_REPORT.push(report);

    expect(complianceStateOf(QUIET_BAPEL, previous.year, previous.month)).toBe(
      "DRAFT",
    );
    expect(gateFailureOf(QUIET_BAPEL, TODAY)).not.toBeNull();

    // Barisnya sendiri, bukan `BUDGET_USAGE_REPORT[0]`: indeks nol adalah baris
    // milik siapa pun yang menyemai lebih dulu.
    report.status = "APPROVED";

    expect(gateFailureOf(QUIET_BAPEL, TODAY)).toBeNull();

    dropSeeded(ids);
  });

  test("pembebasan melepas tanpa laporan, dan menang atas MISSING", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, QUIET_BAPEL)];

    GATE_WAIVER.push({
      id: 4100,
      bapelId: QUIET_BAPEL,
      year: previous.year,
      month: previous.month,
      reason: "Pengurus baru belum dilantik",
      createdById: 1,
      createdAt: TODAY,
      deletedAt: null,
    });

    expect(complianceStateOf(QUIET_BAPEL, previous.year, previous.month)).toBe(
      "WAIVED",
    );
    expect(gateFailureOf(QUIET_BAPEL, TODAY)).toBeNull();

    dropSeeded(ids);
  });

  test("laporan disetujui menang atas pembebasan di komisi yang sama", () => {
    const previousStart = addMonths(startOfMonth(TODAY), -1);
    const previous = monthKey(previousStart);
    const ids = [paid(previousStart, QUIET_BAPEL)];

    BUDGET_USAGE_REPORT.push({
      id: 4102,
      publicId: "lpb-approved-and-waived",
      code: "LPB-AW",
      bapelId: QUIET_BAPEL,
      year: previous.year,
      month: previous.month,
      status: "APPROVED",
      note: null,
      approvedById: 13,
      approvedAt: TODAY,
      deletedAt: null,
      lines: [],
      receipts: [],
      approvals: [],
    });
    GATE_WAIVER.push({
      id: 4102,
      bapelId: QUIET_BAPEL,
      year: previous.year,
      month: previous.month,
      reason: "Dibebaskan sebelum laporannya masuk",
      createdById: 1,
      createdAt: TODAY,
      deletedAt: null,
    });

    expect(complianceStateOf(QUIET_BAPEL, previous.year, previous.month)).toBe(
      "APPROVED",
    );
    expect(gateFailureOf(QUIET_BAPEL, TODAY)).toBeNull();

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

describe("kunci bulan mulai", () => {
  const year = MATH_YEAR;

  // Pertanyaannya "apa tahun INI terkunci", jadi hitungannya disempitkan ke
  // tahun ujinya. `PROGRAM.some(...)` tanpa penyempitan menanyakan hal lain —
  // apakah seluruh seed punya program disetujui — dan jawabannya ya.
  const isLocked = (target: number) =>
    PROGRAM.some((row) => row.year === target && row.status === "APPROVED");

  test("pagu saja tidak mengunci — pelabelan ulang tidak mengubah angka", () => {
    allocate(year, "5000000");
    propose(year, "1000000");

    expect(isLocked(year)).toBe(false);
  });

  test("program disetujui mengunci", () => {
    allocate(year, "5000000");
    const id = propose(year, "1000000");
    const row = PROGRAM.find((item) => item.id === id);
    if (row) row.status = "APPROVED";

    expect(isLocked(year)).toBe(true);
  });

  test("memindahkan bulan mulai tidak mengubah satu jumlah pun", () => {
    allocate(year, "5000000");
    propose(year, "1200000");

    const before = ceilingUsage(BAPEL, year);
    BUDGET_SETTING.startMonth = 7;
    const after = ceilingUsage(BAPEL, year);

    expect(after.ceiling).toBe(before.ceiling);
    expect(after.committed).toBe(before.committed);
  });
});

describe("lingkup komisi", () => {
  test("kapabilitas PAGU_ANGGARAN VIEW melihat semua komisi", () => {
    expect(komisiScopeOf(false, true)).toEqual({ isAll: true });
    expect(isVisibleBapel(komisiScopeOf(false, true), 9999)).toBe(true);
  });

  test("admin melihat semua komisi", () => {
    expect(komisiScopeOf(true, false)).toEqual({ isAll: true });
  });

  test("tanpa kapabilitas, sempit ke jabatan yang dipegang", () => {
    const scope = komisiScopeOf(false, false);

    expect(scope.isAll).toBe(false);
    if (!scope.isAll) {
      expect(scope.bapelIds).toEqual(myBapelIds());
    }
  });

  test("tanpa kapabilitas dan tanpa jabatan: GAGAL TERTUTUP, bukan terbuka", () => {
    const scope = { isAll: false as const, bapelIds: [] };

    expect(isVisibleBapel(scope, 1)).toBe(false);
    expect(isVisibleBapel(scope, 2)).toBe(false);
  });

  test("komisi lain tidak terlihat tanpa kapabilitas", () => {
    const scope = { isAll: false as const, bapelIds: [2] };

    expect(isVisibleBapel(scope, 2)).toBe(true);
    expect(isVisibleBapel(scope, 3)).toBe(false);
  });
});

describe("jabatan church-wide tidak melebarkan apa pun", () => {
  test("bapelId null disaring dari lingkup", () => {
    const ids = myBapelIds();

    expect(ids.every((id) => typeof id === "number")).toBe(true);
    expect(ids).not.toContain(null as unknown as number);
  });
});

describe("sisa tak-bertanda bisa dilihat, bukan hanya dihitung", () => {
  test("seed punya Kas Keluar DIBAYAR tanpa komisi, jadi untagged bukan nol", () => {
    const year = budgetYearOf(TODAY);

    expect(Number(ceilingUsage(BAPEL, year).untagged)).toBeGreaterThan(0);
  });
});

// Sisa tak-bertanda per bulan. Dua asersi untuk satu baris, karena masing-masing
// menangkap ARAH kesalahan yang berbeda: hilang dari baris sisanya, atau
// terhitung milik komisi yang tidak mencairkannya.
describe("pengeluaran tanpa komisi", () => {
  const { year, month } = monthKey(startOfMonth(TODAY));

  // `CASH_EXPENSE` milik keuangan-store, jadi `resetAnggaranStores` TIDAK
  // memulihkannya: baris yang didorong di sini harus dicabut sendiri, atau ia
  // bocor ke berkas test lain di proses yang sama. Dua berkas sempat merah
  // karenanya — baris uji ini muncul di daftar Kas Keluar dan di key-discipline.
  const pushed: number[] = [];

  afterEach(() => {
    for (const id of pushed.splice(0)) {
      const index = CASH_EXPENSE.findIndex((row) => row.id === id);
      if (index >= 0) CASH_EXPENSE.splice(index, 1);
    }
  });

  const pushPaid = (bapelId: number | null, choice: "BUKAN_KOMISI" | null) => {
    const id = 9500 + CASH_EXPENSE.length;

    CASH_EXPENSE.push({
      ...structuredClone(CASH_EXPENSE[0]!),
      id,
      publicId: `bkk-untagged-${id}`,
      code: `BKK-UNTAGGED-${id}`,
      expenseDate: `${year}-${String(month).padStart(2, "0")}-12`,
      bapelId,
      bapelChoice: bapelId === null ? choice : "KOMISI",
      status: "PAID",
      approvals: [],
      deletedAt: null,
      lines: [cashExpenseLine(22, "250000")],
      notes: [],
    });
    pushed.push(id);

    return id;
  };

  test("PAID tanpa komisi masuk baris sisa, DAN tidak masuk komisi mana pun", () => {
    const before = untaggedMonth(year, month);
    pushPaid(null, "BUKAN_KOMISI");
    const after = untaggedMonth(year, month);

    expect(after.count).toBe(before.count + 1);
    expect(Number(after.amount)).toBe(Number(before.amount) + 250000);

    // Arah kedua: ia tidak boleh muncul sebagai pencairan komisi mana pun.
    for (const bapelId of [1, 2, 3, 4, 5]) {
      expect(
        disbursementsIn(bapelId, year, month).some((row) =>
          row.publicId.startsWith("bkk-untagged-"),
        ),
      ).toBe(false);
    }
  });

  test("dua populasi dipisah: dinyatakan vs warisan", () => {
    const before = untaggedMonth(year, month);
    pushPaid(null, "BUKAN_KOMISI");
    pushPaid(null, null);
    const after = untaggedMonth(year, month);

    expect(after.stated.count).toBe(before.stated.count + 1);
    expect(after.inherited.count).toBe(before.inherited.count + 1);
    // Keseluruhannya tetap jumlah keduanya: angka §0.3 yang utuh.
    expect(after.count).toBe(after.stated.count + after.inherited.count);
  });

  test("pencairan ber-komisi tidak pernah masuk baris sisa", () => {
    const before = untaggedMonth(year, month);
    pushPaid(2, null);

    expect(untaggedMonth(year, month).count).toBe(before.count);
  });

  test("tetap dirender saat nol: bentuknya ada, bukan undefined", () => {
    const empty = untaggedMonth(1900, 1);

    expect(empty.count).toBe(0);
    expect(empty.stated.count).toBe(0);
    expect(empty.inherited.count).toBe(0);
    expect(empty.label).toBeTruthy();
  });
});

// Benih yang dipakai MANUSIA, bukan baris yang disemai test.
//
// Perilaku gerbangnya sudah diuji dua arah lewat baris yang test ini semai
// sendiri — dan itu lolos sambil `doc-24` diam-diam tidak menyalakan apa pun,
// karena tidak satu test pun menyebutnya. Fiturnya terbukti; benihnya tidak.
// Benih yang komentarnya menjanjikan "tertahan" lalu lolos lebih mahal
// daripada tidak ada benihnya: pembaca berikutnya menyimpulkan gerbangnya
// rusak lalu "memperbaiki" kode yang benar.
describe("benih yang membuat gerbang terlihat di peramban", () => {
  const approvedWithBapel = () =>
    CASH_EXPENSE.filter(
      (row) => isLive(row) && row.status === "APPROVED" && row.bapelId !== null,
    );

  test("doc-24 ADA, disetujui, berkomisi, dan gerbangnya MENAHAN", () => {
    const row = CASH_EXPENSE.find((item) => item.publicId === "doc-24");

    expect(row).toBeDefined();
    expect(row!.status).toBe("APPROVED");
    expect(row!.bapelId).not.toBeNull();
    expect(row!.bapelChoice).toBe("KOMISI");
    expect(gateFailureOf(row!.bapelId, row!.expenseDate)).not.toBeNull();
  });

  test("minimal satu baris siap bayar tertahan, atau pintu daruratnya tak terlihat", () => {
    const held = approvedWithBapel().filter((row) =>
      gateFailureOf(row.bapelId, row.expenseDate),
    );

    expect(held.length).toBeGreaterThan(0);
  });

  // Benih saya semula memakai id 12 yang SUDAH dipakai `bkk-0012`. Akibatnya
  // bukan cuma kosmetik: `journalRefOfSource` mencocokkan pada `sourceId`, jadi
  // doc-24 mewarisi jurnal milik baris lain dan `bayar` menolak "Sudah
  // Diposting Ke Jurnal" — pintu daruratnya terbuka lalu pembayarannya tetap
  // gagal karena alasan yang sama sekali lain.
  test("id kas keluar unik: dua baris berbagi id merusak tautan jurnalnya", () => {
    const ids = CASH_EXPENSE.map((row) => row.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test("doc-24 belum punya jurnal, jadi Bayar sesudah dibebaskan bisa berhasil", () => {
    const row = CASH_EXPENSE.find((item) => item.publicId === "doc-24")!;

    expect(
      // Entri jurnal tidak dihapus lunak, jadi tidak ada `isLive` di sini.
      JOURNAL_ENTRY.some(
        (entry) =>
          entry.sourceType === CASH_EXPENSE_SOURCE && entry.sourceId === row.id,
      ),
    ).toBe(false);
  });

  test("dan minimal satu LOLOS, supaya gerbangnya bukan blokir buta", () => {
    const passed = approvedWithBapel().filter(
      (row) => gateFailureOf(row.bapelId, row.expenseDate) === null,
    );

    expect(passed.length).toBeGreaterThan(0);
  });
});
