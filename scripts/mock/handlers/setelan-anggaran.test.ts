import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { resetAnggaranStores } from "../anggaran-reset";
import {
  BUDGET_ALLOCATION,
  BUDGET_SETTING,
  PROGRAM,
  budgetYearOf,
  currentBudgetYear,
  programItem,
  type ProgramRow,
} from "../anggaran-store";
import type { MockAction } from "../kit";

import { setelanAnggaranMock } from "./setelan-anggaran";

type BudgetYear = {
  year: number;
  startMonth: number;
  from: string;
  to: string;
  label: string;
};

type Json = {
  status: number;
  error?: string;
  code?: string;
  issues?: { path: string; message: string }[];
  data?: {
    startMonth: number | null;
    budgetYear: BudgetYear;
    budgetYears: BudgetYear[];
  };
};

afterEach(resetAnggaranStores);

const onCall = async (
  method: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const path = "/setelan-anggaran";
  const url = new URL(`/api/v1${path}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await setelanAnggaranMock({
    request,
    url,
    path,
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

// Kuncinya global: SATU program disetujui di mana pun menahan `startMonth`.
// Test yang menguji sisi "diterima" harus menyatakan prasyarat itu, bukan
// mewarisi larik kosong dari urutan muat berkas. `afterEach` yang
// mengembalikan benih membuat pembatalan di sini aman.
const unlock = () => {
  for (const row of PROGRAM) {
    if (row.status === "APPROVED") row.status = "CANCELLED";
  }
};

const approvedProgram = (year: number) => {
  const row: ProgramRow = {
    id: 9201,
    publicId: "prg-setelan",
    code: `PRG-${year}-0001`,
    name: "Retret",
    year,
    bapelId: 2,
    status: "APPROVED",
    isUnplanned: false,
    startDate: null,
    endDate: null,
    description: null,
    cancelReason: null,
    cancelledById: null,
    cancelledAt: null,
    approvedById: 12,
    approvedAt: null,
    deletedAt: null,
    items: [programItem(23, "Konsumsi", "1", "1000000")],
    approvals: [],
  };

  PROGRAM.push(row);

  return row;
};

describe("mock /setelan-anggaran", () => {
  test("GET tidak pernah 404 dan selalu membawa label tahun dari server", async () => {
    const read = await onCall("GET");

    expect(read?.status).toBe(200);
    expect(read?.body.data?.budgetYear.label.length).toBeGreaterThan(0);
    expect(read?.body.data?.budgetYear.year).toBe(currentBudgetYear());
  });

  test("jendela tahun pelayanan mengelilingi tahun berjalan, label ikut setelan", async () => {
    const read = await onCall("GET");
    const years = read?.body.data?.budgetYears ?? [];
    const current = currentBudgetYear();

    expect(years.map((year) => year.year)).toEqual([
      current - 1,
      current,
      current + 1,
      current + 2,
    ]);
    expect(
      years.every((year) => year.startMonth === BUDGET_SETTING.startMonth),
    ).toBe(true);
  });

  test("bulan mulai berpindah: rentang dan label ikut, tahun tersimpan tidak", async () => {
    unlock();

    // Bulan tujuannya dipilih relatif terhadap setelan yang sedang berjalan.
    // Memaku 7 membuat test ini menguji "tidak ada perubahan" ketika mock
    // dijalankan dengan MOCK_BUDGET_START_JULY, dan labelnya memang tidak
    // berubah karena ia sudah Juli sejak awal.
    const target = BUDGET_SETTING.startMonth === 7 ? 4 : 7;
    const before = await onCall("GET");
    const beforeYear = before?.body.data?.budgetYear;

    const saved = await onCall("PUT", { startMonth: target });
    const after = saved?.body.data?.budgetYear;

    expect(saved?.status).toBe(200);
    expect(saved?.body.data?.startMonth).toBe(target);
    expect(after?.from.slice(5, 7)).toBe(String(target).padStart(2, "0"));
    expect(after?.label).not.toBe(beforeYear?.label);
    expect(after?.year).toBe(budgetYearOf(after!.from));
  });

  test("bulan sebelum bulan mulai masih milik tahun sebelumnya", async () => {
    unlock();
    await onCall("PUT", { startMonth: 7 });

    const { from } = (await onCall("GET"))!.body.data!.budgetYear;
    const openMonth = Number(from.slice(5, 7));
    const year = Number(from.slice(0, 4));
    const before = `${openMonth === 1 ? year - 1 : year}-${String(
      openMonth === 1 ? 12 : openMonth - 1,
    ).padStart(2, "0")}-15`;

    expect(budgetYearOf(before)).toBe(budgetYearOf(from) - 1);
  });

  test("ada pagu tapi nol program disetujui: PUT diterima", async () => {
    unlock();
    BUDGET_ALLOCATION.push({
      id: 901,
      publicId: "pga-0901",
      bapelId: 2,
      year: currentBudgetYear(),
      amount: "1000000",
    });

    const saved = await onCall("PUT", { startMonth: 4 });

    expect(saved?.status).toBe(200);
    expect(saved?.body.data?.startMonth).toBe(4);
  });

  test("ada program disetujui: 400 BUDGET_YEAR_LOCKED ke field startMonth", async () => {
    const { startMonth } = BUDGET_SETTING;

    approvedProgram(currentBudgetYear());

    const rejected = await onCall("PUT", { startMonth: 7 });

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.code).toBe("BUDGET_YEAR_LOCKED");
    expect(rejected?.body.issues?.[0]?.path).toBe("startMonth");
    expect(BUDGET_SETTING.startMonth).toBe(startMonth);
  });

  test("program draf dan dibatalkan tidak mengunci", async () => {
    unlock();

    const row = approvedProgram(currentBudgetYear());

    row.status = "DRAFT";
    expect((await onCall("PUT", { startMonth: 7 }))?.status).toBe(200);

    row.status = "CANCELLED";
    expect((await onCall("PUT", { startMonth: 8 }))?.status).toBe(200);
  });

  test("bulan di luar 1-12 ditolak ke field startMonth", async () => {
    for (const startMonth of [0, 13, "juli", null]) {
      const rejected = await onCall("PUT", { startMonth });

      expect(rejected?.status).toBe(400);
      expect(rejected?.body.issues?.[0]?.path).toBe("startMonth");
    }
  });

  // Guard BACA any-of: memegang PROGRAM atau LAPORAN_BUDGET VIEW sudah cukup,
  // karena `budgetYears` adalah satu-satunya sumber pilihan tahun dan komisi
  // sengaja tidak memegang PAGU_ANGGARAN. Tulis tetap PAGU_ANGGARAN UPDATE.
  test("PUT tanpa UPDATE: 403; GET tanpa satu pun VIEW: 403", async () => {
    const readMenus: string[] = [
      MENU.PAGU_ANGGARAN,
      MENU.PROGRAM,
      MENU.LAPORAN_BUDGET,
    ];

    expect(
      (
        await onCall(
          "PUT",
          { startMonth: 7 },
          (slug: string, action: MockAction) =>
            !(slug === MENU.PAGU_ANGGARAN && action === "UPDATE"),
        )
      )?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "GET",
          undefined,
          (slug: string, action: MockAction) =>
            !(readMenus.includes(slug) && action === "VIEW"),
        )
      )?.status,
    ).toBe(403);
  });

  test("GET dengan LAPORAN_BUDGET VIEW saja tetap 200", async () => {
    const response = await onCall(
      "GET",
      undefined,
      (slug: string, action: MockAction) =>
        slug === MENU.LAPORAN_BUDGET && action === "VIEW",
    );

    expect(response?.status).toBe(200);
  });
});
