import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { addDays, addMonths, startOfMonth } from "../../../src/lib/date";
import {
  BUDGET_USAGE_REPORT,
  GATE_WAIVER,
  PROGRAM,
  TODAY,
  previousMonth,
  type BudgetReportRow,
} from "../anggaran-store";
import { CASH_EXPENSE } from "../keuangan-store";
import type { MockAction } from "../kit";

import { laporanBudgetMock } from "./laporan-budget";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

// Larik dikembalikan ke isi awalnya, bukan dikosongkan: `BUDGET_USAGE_REPORT`
// dibaca berkas test milik agent lain, dan mengosongkannya membuat suite ini
// lulus karena urutan muat, bukan karena desain.
const SEED = BUDGET_USAGE_REPORT.map((row) => ({ ...row }));

const PROGRAM_SEED = PROGRAM.map((row) => ({ ...row }));

const WAIVER_SEED = GATE_WAIVER.map((row) => ({ ...row }));

afterEach(() => {
  BUDGET_USAGE_REPORT.splice(
    0,
    BUDGET_USAGE_REPORT.length,
    ...SEED.map((row) => ({ ...row })),
  );
  GATE_WAIVER.splice(
    0,
    GATE_WAIVER.length,
    ...WAIVER_SEED.map((row) => ({ ...row })),
  );
  PROGRAM.splice(0, PROGRAM.length, ...PROGRAM_SEED.map((row) => ({ ...row })));
});

const monthAt = (offset: number) => {
  const first = addMonths(startOfMonth(TODAY), offset);

  return {
    year: Number(first.slice(0, 4)),
    month: Number(first.slice(5, 7)),
    first,
  };
};

const M0 = monthAt(0);

const M1 = monthAt(-1);

const NEXT = monthAt(1);

const dayIn = (month: { first: string }, day: number) =>
  addDays(month.first, day - 1);

const onCall = async (
  method: string,
  input: string,
  body?: FormData,
  can: (slug: string, action: MockAction) => boolean = () => true,
  isAdmin = true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, { method });

  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body) request.formData = async () => body;
  const response = await laporanBudgetMock({
    request,
    url,
    path: input.split("?")[0] ?? "",
    method,
    can: can as never,
    isAdmin,
    sessionCode: "test",
  });

  return response
    ? { status: response.status, body: (await response.json()) as Json }
    : null;
};

const formOf = (
  fields: Record<string, string>,
  lines: unknown[],
  files: File[] = [],
) => {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  body.append("lines", JSON.stringify(lines));
  for (const file of files) body.append("receipt", file, file.name);

  return body;
};

const validLine = (next: Record<string, unknown> = {}) => ({
  accountId: 23,
  spentDate: dayIn(M1, 4),
  description: "Konsumsi rapat pengurus",
  amount: "250000",
  ...next,
});

// Komisi yang belum punya laporan di bulan lalu, supaya create tidak menabrak
// keunikan komisi-bulan milik seed.
const FREE_BAPEL = 3;

const freeMonth = () => {
  const taken = new Set(
    BUDGET_USAGE_REPORT.filter(
      (row) => row.bapelId === FREE_BAPEL && row.deletedAt === null,
    ).map((row) => `${row.year}-${row.month}`),
  );

  for (let offset = -1; offset > -12; offset -= 1) {
    const month = monthAt(offset);

    if (!taken.has(`${month.year}-${month.month}`)) return month;
  }

  throw new Error("tidak ada bulan bebas");
};

const createBody = (
  month = freeMonth(),
  lines: unknown[] = [validLine({ spentDate: dayIn(month, 4) })],
  fields: Record<string, string> = {},
) =>
  formOf(
    {
      bapelId: String(FREE_BAPEL),
      year: String(month.year),
      month: String(month.month),
      ...fields,
    },
    lines,
  );

const imageOf = (name: string) => new File(["x"], name, { type: "image/jpeg" });

// `PROGRAM` milik agent lain dan bisa kosong saat berkas ini jalan sendiri;
// barisnya dibuat di sini bila belum ada, lalu dikembalikan di afterEach.
const foreignProgram = () => {
  const existing = PROGRAM.find(
    (row) => row.deletedAt === null && row.bapelId !== FREE_BAPEL,
  );

  if (existing) return existing;

  const id = PROGRAM.length + 1;
  const row = {
    id,
    publicId: `prg-uji-${id}`,
    code: `PRG-${M0.year}-9${String(id).padStart(3, "0")}`,
    name: "Program komisi lain",
    year: M0.year,
    bapelId: FREE_BAPEL + 1,
    status: "DRAFT" as const,
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
    items: [],
    approvals: [],
  };

  PROGRAM.push(row);

  return row;
};

const liveRow = (): BudgetReportRow =>
  BUDGET_USAGE_REPORT.find(
    (row) => row.deletedAt === null && row.status === "DRAFT",
  )!;

describe("bacaan", () => {
  test("daftar kosong dijawab 404, seperti be-sada", async () => {
    BUDGET_USAGE_REPORT.splice(0, BUDGET_USAGE_REPORT.length);

    const response = await onCall("GET", "/laporan-budget");

    expect(response?.status).toBe(404);
  });

  test("detail membawa programId, bapelId, dan publicId tiap tahap", async () => {
    const row = BUDGET_USAGE_REPORT.find((item) => item.approvals.length > 0)!;
    const response = await onCall("GET", `/laporan-budget/${row.publicId}`);
    const data = response?.body.data as {
      bapelId: number;
      lines: { programId: number | null }[];
      approval: { steps: { publicId: string }[] } | null;
      disbursementTotal: string;
    };

    expect(data.bapelId).toBe(row.bapelId);
    expect(data.lines.length).toBe(row.lines.length);
    expect(data.approval?.steps.every((step) => step.publicId)).toBe(true);
    expect(typeof data.disbursementTotal).toBe("string");
  });

  test("belum lapor membawa id komisi dan label bulannya", async () => {
    const response = await onCall(
      "GET",
      `/laporan-budget/belum-lapor?year=${M1.year}&month=${M1.month}`,
    );
    const rows = response?.body.data as {
      bapelId: number;
      label: string;
      state: string;
    }[];

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.bapelId > 0)).toBe(true);
    expect(rows.every((row) => row.label.length > 0)).toBe(true);
  });

  test("prefill membaca Kas Keluar PAID komisi itu di bulan itu", async () => {
    const paid = CASH_EXPENSE.find(
      (row) =>
        row.status === "PAID" &&
        row.bapelId !== null &&
        row.expenseDate.slice(0, 7) === M1.first.slice(0, 7),
    )!;
    const response = await onCall(
      "GET",
      `/laporan-budget/prefill?bapelId=${paid.bapelId}&year=${M1.year}&month=${M1.month}`,
    );
    const data = response?.body.data as {
      lines: { cashExpense: { code: string } }[];
      total: string;
    };

    expect(data.lines.length).toBeGreaterThan(0);
    expect(data.lines[0]?.cashExpense.code).toBe(paid.code);
    expect(Number(data.total)).toBeGreaterThan(0);
  });
});

describe("mock menolak apa yang server tolak", () => {
  test("duplikat komisi-bulan dijawab 409 ke field bulan", async () => {
    const existing = BUDGET_USAGE_REPORT.find((row) => row.deletedAt === null)!;
    const body = formOf(
      {
        bapelId: String(existing.bapelId),
        year: String(existing.year),
        month: String(existing.month),
      },
      [
        validLine({
          spentDate: `${existing.year}-${String(existing.month).padStart(2, "0")}-04`,
        }),
      ],
    );
    const response = await onCall("POST", "/laporan-budget", body);

    expect(response?.status).toBe(409);
    expect(response?.body.issues?.[0]?.path).toBe("month");
  });

  test("baris kosong ditolak ke field lines", async () => {
    const response = await onCall(
      "POST",
      "/laporan-budget",
      createBody(freeMonth(), []),
    );

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0]?.path).toBe("lines");
  });

  test("lines JSON rusak ditolak ke field lines, bukan galat parser", async () => {
    const body = new FormData();
    const month = freeMonth();

    body.append("bapelId", String(FREE_BAPEL));
    body.append("year", String(month.year));
    body.append("month", String(month.month));
    body.append("lines", "{rusak");

    const response = await onCall("POST", "/laporan-budget", body);

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0]?.path).toBe("lines");
    expect(response?.body.error).not.toContain("JSON");
  });

  test("nominal nol, negatif, dan lebih dari dua desimal ditolak per baris", async () => {
    for (const amount of ["0", "-5", "1000.123"]) {
      const month = freeMonth();
      const response = await onCall(
        "POST",
        "/laporan-budget",
        createBody(month, [validLine({ amount, spentDate: dayIn(month, 4) })]),
      );

      expect(response?.status).toBe(400);
      expect(response?.body.issues?.[0]?.path).toBe("lines.0.amount");
    }
  });

  test("tanggal di luar bulan laporan ditolak, termasuk sehari sebelum dan sesudah", async () => {
    const month = freeMonth();
    const before = addDays(month.first, -1);
    const after = addMonths(month.first, 1);

    for (const spentDate of [before, after]) {
      const response = await onCall(
        "POST",
        "/laporan-budget",
        createBody(month, [validLine({ spentDate })]),
      );

      expect(response?.status).toBe(400);
      expect(response?.body.issues?.[0]?.path).toBe("lines.0.spentDate");
    }
  });

  test("tanggal 1 dan hari terakhir bulan laporan diterima", async () => {
    const month = freeMonth();
    const last = addDays(addMonths(month.first, 1), -1);
    const response = await onCall(
      "POST",
      "/laporan-budget",
      createBody(month, [
        validLine({ spentDate: month.first }),
        validLine({ spentDate: last > TODAY ? TODAY : last }),
      ]),
    );

    expect(response?.status).toBe(201);
  });

  test("bulan laporan berikutnya ditolak, bulan berjalan diterima", async () => {
    const future = await onCall(
      "POST",
      "/laporan-budget",
      createBody(NEXT, [validLine({ spentDate: dayIn(NEXT, 1) })]),
    );

    expect(future?.status).toBe(400);
    expect(future?.body.issues?.[0]?.path).toBe("month");

    const current = await onCall(
      "POST",
      "/laporan-budget",
      createBody(M0, [validLine({ spentDate: TODAY })]),
    );

    expect(current?.status).toBe(201);
  });

  test("akun tidak ada atau bukan beban/aset ditolak", async () => {
    const month = freeMonth();
    const missing = await onCall(
      "POST",
      "/laporan-budget",
      createBody(month, [
        validLine({ accountId: 9999, spentDate: dayIn(month, 4) }),
      ]),
    );

    expect(missing?.status).toBe(404);

    const income = await onCall(
      "POST",
      "/laporan-budget",
      createBody(month, [
        validLine({ accountId: 16, spentDate: dayIn(month, 4) }),
      ]),
    );

    expect(income?.status).toBe(400);
    expect(income?.body.issues?.[0]?.path).toBe("lines.0.accountId");
  });

  test("program komisi lain ditolak ke field programId dengan code", async () => {
    const program = foreignProgram();
    const month = freeMonth();
    const response = await onCall(
      "POST",
      "/laporan-budget",
      createBody(month, [
        validLine({ programId: program.id, spentDate: dayIn(month, 4) }),
      ]),
    );

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("PROGRAM_FOREIGN_BAPEL");
    expect(response?.body.issues?.[0]?.path).toBe("lines.0.programId");
  });

  test("kwitansi ke-21 ditolak sebelum satu pun diunggah", async () => {
    const month = freeMonth();
    const files = Array.from({ length: 21 }, (_, index) =>
      imageOf(`nota-${index}.jpg`),
    );
    const body = formOf(
      {
        bapelId: String(FREE_BAPEL),
        year: String(month.year),
        month: String(month.month),
      },
      [validLine({ spentDate: dayIn(month, 4) })],
      files,
    );
    const response = await onCall("POST", "/laporan-budget", body);

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0]?.path).toBe("receipt");
    expect(response?.body.error).toContain("20");
  });

  test("tipe berkas lain dijawab 415", async () => {
    const month = freeMonth();
    const body = formOf(
      {
        bapelId: String(FREE_BAPEL),
        year: String(month.year),
        month: String(month.month),
      },
      [validLine({ spentDate: dayIn(month, 4) })],
      [new File(["x"], "data.zip", { type: "application/zip" })],
    );
    const response = await onCall("POST", "/laporan-budget", body);

    expect(response?.status).toBe(415);
  });

  test("ubah dan hapus laporan yang sudah disetujui ditolak", async () => {
    const approved = BUDGET_USAGE_REPORT.find(
      (row) => row.deletedAt === null && row.status === "APPROVED",
    )!;
    const month = { ...approved, first: `${approved.year}-01-01` };
    const update = await onCall(
      "PUT",
      `/laporan-budget/${approved.publicId}`,
      createBody(month as never, [
        validLine({
          spentDate: `${approved.year}-${String(approved.month).padStart(2, "0")}-04`,
        }),
      ]),
    );

    expect(update?.status).toBe(400);
    expect(update?.body.code).toBe("ALREADY_APPROVED");

    const removed = await onCall(
      "DELETE",
      `/laporan-budget/${approved.publicId}`,
    );

    expect(removed?.status).toBe(400);
  });

  test("ubah saat ada permintaan terbuka ditolak dengan code", async () => {
    const pending = BUDGET_USAGE_REPORT.find((row) =>
      row.approvals.some((approval) => approval.status === "PENDING"),
    )!;
    const response = await onCall(
      "DELETE",
      `/laporan-budget/${pending.publicId}`,
    );

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("UNDER_APPROVAL");
  });

  test("kode LPB sebagai :id dijawab 404", async () => {
    const row = liveRow();
    const response = await onCall("GET", `/laporan-budget/${row.code}`);

    expect(response?.status).toBe(404);
  });
});

describe("pengajuan", () => {
  test("mengajukan membuat permintaan dengan tahapan jabatan", async () => {
    const row = BUDGET_USAGE_REPORT.find(
      (item) => item.deletedAt === null && item.approvals.length === 0,
    )!;
    const response = await onCall(
      "POST",
      `/laporan-budget/${row.publicId}/pengajuan`,
    );
    const data = response?.body.data as {
      approval: { steps: { approverRoleName: string }[] };
    };

    expect(response?.status).toBe(200);
    expect(data.approval.steps.length).toBeGreaterThan(0);
    expect(data.approval.steps[0]?.approverRoleName).toContain("Ketua");
  });

  test("tanpa alur persetujuan ditolak dengan code NO_WORKFLOW", async () => {
    process.env.MOCK_NO_WORKFLOW = "1";

    const row = BUDGET_USAGE_REPORT.find(
      (item) => item.deletedAt === null && item.approvals.length === 0,
    )!;
    const response = await onCall(
      "POST",
      `/laporan-budget/${row.publicId}/pengajuan`,
    );

    delete process.env.MOCK_NO_WORKFLOW;

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("NO_WORKFLOW");
  });

  test("tanpa pemegang jabatan ditolak dengan code NO_POSITION_HOLDER", async () => {
    process.env.MOCK_NO_PENGURUS = "1";

    const row = BUDGET_USAGE_REPORT.find(
      (item) => item.deletedAt === null && item.approvals.length === 0,
    )!;
    const response = await onCall(
      "POST",
      `/laporan-budget/${row.publicId}/pengajuan`,
    );

    delete process.env.MOCK_NO_PENGURUS;

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("NO_POSITION_HOLDER");
  });
});

describe("periode fiskal tidak pernah menyentuh laporan", () => {
  test("laporan untuk bulan yang bukunya sudah ditutup tetap bisa dibuat dan diajukan", async () => {
    const closed = monthAt(-2);
    const month = {
      ...closed,
      first: closed.first,
    };
    const created = await onCall(
      "POST",
      "/laporan-budget",
      formOf(
        {
          bapelId: "5",
          year: String(month.year),
          month: String(month.month),
        },
        [validLine({ spentDate: dayIn(month, 4) })],
      ),
    );

    expect(created?.status).toBe(201);

    const row = (created?.body.data as { publicId: string }).publicId;
    const submitted = await onCall("POST", `/laporan-budget/${row}/pengajuan`);

    expect(submitted?.status).toBe(200);
  });

  test("laporan bulan Januari dibaca dengan pasangan tahun-bulan kalendernya", async () => {
    const january = { year: Number(TODAY.slice(0, 4)), month: 1 };
    const previous = previousMonth(january.year, january.month);

    expect(previous).toEqual({ year: january.year - 1, month: 12 });

    const response = await onCall(
      "GET",
      `/laporan-budget?year=${january.year}&month=1`,
    );

    expect([200, 404]).toContain(response?.status ?? 0);
  });
});

describe("lingkup komisi", () => {
  // Tanpa `PAGU_ANGGARAN` VIEW dan tanpa jabatan komisi, lingkupnya himpunan
  // kosong — gagal tertutup, bukan terbuka.
  const asKomisi = (slug: string, action: MockAction) =>
    slug === MENU.LAPORAN_BUDGET || action !== "VIEW";

  const asPagu = () => true;

  test("tanpa kapabilitas lintas komisi dan tanpa jabatan, daftar kosong", async () => {
    const response = await onCall(
      "GET",
      "/laporan-budget?limit=50",
      undefined,
      asKomisi,
      false,
    );

    expect(response?.status).toBe(404);
  });

  test("pemegang PAGU_ANGGARAN VIEW melihat setiap komisi", async () => {
    const response = await onCall(
      "GET",
      "/laporan-budget?limit=50",
      undefined,
      asPagu,
      false,
    );
    const rows = (response?.body.data ?? []) as { bapel: { code: string } }[];

    expect(response?.status).toBe(200);
    expect(new Set(rows.map((row) => row.bapel.code)).size).toBeGreaterThan(1);
  });

  test("laporan komisi lain dijawab 404, bukan 403", async () => {
    const foreign = BUDGET_USAGE_REPORT.find(
      (row) => row.deletedAt === null && row.bapelId !== 2,
    )!;
    const response = await onCall(
      "GET",
      `/laporan-budget/${foreign.publicId}`,
      undefined,
      asKomisi,
      false,
    );

    expect(response?.status).toBe(404);
  });

  test("query bapelId tidak melebarkan lingkup", async () => {
    const foreign = BUDGET_USAGE_REPORT.find(
      (row) => row.deletedAt === null && row.bapelId !== 2,
    )!;
    const response = await onCall(
      "GET",
      `/laporan-budget?bapelId=${foreign.bapelId}`,
      undefined,
      asKomisi,
      false,
    );

    expect(response?.status).toBe(404);
  });

  test("membuat laporan untuk komisi lain dijawab 404 ke field komisi", async () => {
    const month = freeMonth();
    const response = await onCall(
      "POST",
      "/laporan-budget",
      createBody(month, [validLine({ spentDate: dayIn(month, 4) })]),
      asKomisi,
      false,
    );

    expect(response?.status).toBe(404);
    expect(response?.body.issues?.[0]?.path).toBe("bapelId");
  });

  test("prefill komisi lain menjawab kosong, bukan rinciannya", async () => {
    const response = await onCall(
      "GET",
      `/laporan-budget/prefill?bapelId=4&year=${M1.year}&month=${M1.month}`,
      undefined,
      asKomisi,
      false,
    );
    const data = response?.body.data as { lines: unknown[]; total: string };

    expect(data.lines).toHaveLength(0);
    expect(data.total).toBe("0");
  });
});
