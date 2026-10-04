import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import {
  BUDGET_ALLOCATION,
  PROGRAM,
  budgetYearRange,
  currentBudgetYear,
  programItem,
  type BudgetAllocationRow,
  type ProgramRow,
} from "../anggaran-store";
import { CASH_EXPENSE } from "../keuangan-store";
import type { MockAction } from "../kit";

import { paguAnggaranMock } from "./pagu-anggaran";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

type Allocation = {
  publicId: string;
  year: number;
  amount: string;
  bapel: { name: string } | null;
  usage: {
    ceiling: string | null;
    committed: string;
    disbursed: string;
    reported: string;
    remaining: string | null;
    untagged: string;
  };
};

const SEED = BUDGET_ALLOCATION.map((row) => ({ ...row }));

const YEAR = currentBudgetYear();

afterEach(() => {
  BUDGET_ALLOCATION.splice(
    0,
    BUDGET_ALLOCATION.length,
    ...SEED.map((row) => ({ ...row })),
  );
  PROGRAM.splice(0, PROGRAM.length);
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await paguAnggaranMock({
    request,
    url,
    path: input.split("?")[0] ?? "",
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const rowsOf = (body?: Json) => (body?.data ?? []) as Allocation[];

const detailOf = (body?: Json) => body?.data as Allocation;

const anyOf = (year: number): BudgetAllocationRow =>
  BUDGET_ALLOCATION.find((row) => row.year === year)!;

const program = (bapelId: number, year: number, extra: Partial<ProgramRow>) => {
  const row = {
    id: PROGRAM.length + 1,
    publicId: `prg-${PROGRAM.length + 1}`,
    code: `PRG-${year}-000${PROGRAM.length + 1}`,
    name: "Retret",
    year,
    bapelId,
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
    items: [programItem(23, "Konsumsi", "1", "1000000")],
    approvals: [],
    ...extra,
  } satisfies ProgramRow;

  PROGRAM.push(row);

  return row;
};

describe("mock /pagu-anggaran baca", () => {
  test("daftar tahun berjalan: satu baris per komisi, urut nama", async () => {
    const list = await onCall("GET", `/pagu-anggaran?year=${YEAR}`);
    const names = rowsOf(list?.body).map((row) => row.bapel?.name);

    expect(list?.status).toBe(200);
    expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)));
    expect(rowsOf(list?.body).every((row) => row.year === YEAR)).toBe(true);
  });

  test("tahun tanpa baris menjawab 404, bukan 200 kosong", async () => {
    const list = await onCall("GET", `/pagu-anggaran?year=${YEAR + 5}`);

    expect(list?.status).toBe(404);
    expect(list?.body.error).toBe("Pagu Anggaran Tidak Ditemukan");
  });

  test("saring komisi dan cari nama", async () => {
    const row = anyOf(YEAR);
    const byBapel = await onCall(
      "GET",
      `/pagu-anggaran?year=${YEAR}&bapelId=${row.bapelId}`,
    );

    expect(rowsOf(byBapel?.body)).toHaveLength(1);

    const name = rowsOf(byBapel?.body)[0]?.bapel?.name ?? "";
    const bySearch = await onCall(
      "GET",
      `/pagu-anggaran?year=${YEAR}&filter=${encodeURIComponent(name.slice(0, 5))}`,
    );

    expect(
      rowsOf(bySearch?.body).some((item) => item.bapel?.name === name),
    ).toBe(true);
  });

  test("kunci rute publicId; id angka ditolak 404", async () => {
    const row = anyOf(YEAR);

    expect(
      (await onCall("GET", `/pagu-anggaran/${row.publicId}`))?.status,
    ).toBe(200);
    expect((await onCall("GET", `/pagu-anggaran/${row.id}`))?.status).toBe(404);
  });

  test("usage memakai rentang tahun pelayanan, dan untagged selalu ada", async () => {
    const paid = CASH_EXPENSE.find(
      (row) => row.status === "PAID" && row.bapelId !== null,
    )!;
    const { from, to } = budgetYearRange(YEAR);

    expect(paid.expenseDate >= from && paid.expenseDate <= to).toBe(true);

    const row = BUDGET_ALLOCATION.find(
      (item) => item.bapelId === paid.bapelId && item.year === YEAR,
    )!;
    const detail = await onCall("GET", `/pagu-anggaran/${row.publicId}`);

    expect(Number(detailOf(detail?.body).usage.disbursed)).toBeGreaterThan(0);
    expect(detailOf(detail?.body).usage.untagged).toBeDefined();
  });

  test("tanpa VIEW: 403", async () => {
    const denied = await onCall(
      "GET",
      "/pagu-anggaran",
      undefined,
      (slug, action) => !(slug === MENU.PAGU_ANGGARAN && action === "VIEW"),
    );

    expect(denied?.status).toBe(403);
  });
});

describe("mock /pagu-anggaran tulis", () => {
  const payload = { bapelId: 2, year: YEAR + 4, amount: "9000000" };

  test("tambah 201 dan baris baru muncul", async () => {
    const saved = await onCall("POST", "/pagu-anggaran", payload);

    expect(saved?.status).toBe(201);
    expect(saved?.body.message).toBe("Berhasil Menambahkan Pagu Anggaran");
    expect(detailOf(saved?.body).amount).toBe("9000000");
  });

  test("pasangan komisi dan tahun yang sudah ada: 409 ke field year", async () => {
    const row = anyOf(YEAR);
    const clash = await onCall("POST", "/pagu-anggaran", {
      bapelId: row.bapelId,
      year: row.year,
      amount: "1000",
    });

    expect(clash?.status).toBe(409);
    expect(clash?.body.issues?.[0]?.path).toBe("year");
  });

  test("PUT ke pasangan milik baris lain: 409; ke pasangannya sendiri: 200", async () => {
    const first = anyOf(YEAR);
    const other = BUDGET_ALLOCATION.find(
      (row) => row.year === YEAR && row.bapelId !== first.bapelId,
    )!;

    const clash = await onCall("PUT", `/pagu-anggaran/${first.publicId}`, {
      bapelId: other.bapelId,
      year: other.year,
      amount: "1000",
    });

    expect(clash?.status).toBe(409);

    const same = await onCall("PUT", `/pagu-anggaran/${first.publicId}`, {
      bapelId: first.bapelId,
      year: first.year,
      amount: "7000000",
    });

    expect(same?.status).toBe(200);
    expect(detailOf(same?.body).amount).toBe("7000000");
  });

  test("nominal nol, negatif, tiga desimal, dan di atas batas ditolak", async () => {
    for (const amount of ["0", "-1", "100.555", "10000000000000"]) {
      const rejected = await onCall("POST", "/pagu-anggaran", {
        ...payload,
        amount,
      });

      expect(rejected?.status).toBe(400);
      expect(rejected?.body.issues?.[0]?.path).toBe("amount");
    }
  });

  test("nominal tepat di batas diterima", async () => {
    const saved = await onCall("POST", "/pagu-anggaran", {
      ...payload,
      amount: "9999999999999",
    });

    expect(saved?.status).toBe(201);
  });

  test("tahun di luar 2000-2100 ditolak", async () => {
    for (const year of [1999, 2101]) {
      const rejected = await onCall("POST", "/pagu-anggaran", {
        ...payload,
        year,
      });

      expect(rejected?.status).toBe(400);
      expect(rejected?.body.issues?.[0]?.path).toBe("year");
    }
  });

  test("komisi tidak ada: 404 Komisi Tidak Ditemukan", async () => {
    const rejected = await onCall("POST", "/pagu-anggaran", {
      ...payload,
      bapelId: 999,
    });

    expect(rejected?.status).toBe(404);
    expect(rejected?.body.error).toBe("Komisi Tidak Ditemukan");
  });

  test("hapus pagu yang dipakai program: 400 CEILING_IN_USE", async () => {
    const row = anyOf(YEAR);
    program(row.bapelId, row.year, {});

    const rejected = await onCall("DELETE", `/pagu-anggaran/${row.publicId}`);

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.code).toBe("CEILING_IN_USE");
    expect(BUDGET_ALLOCATION).toContain(row);
  });

  test("hapus diterima ketika semua programnya dibatalkan", async () => {
    const row = anyOf(YEAR);
    program(row.bapelId, row.year, { status: "CANCELLED" });

    const deleted = await onCall("DELETE", `/pagu-anggaran/${row.publicId}`);

    expect(deleted?.status).toBe(200);
    expect(BUDGET_ALLOCATION).not.toContain(row);
  });

  test("hapus tanpa program: 200", async () => {
    const row = anyOf(YEAR);

    expect(
      (await onCall("DELETE", `/pagu-anggaran/${row.publicId}`))?.status,
    ).toBe(200);
  });

  test("tulis tanpa izin aksinya: 403", async () => {
    const only = (allowed: MockAction) => (slug: string, action: MockAction) =>
      slug !== MENU.PAGU_ANGGARAN || action === allowed;
    const row = anyOf(YEAR);

    expect(
      (await onCall("POST", "/pagu-anggaran", payload, only("VIEW")))?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "PUT",
          `/pagu-anggaran/${row.publicId}`,
          payload,
          only("VIEW"),
        )
      )?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "DELETE",
          `/pagu-anggaran/${row.publicId}`,
          undefined,
          only("VIEW"),
        )
      )?.status,
    ).toBe(403);
  });
});

describe("mock /pagu-anggaran/batch", () => {
  const year = YEAR + 6;

  test("satu transaksi: semua baris tersimpan", async () => {
    const saved = await onCall("POST", "/pagu-anggaran/batch", {
      year,
      items: [
        { bapelId: 2, amount: "1000000" },
        { bapelId: 3, amount: "2000000" },
      ],
    });

    expect(saved?.status).toBe(201);
    expect(BUDGET_ALLOCATION.filter((row) => row.year === year)).toHaveLength(
      2,
    );
  });

  test("satu baris cacat: galat ke items.<i>, nol baris tertulis", async () => {
    const before = BUDGET_ALLOCATION.length;
    const rejected = await onCall("POST", "/pagu-anggaran/batch", {
      year,
      items: [
        { bapelId: 2, amount: "1000000" },
        { bapelId: 3, amount: "0" },
      ],
    });

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("items.1.amount");
    expect(BUDGET_ALLOCATION).toHaveLength(before);
  });

  test("komisi duplikat dalam satu kiriman: galat ke items.<i>.bapelId", async () => {
    const rejected = await onCall("POST", "/pagu-anggaran/batch", {
      year,
      items: [
        { bapelId: 2, amount: "1000000" },
        { bapelId: 2, amount: "2000000" },
      ],
    });

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("items.1.bapelId");
  });

  test("komisi yang sudah punya pagu tahun itu: 409 ke barisnya", async () => {
    const row = anyOf(YEAR);
    const rejected = await onCall("POST", "/pagu-anggaran/batch", {
      year: YEAR,
      items: [{ bapelId: row.bapelId, amount: "1000000" }],
    });

    expect(rejected?.status).toBe(409);
    expect(rejected?.body.issues?.[0]?.path).toBe("items.0.bapelId");
  });

  test("lebih dari 50 baris ditolak", async () => {
    const rejected = await onCall("POST", "/pagu-anggaran/batch", {
      year,
      items: Array.from({ length: 51 }, () => ({
        bapelId: 2,
        amount: "1000",
      })),
    });

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.some((issue) => issue.path === "items")).toBe(
      true,
    );
  });
});
