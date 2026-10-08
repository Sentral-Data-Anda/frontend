import { describe, expect, test } from "bun:test";

import { todayJakarta } from "@/lib/date";

import {
  DELETE_TEXT,
  emptyJournalForm,
  entryBalanceOf,
  fixOfCode,
  isReversible,
  isSameRange,
  journalFormSchema,
  postBlockReasonOf,
  rangeOfMonth,
  toJournalApiFilters,
  toJournalPayload,
  type JournalFormValues,
  NOTHING_TO_POST,
  POSTING_ASET_PATH,
  POSTING_LINKS,
  POSTING_PENGADAAN_PATH,
  POSTING_PERSEDIAAN_PATH,
  POSTING_PERSEMBAHAN_PATH,
  PREVIEW_REQUIRED,
  postingStatusOf,
} from "./model";
import {
  JOURNAL_SOURCE_LABEL,
  JOURNAL_SOURCE_TYPES,
  type JournalEntryDetail,
  type JournalLine,
} from "./types";

const line = (debit: string, credit: string, accountId = 2): JournalLine => ({
  id: `jln-${accountId}-${debit}-${credit}`,
  publicId: `jln-${accountId}-${debit}-${credit}`,
  accountId,
  account: { id: accountId, code: "1-100", name: "Kas", type: "ASSET" },
  debit,
  credit,
  description: null,
});

const entry = (
  lines: JournalLine[],
  extra: Partial<JournalEntryDetail> = {},
): JournalEntryDetail => ({
  id: "jrn-1",
  publicId: "jrn-1",
  code: "JRN-2026-0001",
  entryDate: "2026-01-01T00:00:00.000Z",
  description: "Saldo awal",
  status: "DRAFT",
  sourceType: "MANUAL",
  source: { type: "MANUAL", id: null },
  reversalOfId: null,
  isReversal: false,
  fiscalPeriod: { year: 2026, month: 1, status: "OPEN" },
  postedBy: null,
  postedAt: null,
  lines,
  reversalOf: null,
  reversedBy: null,
  ...extra,
});

const values = (next: Partial<JournalFormValues> = {}): JournalFormValues => ({
  ...emptyJournalForm(),
  description: "Saldo awal",
  ...next,
});

const filled = (debit: string, credit: string, accountId = "2") => ({
  accountId,
  debit,
  credit,
  description: "",
});

describe("entryBalanceOf", () => {
  test("menjumlah desimal tanpa galat float", () => {
    const balance = entryBalanceOf(
      entry([line("0.1", "0"), line("0.2", "0"), line("0", "0.3")]),
    );

    expect(balance.debit).toBe("0.30");
    expect(balance.credit).toBe("0.30");
    expect(balance.difference).toBe("0");
    expect(balance.isBalanced).toBe(true);
  });

  test("selisih dan sisi kurang terbaca saat tidak seimbang", () => {
    const balance = entryBalanceOf(
      entry([line("500000", "0"), line("0", "450000")]),
    );

    expect(balance.difference).toBe("50000");
    expect(balance.shortSide).toBe("credit");
    expect(balance.isBalanced).toBe(false);
  });
});

describe("postBlockReasonOf", () => {
  test("menolak draf tidak seimbang dengan alasannya", () => {
    const reason = postBlockReasonOf(
      entry([line("500000", "0"), line("0", "450000")]),
    );

    expect(reason).toContain("seimbang");
  });

  test("menolak draf kurang dari dua baris", () => {
    expect(postBlockReasonOf(entry([line("500000", "0")]))).toContain(
      "2 baris",
    );
  });

  test("tanpa alasan saat seimbang", () => {
    expect(
      postBlockReasonOf(entry([line("500000", "0"), line("0", "500000")])),
    ).toBeNull();
  });

  test("total nol tetap diblokir", () => {
    expect(
      postBlockReasonOf(entry([line("0", "0"), line("0", "0")])),
    ).toContain("seimbang");
  });
});

describe("isReversible", () => {
  test("entri diposting yang belum dibalik bisa dibalik", () => {
    expect(
      isReversible({ status: "POSTED", isReversal: false, reversedBy: null }),
    ).toBe(true);
  });

  test("entri pembalik tidak bisa dibalik", () => {
    expect(
      isReversible({ status: "POSTED", isReversal: true, reversedBy: null }),
    ).toBe(false);
  });

  test("draf tidak bisa dibalik", () => {
    expect(
      isReversible({ status: "DRAFT", isReversal: false, reversedBy: null }),
    ).toBe(false);
  });

  test("yang sudah punya pembalik tidak bisa dibalik lagi", () => {
    expect(
      isReversible({
        status: "POSTED",
        isReversal: false,
        reversedBy: {
          publicId: "jrn-2",
          code: "JRN-2026-0002",
          entryDate: "2026-02-01T00:00:00.000Z",
        },
      }),
    ).toBe(false);
  });
});

describe("fixOfCode", () => {
  test("setiap kode penolakan menunjuk layar yang memperbaikinya", () => {
    expect(fixOfCode("OFFERING_TYPE_NO_ACCOUNT")?.href).toBe(
      "/keuangan/tipe-persembahan",
    );
    expect(fixOfCode("SETTING_EMPTY")?.href).toBe(
      "/keuangan/setelan-akuntansi",
    );
    expect(fixOfCode("ACCOUNT_INACTIVE")?.href).toBe("/keuangan/akun");
    expect(fixOfCode("PERIOD_NOT_OPEN")?.href).toBe("/keuangan/periode-fiskal");
    expect(fixOfCode("PERIOD_CLOSED")?.href).toBe("/keuangan/periode-fiskal");
  });

  test("kode yang tidak dikenali tidak menebak tautan", () => {
    expect(fixOfCode("SOMETHING_NEW")).toBeNull();
    expect(fixOfCode(null)).toBeNull();
    expect(fixOfCode("")).toBeNull();
  });

  test("tidak dicabangkan dari prosa: kalimat mirip tanpa kode tetap null", () => {
    expect(fixOfCode("Periode Fiskal Januari 2026 Sudah Ditutup")).toBeNull();
  });
});

describe("journalFormSchema", () => {
  test("galat baris memakai path lines.<i>.<field>", () => {
    const result = journalFormSchema.safeParse(
      values({ lines: [filled("", "", ""), filled("100", "0")] }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
      "lines.0.accountId",
    );
  });

  test("satu baris mengisi dua sisi ditolak di baris itu", () => {
    const result = journalFormSchema.safeParse(
      values({ lines: [filled("100", "100"), filled("0", "100", "4")] }),
    );

    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
      "lines.0.debit",
    );
  });

  test("kurang dari dua baris ditolak", () => {
    const result = journalFormSchema.safeParse(
      values({ lines: [filled("100", "0")] }),
    );

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.join(".") === "lines"),
    ).toBe(true);
  });

  test("draf tidak seimbang tetap lolos skema — yang diblokir hanya posting", () => {
    const result = journalFormSchema.safeParse(
      values({ lines: [filled("500000", "0"), filled("0", "450000", "4")] }),
    );

    expect(result.success).toBe(true);
  });

  test("tanggal di masa depan ditolak", () => {
    const result = journalFormSchema.safeParse(
      values({
        entryDate: "2999-01-01",
        lines: [filled("100", "0"), filled("0", "100", "4")],
      }),
    );

    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
      "entryDate",
    );
  });
});

describe("emptyJournalForm", () => {
  test("form baru membuka dua baris kosong", () => {
    const form = emptyJournalForm();

    expect(form.lines).toHaveLength(2);
    expect(form.lines[0]).toEqual({
      accountId: "",
      debit: "",
      credit: "",
      description: "",
    });
    expect(form.entryDate).toBe(todayJakarta());
  });
});

describe("toJournalPayload", () => {
  test("sisi kosong dikirim sebagai 0 dan fiscalPeriodId tidak pernah ikut", () => {
    const payload = toJournalPayload(
      values({
        lines: [
          { ...filled("500000", ""), description: " Kas  brankas " },
          filled("", "500000", "4"),
        ],
      }),
    );

    expect(payload.lines[0]).toEqual({
      accountId: 2,
      debit: "500000",
      credit: "0",
      description: "Kas  brankas",
    });
    expect(payload.lines[1].debit).toBe("0");
    expect(Object.keys(payload)).toEqual(["entryDate", "description", "lines"]);
  });
});

describe("toJournalApiFilters", () => {
  test("tanpa filter bulan, daftar bawaan adalah tahun berjalan", () => {
    const filters = toJournalApiFilters({});

    expect(filters.year).toBe(todayJakarta().slice(0, 4));
    expect(filters.month).toBe("");
  });

  test("filter bulan dipecah jadi year dan month tanpa nol di depan", () => {
    expect(toJournalApiFilters({ bulan: "2026-03" })).toEqual({
      year: "2026",
      month: "3",
      accountId: "",
    });
  });
});

describe("rentang posting", () => {
  test("satu bulan menjadi from dan to", () => {
    expect(rangeOfMonth("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  test("bulan kosong tidak menghasilkan rentang", () => {
    expect(rangeOfMonth("")).toBeNull();
  });

  test("rentang berbeda tidak pernah dianggap sama", () => {
    expect(isSameRange(rangeOfMonth("2026-02"), rangeOfMonth("2026-03"))).toBe(
      false,
    );
    expect(isSameRange(rangeOfMonth("2026-02"), null)).toBe(false);
    expect(isSameRange(null, null)).toBe(false);
  });
});

describe("DELETE_TEXT", () => {
  test("konfirmasi hapus draf berkata permanen", () => {
    expect(DELETE_TEXT).toContain("permanen");
  });
});

describe("postingStatusOf", () => {
  test("tanpa pratinjau: memintanya dulu", () => {
    expect(postingStatusOf(null)).toBe(PREVIEW_REQUIRED);
  });

  test("pratinjau yang menolak semuanya: tombol tidak menjanjikan apa-apa", () => {
    expect(postingStatusOf({ result: { posted: 0 } })).toBe(NOTHING_TO_POST);
  });

  test("ada yang bisa diposting: tanpa status", () => {
    expect(postingStatusOf({ result: { posted: 3 } })).toBeUndefined();
  });
});

describe("sumber entri", () => {
  /**
   * Terlewat saat posting aset dibangun, dan kegagalannya persis sehening yang
   * bisa terjadi: `JOURNAL_SOURCE_LABEL` menjawab undefined, jadi kolom Sumber
   * KOSONG untuk setiap entri yang dibuat posting aset. Tidak ada galat, tidak
   * ada tipe yang mengeluh, tidak ada test yang merah.
   */
  test("setiap tipe sumber punya labelnya", () => {
    const missing = JOURNAL_SOURCE_TYPES.filter(
      (type) => !JOURNAL_SOURCE_LABEL[type],
    );

    expect(missing).toEqual([]);
  });

  test("aset sumbangan punya tipe sumbernya sendiri", () => {
    expect(JOURNAL_SOURCE_TYPES).toContain("ASSET_ACQUISITION");
    expect(JOURNAL_SOURCE_LABEL.ASSET_ACQUISITION).toBe("Sumbangan barang");
  });

  // Satu tipe sumber untuk SEMUA mutasi persediaan, jadi labelnya tidak boleh
  // menyempit jadi "penyesuaian": pengambilan ATK bukan koreksi.
  test("mutasi persediaan tidak terbaca sebagai penyesuaian", () => {
    expect(JOURNAL_SOURCE_LABEL.STOCK_ADJUSTMENT).toBe("Mutasi persediaan");
  });
});

describe("tautan posting", () => {
  /**
   * Keempatnya punya rute, dan tiga di antaranya tidak pernah ditautkan dari
   * mana-mana sampai sekarang. Rute tanpa tautan sama dengan rute yang tidak
   * ada: satu-satunya cara mencapainya adalah mengetik URL-nya.
   */
  test("keempat posting otomatis ada di daftarnya", () => {
    expect(POSTING_LINKS.map((entry) => entry.href)).toEqual([
      POSTING_PERSEMBAHAN_PATH,
      POSTING_ASET_PATH,
      POSTING_PENGADAAN_PATH,
      POSTING_PERSEDIAAN_PATH,
    ]);
  });
});

describe("perbaikan mutasi persediaan", () => {
  /**
   * Ke Barang Persediaan, bukan ke Mutasi Stok: yang diperbaiki adalah HARGA
   * barangnya. Mutasinya sendiri tidak bisa diubah, dan memang tidak
   * seharusnya -- dia catatan tentang apa yang sudah terjadi.
   */
  test("STOCK_NO_COST menautkan ke Barang Persediaan", () => {
    expect(fixOfCode("STOCK_NO_COST")).toEqual({
      href: "/inventaris/barang-persediaan",
      label: "Buka Barang Persediaan",
      menu: "BARANG_PERSEDIAAN",
    });
  });
});
