import { describe, expect, test } from "bun:test";

import type { MenuSlug } from "../../../src/config/menu";
import {
  BUDGET_ALLOCATION,
  PROGRAM,
  currentBudgetYear,
  programItem,
  type ProgramRow,
} from "../anggaran-store";
import {
  ACCOUNT,
  CASH_EXPENSE,
  CASH_RECEIPT,
  JOURNAL_ENTRY,
  TYPE_PERSEMBAHAN,
} from "../keuangan-store";
import type { MockAction, MockHandler } from "../kit";

import { akunMock } from "./akun";
import { jurnalMock } from "./jurnal";
import { kasKeluarMock } from "./kas-keluar";
import { kasMasukMock } from "./kas-masuk";
import { paguAnggaranMock } from "./pagu-anggaran";
import { PAYMENT, pembayaranMock } from "./pembayaran";
import { programMock } from "./program";
import { tipePersembahanMock } from "./tipe-persembahan";

// Mock yang menerima lebih banyak kunci daripada be-sada tidak bisa menangkap
// tautan yang salah kunci: ia lolos di sini lalu 404 di produksi. Sudah terjadi
// sekali — tiga layar menaut ke Jurnal lewat kode, dan mock menerimanya.
// Karena itu setiap sumber daya berkunci diuji dua arah: kunci yang benar
// ketemu, bentuk kunci yang lain **tidak**.

const onGet = async (handler: MockHandler, path: string) => {
  const url = new URL(`/api/v1${path}`, "http://mock.test");
  const response = await handler({
    request: new Request(url),
    url,
    path,
    method: "GET",
    can: (() => true) as unknown as (
      slug: MenuSlug,
      action: MockAction,
    ) => boolean,
    isAdmin: true,
    sessionCode: "test",
  });

  return response?.status ?? 0;
};

const live = <T extends { deletedAt?: string | null }>(rows: readonly T[]) =>
  rows.find((row) => row.deletedAt === null || row.deletedAt === undefined)!;

// Larik grup Anggaran dikosongkan oleh afterEach `anggaran-store.test.ts`,
// jadi barisnya dibuat di sini bila sudah tidak ada — bukan dibaca dari seed
// handler, yang urutan jalannya tidak bisa diandalkan.
const keyedProgram = (): ProgramRow => {
  const existing = PROGRAM.find((row) => row.deletedAt === null);
  if (existing) return existing;

  const id = PROGRAM.length + 1;
  const row: ProgramRow = {
    id,
    publicId: `prg-kunci-${id}`,
    code: `PRG-${currentBudgetYear()}-9${String(id).padStart(3, "0")}`,
    name: "Uji kunci rute",
    year: currentBudgetYear(),
    bapelId: 2,
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
  };

  PROGRAM.push(row);

  return row;
};

const CASES = [
  {
    name: "akun",
    handler: akunMock,
    base: "/account",
    right: () => live(ACCOUNT).code,
    wrong: () => live(ACCOUNT).publicId,
    keyed: "kode",
  },
  {
    name: "tipe persembahan",
    handler: tipePersembahanMock,
    base: "/type-persembahan",
    right: () => live(TYPE_PERSEMBAHAN).code,
    wrong: () => live(TYPE_PERSEMBAHAN).publicId,
    keyed: "kode",
  },
  {
    name: "jurnal",
    handler: jurnalMock,
    base: "/jurnal",
    right: () => JOURNAL_ENTRY[0]!.publicId,
    wrong: () => JOURNAL_ENTRY[0]!.code,
    keyed: "publicId",
  },
  {
    name: "kas masuk",
    handler: kasMasukMock,
    base: "/kas-masuk",
    right: () => live(CASH_RECEIPT).publicId,
    wrong: () => live(CASH_RECEIPT).code,
    keyed: "publicId",
  },
  {
    name: "kas keluar",
    handler: kasKeluarMock,
    base: "/kas-keluar",
    right: () => live(CASH_EXPENSE).publicId,
    wrong: () => live(CASH_EXPENSE).code,
    keyed: "publicId",
  },
  {
    name: "pagu anggaran",
    handler: paguAnggaranMock,
    base: "/pagu-anggaran",
    right: () => BUDGET_ALLOCATION[0]!.publicId,
    wrong: () => String(BUDGET_ALLOCATION[0]!.id),
    keyed: "publicId",
  },
  {
    name: "program",
    handler: programMock,
    base: "/program",
    right: () => keyedProgram().publicId,
    wrong: () => keyedProgram().code,
    keyed: "publicId",
  },
  {
    name: "pembayaran",
    handler: pembayaranMock,
    base: "/pembayaran",
    right: () => PAYMENT[0]!.publicId,
    wrong: () => PAYMENT[0]!.code,
    keyed: "publicId",
  },
] as const;

describe("mock menolak apa yang server tolak", () => {
  test.each(CASES.map((item) => [item.name, item] as const))(
    "%s: kunci yang benar ketemu",
    async (_, item) => {
      expect(await onGet(item.handler, `${item.base}/${item.right()}`)).toBe(
        200,
      );
    },
  );

  test.each(CASES.map((item) => [item.name, item] as const))(
    "%s: bentuk kunci lain ditolak, bukan diterima diam-diam",
    async (_, item) => {
      expect(await onGet(item.handler, `${item.base}/${item.wrong()}`)).toBe(
        404,
      );
    },
  );
});
