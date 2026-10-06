import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { todayJakarta } from "@/lib/date";

import { expenseDetail } from "./fixtures";
import {
  ALL_MONTHS,
  EXPENSE_STATE_VARIANT,
  currentMonth,
  emptyExpenseForm,
  errorFixOf,
  expenseFormSchema,
  expenseStateOf,
  isLocked,
  isRejected,
  previousMonthOf,
  toExpenseForm,
  toExpenseFormData,
  waiveSchema,
  waiveText,
  rejectionMarkOf,
  toExpenseQuery,
  toFormError,
  type ExpenseFormValues,
} from "./model";

const approval = (
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
) => ({
  publicId: "pst-1",
  code: "PST-2026-0007",
  status,
  note: status === "REJECTED" ? "Kas komisi belum cukup." : null,
  isSubmittedByViewer: true,
});

const values = (next: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  ...emptyExpenseForm(),
  payee: "  PLN   UP3  Medan ",
  paidFromAccountId: "2",
  description: "Tagihan  listrik",
  bapelChoice: "BUKAN_KOMISI",
  lines: [{ accountId: "22", amount: "1850000", description: "Listrik" }],
  ...next,
});

const fileOf = (name: string) => new File(["x"], name, { type: "image/jpeg" });

const attachment = (key: string, file: File | null) => ({
  key,
  name: key,
  mimeType: "image/jpeg",
  url: "http://media/x",
  showOnWebsite: false,
  file,
});

describe("expenseStateOf", () => {
  test("menunggu persetujuan diturunkan dari approval, bukan dari status dokumen", () => {
    const row = { status: "DRAFT" as const, approval: approval("PENDING") };

    expect(row.status).toBe("DRAFT");
    expect(expenseStateOf(row)).toBe("PENDING_APPROVAL");
    expect(isLocked(row)).toBe(true);
  });

  test("penolakan tidak mengubah status: tetap draf, dan tidak terkunci", () => {
    const row = { status: "DRAFT" as const, approval: approval("REJECTED") };

    expect(expenseStateOf(row)).toBe("DRAFT");
    expect(isRejected(row)).toBe(true);
    expect(isLocked(row)).toBe(false);
  });

  test("status dokumen menang begitu disetujui atau dibayar", () => {
    expect(
      expenseStateOf({ status: "APPROVED", approval: approval("APPROVED") }),
    ).toBe("APPROVED");
    expect(
      expenseStateOf({ status: "PAID", approval: approval("APPROVED") }),
    ).toBe("PAID");
    expect(expenseStateOf({ status: "DRAFT", approval: null })).toBe("DRAFT");
  });
});

describe("rejectionMarkOf", () => {
  test("hanya dokumen yang ditolak yang bertanda", () => {
    expect(
      rejectionMarkOf({ status: "DRAFT", approval: approval("PENDING") }),
    ).toBeNull();
    expect(rejectionMarkOf({ status: "DRAFT", approval: null })).toBeNull();
    expect(
      rejectionMarkOf({ status: "PAID", approval: approval("APPROVED") }),
    ).toBeNull();
  });

  test("membawa alasan singkat, dipotong bila panjang", () => {
    expect(
      rejectionMarkOf({ status: "DRAFT", approval: approval("REJECTED") }),
    ).toBe("Ditolak · Kas komisi belum cukup.");

    const long = {
      status: "DRAFT" as const,
      approval: {
        ...approval("REJECTED"),
        note: "Kas komisi belum cukup bulan ini, ajukan kembali awal bulan depan",
      },
    };

    expect(rejectionMarkOf(long)).toBe(
      "Ditolak · Kas komisi belum cukup bulan ini, ajukan…",
    );
  });

  test("tanpa catatan tetap bertanda", () => {
    expect(
      rejectionMarkOf({
        status: "DRAFT",
        approval: { ...approval("REJECTED"), note: null },
      }),
    ).toBe("Ditolak");
  });
});

describe("EXPENSE_STATE_VARIANT", () => {
  test("dibatalkan memakai neutral, bukan nada merah", () => {
    expect(EXPENSE_STATE_VARIANT.CANCELLED).toBe("neutral");
  });
});

describe("toExpenseQuery", () => {
  test("tab Menunggu menyaring lewat permintaan terbuka, bukan status baru", () => {
    const query = toExpenseQuery("PENDING_APPROVAL", {});

    expect(query.status).toBe("DRAFT");
    expect(query.apiFilters.isPendingApproval).toBe("1");
  });

  test("tab Draf hanya yang belum diajukan", () => {
    expect(toExpenseQuery("DRAFT", {}).apiFilters.isPendingApproval).toBe("0");
  });

  test("tab Dibayar tidak menyaring persetujuan", () => {
    const query = toExpenseQuery("PAID", {});

    expect(query.status).toBe("PAID");
    expect(query.apiFilters.isPendingApproval).toBe("");
  });

  test("bawaan bulan berjalan, dan Semua bulan membuang rentangnya", () => {
    const month = currentMonth();

    expect(toExpenseQuery("", {}).apiFilters.startDate).toBe(`${month}-01`);
    expect(toExpenseQuery("", { bulan: ALL_MONTHS }).apiFilters.startDate).toBe(
      "",
    );
  });
});

describe("toExpenseFormData", () => {
  test("lines dikirim sebagai JSON string, total tidak pernah dikirim", () => {
    const body = toExpenseFormData(values(), false);

    expect(JSON.parse(String(body.get("lines")))).toEqual([
      { accountId: 22, amount: 1850000, description: "Listrik" },
    ]);
    expect(body.get("totalAmount")).toBeNull();
    expect(body.get("total")).toBeNull();
  });

  test("programId tidak pernah dikirim: layar ini tidak punya Program", () => {
    expect(toExpenseFormData(values(), false).get("programId")).toBeNull();
  });

  test("nama dinormalkan dengan collapseSpaces", () => {
    const body = toExpenseFormData(values(), false);

    expect(body.get("payee")).toBe("PLN UP3 Medan");
    expect(body.get("description")).toBe("Tagihan listrik");
  });

  test("keepFiles hanya pada ubah, dan hanya nota yang dipertahankan", () => {
    const attachments = [
      attachment("keep-1", null),
      attachment("new-1", fileOf("a.jpg")),
    ];

    expect(
      toExpenseFormData(values({ attachments }), false).get("keepFiles"),
    ).toBeNull();
    expect(
      JSON.parse(
        String(
          toExpenseFormData(values({ attachments }), true).get("keepFiles"),
        ),
      ),
    ).toEqual([{ publicId: "keep-1" }]);
  });

  test("berkas baru dikirim di field image", () => {
    const attachments = [
      attachment("new-1", fileOf("a.jpg")),
      attachment("new-2", fileOf("b.jpg")),
    ];
    const body = toExpenseFormData(values({ attachments }), false);

    expect(body.getAll("image")).toHaveLength(2);
  });
});

describe("expenseFormSchema", () => {
  const pathsOf = (input: ExpenseFormValues) => {
    const parsed = expenseFormSchema.safeParse(input);

    return parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.path.join("."));
  };

  test("nilai lengkap lolos", () => {
    expect(pathsOf(values())).toEqual([]);
  });

  test("tanggal masa depan ditolak", () => {
    const future = todayJakarta().replace(/\d{4}/, "2999");

    expect(pathsOf(values({ expenseDate: future }))).toContain("expenseDate");
  });

  test("nominal nol dan pos kosong ditolak per baris", () => {
    const paths = pathsOf(
      values({ lines: [{ accountId: "", amount: "0", description: "" }] }),
    );

    expect(paths).toContain("lines.0.accountId");
    expect(paths).toContain("lines.0.amount");
  });

  test("nota lebih dari tiga ditolak", () => {
    const attachments = [1, 2, 3, 4].map((index) =>
      attachment(`n-${index}`, fileOf(`n${index}.jpg`)),
    );

    expect(pathsOf(values({ attachments }))).toContain("attachments");
  });

  test("baris kosong ditolak", () => {
    expect(pathsOf(values({ lines: [] }))).toContain("lines");
  });

  test("kolom komisi belum dijawab ditolak di kolomnya sendiri", () => {
    const paths = pathsOf(values({ bapelChoice: "", bapelId: "" }));

    expect(paths).toContain("bapelChoice");
    expect(paths).not.toContain("bapelId");
  });

  test("untuk komisi tanpa komisi terpilih ditolak di bapelId, bukan di form", () => {
    const paths = pathsOf(values({ bapelChoice: "KOMISI", bapelId: "" }));

    expect(paths).toEqual(["bapelId"]);
  });

  test("bukan belanja komisi lolos tanpa bapelId", () => {
    expect(
      pathsOf(values({ bapelChoice: "BUKAN_KOMISI", bapelId: "" })),
    ).toEqual([]);
  });
});

describe("kolom komisi", () => {
  test("form baru tidak memilih salah satu jawaban", () => {
    expect(emptyExpenseForm().bapelChoice).toBe("");
  });

  test("baris lama membuka form ubah dengan jawaban kosong, bukan bukan-komisi", () => {
    const legacy = toExpenseForm(
      expenseDetail({ bapelId: null, bapel: null, bapelChoice: null }),
    );

    expect(legacy.bapelChoice).toBe("");
    expect(legacy.bapelId).toBe("");
  });

  test("baris baru membuka form ubah dengan jawabannya terbaca", () => {
    const stated = toExpenseForm(
      expenseDetail({
        bapelId: null,
        bapel: null,
        bapelChoice: "BUKAN_KOMISI",
      }),
    );
    const komisi = toExpenseForm(
      expenseDetail({
        bapelId: 3,
        bapel: { code: "BPL-0003", name: "Komisi Pemuda" },
        bapelChoice: "KOMISI",
      }),
    );

    expect(stated.bapelChoice).toBe("BUKAN_KOMISI");
    expect(komisi.bapelChoice).toBe("KOMISI");
    expect(komisi.bapelId).toBe("3");
  });

  test("payload membawa jawaban DAN bapelId, tanpa representasi kedua", () => {
    const body = toExpenseFormData(
      values({ bapelChoice: "KOMISI", bapelId: "3" }),
      false,
    );

    expect(body.get("bapelChoice")).toBe("KOMISI");
    expect(body.get("bapelId")).toBe("3");
    expect([...body.keys()].filter((key) => /bapel/i.test(key))).toEqual([
      "bapelChoice",
      "bapelId",
    ]);
  });

  test("bukan belanja komisi mengirim jawabannya dan mengosongkan bapelId", () => {
    const body = toExpenseFormData(
      values({ bapelChoice: "BUKAN_KOMISI", bapelId: "" }),
      false,
    );

    expect(body.get("bapelChoice")).toBe("BUKAN_KOMISI");
    expect(body.get("bapelId")).toBeNull();
  });

  test("kontradiksi bukan galat ber-code: errorFixOf tidak menautkan apa pun", () => {
    const contradiction = new FetchError(
      400,
      "Bukan Belanja Komisi Tidak Boleh Membawa Komisi",
      [
        {
          path: "bapelId",
          message: "Bukan Belanja Komisi Tidak Boleh Membawa Komisi",
        },
      ],
    );

    expect(contradiction.code).toBeNull();
    expect(errorFixOf(contradiction)).toBeNull();
    expect((toFormError(contradiction) as FetchError).issues[0]!.path).toBe(
      "bapelId",
    );
  });
});

describe("errorFixOf", () => {
  test("bercabang pada code, menautkan layar yang memperbaikinya", () => {
    const fix = errorFixOf(
      new FetchError(400, "apa saja", [], "PERIOD_CLOSED"),
    );

    expect(fix?.href).toBe("/keuangan/periode-fiskal");
  });

  test("teks galat tanpa code tidak pernah ditebak", () => {
    expect(
      errorFixOf(new FetchError(400, "Periode Fiskal Sudah Ditutup")),
    ).toBeNull();
    expect(
      errorFixOf(new FetchError(400, "x", [], "SOMETHING_NEW")),
    ).toBeNull();
  });
});

describe("toFormError", () => {
  test("galat image dan keepFiles dipindahkan ke field attachments", () => {
    const mapped = toFormError(
      new FetchError(400, "Nota Maksimal 3", [
        { path: "image", message: "Nota Maksimal 3" },
      ]),
    ) as FetchError;

    expect(mapped.issues[0]!.path).toBe("attachments");
  });
});

describe("errorFixOf: gerbang anggaran", () => {
  test("BUDGET_REPORT_PENDING menautkan ke Laporan Budget, bukan ke Periode Fiskal", () => {
    const fix = errorFixOf(
      new FetchError(400, "apa saja", [], "BUDGET_REPORT_PENDING"),
    );

    expect(fix?.menu).toBe("LAPORAN_BUDGET");
    expect(fix?.href).toContain("/anggaran/laporan-budget");
  });

  test("kata laporan atau budget TANPA code tidak pernah memicu tautannya", () => {
    for (const message of [
      "Komisi Ini Belum Menyelesaikan Laporan Pemakaian Budget Bulan Agustus",
      "Laporan budget belum disetujui",
      "budget",
    ]) {
      expect(errorFixOf(new FetchError(400, message))).toBeNull();
    }
  });

  test("code tak dikenal dirender tanpa tautan", () => {
    expect(
      errorFixOf(new FetchError(400, "x", [], "BUDGET_REPORT_SOMETHING")),
    ).toBeNull();
  });

  test("periode dan gerbang menghasilkan dua perbaikan BERBEDA, tidak digabung", () => {
    const period = errorFixOf(new FetchError(400, "x", [], "PERIOD_CLOSED"));
    const gate = errorFixOf(
      new FetchError(400, "x", [], "BUDGET_REPORT_PENDING"),
    );

    expect(period?.href).not.toBe(gate?.href);
    expect(period?.menu).not.toBe(gate?.menu);
  });
});

describe("previousMonthOf", () => {
  test("Januari mundur ke Desember tahun sebelumnya", () => {
    expect(previousMonthOf("2027-01-05")).toEqual({ year: 2026, month: 12 });
  });

  test("bulan lain mundur satu di tahun yang sama", () => {
    expect(previousMonthOf("2026-09-29")).toEqual({ year: 2026, month: 8 });
    expect(previousMonthOf("2026-12-31")).toEqual({ year: 2026, month: 11 });
  });

  test("dihitung dari expenseDate, BUKAN dari hari ini", () => {
    const today = todayJakarta();

    expect(previousMonthOf("2026-03-15")).toEqual({ year: 2026, month: 2 });
    expect(previousMonthOf("2026-03-15").year).not.toBe(
      Number(today.slice(0, 4)) + 1,
    );
  });
});

describe("waiveSchema", () => {
  const pathsOf = (reason: string) => {
    const parsed = waiveSchema.safeParse({ reason });

    return parsed.success
      ? []
      : parsed.error.issues.map((i) => i.path.join("."));
  };

  test("alasan wajib: kosong dan spasi saja ditolak", () => {
    expect(pathsOf("")).toContain("reason");
    expect(pathsOf("   ")).toContain("reason");
  });

  test("250 karakter diterima, 251 ditolak", () => {
    expect(pathsOf("A".repeat(250))).toEqual([]);
    expect(pathsOf("A".repeat(251))).toContain("reason");
  });

  test("teksnya menyebut komisi DAN bulannya", () => {
    const text = waiveText("Komisi Pemuda", "Maret 2026");

    expect(text).toContain("Komisi Pemuda");
    expect(text).toContain("Maret 2026");
    expect(text).toContain("tersimpan");
  });
});
