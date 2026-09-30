import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { todayJakarta } from "@/lib/date";

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
  toExpenseFormData,
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
