import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { addMonths, startOfMonth, todayJakarta } from "@/lib/date";

import {
  budgetYearOfMonth,
  clearPrograms,
  isRefillAsked,
  currentMonthOf,
  emptyLine,
  emptyReportForm,
  errorFixOf,
  isLinesFilled,
  monthValueOf,
  prefillToLines,
  previousMonthOf,
  reportFormSchema,
  reportStateLabel,
  reportStateOf,
  rejectedMessageOf,
  rejectedStepOf,
  rejectedTitleOf,
  spentDateBounds,
  toReportForm,
  toReportFormData,
  toReportQuery,
  varianceOf,
  waiverTextOf,
  type ReportFormValues,
} from "./model";
import type {
  BudgetReportDetail,
  ReportApproval,
  ReportApprovalStep,
} from "./types";

const TODAY = todayJakarta();

const MONTH = previousMonthOf(TODAY);

const line = (next: Partial<ReportFormValues["lines"][number]> = {}) => ({
  ...emptyLine(),
  accountId: "23",
  spentDate: `${MONTH}-01`,
  description: "Konsumsi rapat",
  amount: "250000",
  ...next,
});

const values = (next: Partial<ReportFormValues> = {}): ReportFormValues => ({
  ...emptyReportForm(MONTH),
  bapelId: "2",
  lines: [line()],
  ...next,
});

const issuesOf = (next: Partial<ReportFormValues> = {}) => {
  const parsed = reportFormSchema.safeParse(values(next));

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

const step = (next: Partial<ReportApprovalStep> = {}): ReportApprovalStep => ({
  publicId: "aps-1",
  order: 1,
  approverRoleName: "Ketua Pengurus",
  status: "REJECTED",
  note: "Dua baris bertanggal di luar bulan laporan.",
  actedAt: `${TODAY}T02:00:00.000Z`,
  actor: { name: "Pnt. Hotman Sinaga" },
  ...next,
});

const approval = (next: Partial<ReportApproval> = {}): ReportApproval => ({
  publicId: "apr-1",
  code: "APR-2026-0001",
  status: "PENDING",
  currentOrder: 2,
  isSubmittedByViewer: true,
  steps: [step({ status: "APPROVED" }), step({ order: 2, status: "PENDING" })],
  ...next,
});

describe("skema laporan", () => {
  test("komisi dan bulan wajib, baris minimal satu", () => {
    expect(issuesOf({ bapelId: "" })).toContain("bapelId");
    expect(issuesOf({ month: "" })).toContain("month");
    expect(issuesOf({ lines: [] })).toContain("lines");
  });

  test("bulan berikutnya ditolak, bulan berjalan diterima", () => {
    const current = currentMonthOf(TODAY);
    const next = addMonths(`${current}-01`, 1).slice(0, 7);

    expect(issuesOf({ month: next })).toContain("month");
    expect(
      issuesOf({
        month: current,
        lines: [line({ spentDate: `${current}-01` })],
      }),
    ).toEqual([]);
  });

  test("nominal nol, negatif, dan lebih dari dua desimal ditolak", () => {
    for (const amount of ["0", "-1", "1000.123"]) {
      expect(issuesOf({ lines: [line({ amount })] })).toContain(
        "lines.0.amount",
      );
    }

    expect(issuesOf({ lines: [line({ amount: "1000.12" })] })).toEqual([]);
  });

  test("uraian dan pos wajib; program boleh kosong", () => {
    expect(issuesOf({ lines: [line({ description: "  " })] })).toContain(
      "lines.0.description",
    );
    expect(issuesOf({ lines: [line({ accountId: "" })] })).toContain(
      "lines.0.accountId",
    );
    expect(issuesOf({ lines: [line({ programId: "" })] })).toEqual([]);
  });
});

describe("tanggal pemakaian jatuh di dalam bulan laporan", () => {
  // Batasnya dihitung dari bulan laporan, bukan dituliskan 28/29/30/31 — satu
  // angka tetap di sini akan lolos sebelas bulan dan jatuh di bulan kedua
  // belas, dan Februari kabisat tidak pernah terlihat.
  const boundsOf = (month: string) => spentDateBounds(month, "2099-01-01");

  test("tanggal 1 dan hari terakhir diterima", () => {
    const bounds = boundsOf(MONTH);

    expect(
      issuesOf({ lines: [line({ spentDate: bounds.min ?? "" })] }),
    ).toEqual([]);
  });

  test("satu hari sebelum dan satu hari sesudah ditolak", () => {
    const before = addMonths(`${MONTH}-01`, -1).slice(0, 10);
    const after = addMonths(`${MONTH}-01`, 1).slice(0, 10);

    expect(issuesOf({ lines: [line({ spentDate: before })] })).toContain(
      "lines.0.spentDate",
    );
    expect(issuesOf({ lines: [line({ spentDate: after })] })).toContain(
      "lines.0.spentDate",
    );
  });

  test("Februari kabisat: 29 diterima di tahun kabisat, ditolak di tahun biasa", () => {
    expect(boundsOf("2028-02").max).toBe("2028-02-29");
    expect(boundsOf("2027-02").max).toBe("2027-02-28");
  });

  test("batas atas tidak pernah melewati hari ini", () => {
    const current = currentMonthOf(TODAY);

    expect(spentDateBounds(current, TODAY).max).toBe(TODAY);
  });
});

describe("bulan bawaan dan tahun pelayanan", () => {
  test("bawaan bulan lalu dihitung dari hari ini, melewati batas tahun", () => {
    expect(previousMonthOf("2027-01-09")).toBe("2026-12");
    expect(previousMonthOf(TODAY)).toBe(
      addMonths(startOfMonth(TODAY), -1).slice(0, 7),
    );
  });

  test("tahun pelayanan bulan laporan dibaca dari rentang server, bukan dihitung", () => {
    const years = [
      { year: 2026, from: "2026-07-01", to: "2027-06-30" },
      { year: 2027, from: "2027-07-01", to: "2028-06-30" },
    ];

    expect(budgetYearOfMonth(years, "2027-06")).toBe("2026");
    expect(budgetYearOfMonth(years, "2027-07")).toBe("2027");
    expect(budgetYearOfMonth(years, "2030-01")).toBe("");
    expect(budgetYearOfMonth([], "2027-06")).toBe("");
  });

  test("daftar bawaan tahun kalender berjalan, bulan semua", () => {
    expect(toReportQuery({}, "2026-10-04").apiFilters).toEqual({
      year: "2026",
      month: "",
      bapelId: "",
    });
    expect(
      toReportQuery({ bulan: "2026-03" }, "2026-10-04").apiFilters,
    ).toEqual({ year: "2026", month: "3", bapelId: "" });
  });
});

describe("strip selisih", () => {
  test("selalu punya teks, juga ketika selisihnya nol", () => {
    const zero = varianceOf("5250000", "5250000");

    expect(zero.text).toContain("selisih Rp 0");
    expect(zero.isLarge).toBe(false);
  });

  test("selisih besar hanya mengubah nada, bukan arti", () => {
    const large = varianceOf("1000000", "5000000");

    expect(large.isLarge).toBe(true);
    expect(large.text).toContain("Kas Keluar bulan ini Rp 1.000.000");
    expect(large.text).toContain("Laporan ini Rp 5.000.000");
  });

  test("dua angka nol tidak dianggap selisih besar", () => {
    expect(varianceOf("0", "0").isLarge).toBe(false);
  });
});

describe("status diturunkan dari approval, bukan dari status dokumen", () => {
  test("draf dengan permintaan terbuka berbunyi menunggu dengan jumlah tahap sebenarnya", () => {
    const report = { status: "DRAFT" as const, approval: approval() };

    expect(reportStateOf(report)).toBe("PENDING_APPROVAL");
    expect(reportStateLabel(report)).toBe("Menunggu persetujuan (2 dari 2)");
  });

  test("draf tanpa permintaan tetap Draf; disetujui tetap Disetujui", () => {
    expect(reportStateLabel({ status: "DRAFT", approval: null })).toBe("Draf");
    expect(reportStateLabel({ status: "APPROVED", approval: null })).toBe(
      "Disetujui",
    );
  });

  test("penolakan dibaca dari tahap, lengkap dengan nama dan jabatan", () => {
    const rejected = rejectedStepOf(
      approval({ status: "REJECTED", steps: [step(), step({ order: 2 })] }),
    );

    expect(rejected).not.toBeNull();
    expect(rejectedTitleOf(rejected!)).toContain("Pnt. Hotman Sinaga");
    expect(rejectedTitleOf(rejected!)).toContain("Ketua Pengurus");
    expect(rejectedMessageOf(rejected!)).toContain(
      "Dua baris bertanggal di luar bulan laporan.",
    );
    expect(rejectedMessageOf(rejected!)).toContain("Perbaiki lalu ajukan lagi");
  });

  test("permintaan yang masih menunggu bukan penolakan", () => {
    expect(rejectedStepOf(approval())).toBeNull();
    expect(rejectedStepOf(null)).toBeNull();
  });
});

describe("galat bercabang pada code, tidak pernah pada prosa", () => {
  test("code dikenal memberi tautan perbaikannya", () => {
    const fix = errorFixOf(
      new FetchError(400, "pesan apa pun", [], "NO_POSITION_HOLDER"),
    );

    expect(fix?.href).toBe("/kejemaatan/role-jemaat");
  });

  test("pesan yang memuat kata kuncinya tanpa code tidak memicu cabang", () => {
    expect(
      errorFixOf(
        new FetchError(
          400,
          "Komisi Ini Belum Punya Pengurus Berjabatan Ketua Pengurus",
        ),
      ),
    ).toBeNull();
  });

  test("code yang tidak dikenal dirender tanpa tautan", () => {
    expect(
      errorFixOf(new FetchError(400, "pesan", [], "BUKAN_CODE_KAMI")),
    ).toBeNull();
  });
});

describe("badan multipart", () => {
  const detail = (next: Partial<BudgetReportDetail> = {}) =>
    ({
      publicId: "lpb-0001",
      code: "LPB-2026-0001",
      bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
      year: 2026,
      month: 3,
      label: "Maret 2026",
      status: "DRAFT",
      totalAmount: "250000",
      approval: null,
      waiver: null,
      bapelId: 2,
      note: null,
      disbursementTotal: "0",
      approvedBy: null,
      approvedAt: null,
      lines: [
        {
          publicId: "lpl-1",
          accountId: 23,
          account: { code: "5-110", name: "Beban Administrasi" },
          programId: 7,
          program: { publicId: "prg-7", code: "PRG-2026-0007", name: "Retret" },
          spentDate: "2026-03-04",
          description: "Konsumsi",
          amount: "250000",
          cashExpense: { publicId: "bkk-11", code: "BKK-2026-0011" },
        },
      ],
      listReceipt: [
        {
          publicId: "att-1",
          name: "Kwitansi",
          mimeType: "image/jpeg",
          size: 10,
          showOnWebsite: false,
          url: "/media/a.jpg",
        },
      ],
      ...next,
    }) as BudgetReportDetail;

  test("lines dikirim sebagai JSON string, berkas di receipt, tanpa image", () => {
    const file = new File(["x"], "nota.jpg", { type: "image/jpeg" });
    const body = toReportFormData(
      values({
        receipts: [
          {
            key: "baru",
            name: "nota.jpg",
            mimeType: "image/jpeg",
            url: "blob:x",
            showOnWebsite: false,
            file,
          },
        ],
      }),
      false,
    );
    const lines = JSON.parse(String(body.get("lines"))) as unknown[];

    expect(typeof body.get("lines")).toBe("string");
    expect(lines).toHaveLength(1);
    expect(body.getAll("receipt")).toHaveLength(1);
    expect(body.get("image")).toBeNull();
  });

  test("totalAmount, status, dan showOnWebsite tidak pernah dikirim", () => {
    const body = toReportFormData(values(), false);

    expect(body.get("totalAmount")).toBeNull();
    expect(body.get("status")).toBeNull();
    expect(body.get("showOnWebsite")).toBeNull();
  });

  test("bulan dipecah menjadi year dan month kalender", () => {
    const body = toReportFormData(values({ month: "2026-03" }), false);

    expect(body.get("year")).toBe("2026");
    expect(body.get("month")).toBe("3");
  });

  test("keepFiles hanya dikirim saat ubah, berisi kwitansi yang dipertahankan", () => {
    const form = toReportForm(detail());

    expect(toReportFormData(form, false).get("keepFiles")).toBeNull();
    expect(
      JSON.parse(String(toReportFormData(form, true).get("keepFiles"))),
    ).toEqual([{ publicId: "att-1" }]);
  });

  test("form ubah membawa programId numerik dan penanda Kas Keluar barisnya", () => {
    const form = toReportForm(detail());

    expect(form.lines[0]?.programId).toBe("7");
    expect(form.lines[0]?.cashExpenseCode).toBe("BKK-2026-0011");
    expect(form.month).toBe("2026-03");
  });

  test("label bulan dipakai apa adanya dari server", () => {
    expect(monthValueOf({ year: 2026, month: 3 })).toBe("2026-03");
    expect(detail().label).toBe("Maret 2026");
  });
});

describe("prefill", () => {
  test("baris prefill membawa kode Kas Keluar sumbernya, tanpa program", () => {
    const lines = prefillToLines({
      total: "5250000",
      lines: [
        {
          cashExpense: { publicId: "bkk-11", code: "BKK-2026-0011" },
          accountId: 23,
          account: { code: "5-110", name: "Beban Administrasi" },
          spentDate: "2026-09-08",
          description: "Sewa tempat",
          amount: "3500000",
        },
      ],
    });

    expect(lines[0]?.cashExpenseCode).toBe("BKK-2026-0011");
    expect(lines[0]?.programId).toBe("");
    expect(lines[0]?.amount).toBe("3500000");
  });

  test("baris kosong tidak dianggap isian yang bisa hilang", () => {
    expect(isLinesFilled([emptyLine()])).toBe(false);
    expect(isLinesFilled([emptyLine(), line()])).toBe(true);
  });
});

describe("mengisi ulang dari Kas Keluar selalu ditanyakan lebih dulu", () => {
  const input = (next: Partial<Parameters<typeof isRefillAsked>[0]> = {}) => ({
    isEdit: false,
    isPrefillReady: true,
    prefillKey: "2|2026-09",
    settledKey: "",
    lines: [line()],
    ...next,
  });

  test("isian yang sudah terisi ditanyakan, tidak ditimpa", () => {
    expect(isRefillAsked(input())).toBe(true);
  });

  test("baris yang masih kosong diisi tanpa bertanya", () => {
    expect(isRefillAsked(input({ lines: [emptyLine()] }))).toBe(false);
  });

  test("pertanyaan yang sudah dijawab tidak diulang untuk pasangan yang sama", () => {
    expect(isRefillAsked(input({ settledKey: "2|2026-09" }))).toBe(false);
  });

  test("form ubah tidak pernah menawarkan isi ulang", () => {
    expect(isRefillAsked(input({ isEdit: true }))).toBe(false);
  });

  test("tanpa bacaan prefill tidak ada yang ditawarkan", () => {
    expect(isRefillAsked(input({ isPrefillReady: false }))).toBe(false);
  });
});

describe("mengubah komisi mengosongkan program", () => {
  test("setiap baris kehilangan programnya, sisanya utuh", () => {
    const cleared = clearPrograms([
      line({ programId: "7", description: "Baris satu" }),
      line({ programId: "9", amount: "1000" }),
    ]);

    expect(cleared.map((row) => row.programId)).toEqual(["", ""]);
    expect(cleared[0]?.description).toBe("Baris satu");
    expect(cleared[1]?.amount).toBe("1000");
  });
});

describe("pembebasan", () => {
  test("alasan tampil penuh dengan nama pembebas dan waktunya", () => {
    const reason = "A".repeat(250);
    const text = waiverTextOf({
      reason,
      createdBy: { name: "Daniel Panjaitan" },
      createdAt: "2026-10-02T02:00:00.000Z",
    });

    expect(text).toContain(reason);
    expect(text).toContain("Daniel Panjaitan");
  });
});
