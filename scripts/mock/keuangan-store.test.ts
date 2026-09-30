import { afterEach, describe, expect, test } from "bun:test";

import {
  ACCOUNT,
  CASH_EXPENSE,
  CASH_RECEIPT,
  FISCAL_PERIOD,
  PERSEMBAHAN,
  TYPE_PERSEMBAHAN,
  JOURNAL_ENTRY,
  TODAY,
  journalRefOfSource,
  postDocumentEntry,
  reverseDocumentEntry,
} from "./keuangan-store";

const SEED = JOURNAL_ENTRY.map((row) => ({ ...row, lines: [...row.lines] }));
const SEED_PERIOD = FISCAL_PERIOD.map((row) => ({ ...row }));

afterEach(() => {
  JOURNAL_ENTRY.splice(
    0,
    JOURNAL_ENTRY.length,
    ...SEED.map((row) => ({ ...row, lines: [...row.lines] })),
  );
  FISCAL_PERIOD.splice(
    0,
    FISCAL_PERIOD.length,
    ...SEED_PERIOD.map((row) => ({ ...row })),
  );
});

const entry = (
  overrides: Partial<Parameters<typeof postDocumentEntry>[0]> = {},
) =>
  postDocumentEntry({
    sourceType: "CASH_RECEIPT",
    sourceId: 901,
    entryDate: TODAY,
    description: "Sewa gedung",
    lines: [
      { accountId: 2, debit: "500000", credit: "" },
      { accountId: 20, debit: "", credit: "500000" },
    ],
    ...overrides,
  });

describe("postDocumentEntry", () => {
  test("menulis entri yang benar-benar ada di Jurnal", () => {
    const result = entry();

    expect("entry" in result).toBe(true);
    if (!("entry" in result)) return;

    expect(result.entry.status).toBe("POSTED");
    expect(result.entry.sourceType).toBe("CASH_RECEIPT");
    expect(JOURNAL_ENTRY.at(-1)?.code).toBe(result.entry.code);
    expect(journalRefOfSource("CASH_RECEIPT", 901)).toEqual({
      code: result.entry.code,
      status: "POSTED",
    });
  });

  test("kode dan id baris tidak bentrok dengan seed", () => {
    const result = entry();
    if (!("entry" in result)) throw new Error("gagal posting");

    const codes = JOURNAL_ENTRY.map((row) => row.code);
    const lineIds = JOURNAL_ENTRY.flatMap((row) => row.lines.map((l) => l.id));

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(lineIds).size).toBe(lineIds.length);
  });

  test("tidak seimbang ditolak", () => {
    const result = entry({
      lines: [
        { accountId: 2, debit: "500000", credit: "" },
        { accountId: 20, debit: "", credit: "400000" },
      ],
    });

    expect(result).toEqual({
      failure: {
        code: "NOT_BALANCED",
        message: "Debit Dan Kredit Tidak Seimbang",
      },
    });
    expect(JOURNAL_ENTRY.length).toBe(SEED.length);
  });

  test("dokumen yang sama tidak bisa diposting dua kali", () => {
    entry();
    const again = entry();

    expect("failure" in again && again.failure.code).toBe("ALREADY_POSTED");
  });

  test("bulan tertutup ditolak", () => {
    const period = FISCAL_PERIOD.find(
      (row) => row.month === Number(TODAY.slice(5, 7)),
    );
    if (period) period.status = "CLOSED";

    const closed = entry();

    expect("failure" in closed && closed.failure.code).toBe("PERIOD_CLOSED");
  });
});

describe("reverseDocumentEntry", () => {
  test("pembalikan mencerminkan baris dan melepas sumbernya", () => {
    const posted = entry();
    if (!("entry" in posted)) throw new Error("gagal posting");

    const result = reverseDocumentEntry("CASH_RECEIPT", 901, "Dibatalkan");

    expect(result && "entry" in result).toBe(true);
    if (!result || !("entry" in result)) return;

    expect(result.entry.sourceType).toBe("MANUAL");
    expect(result.entry.sourceId).toBeNull();
    expect(result.entry.reversalOfId).toBe(posted.entry.id);
    expect(result.entry.lines[0]?.credit).toBe("500000");
    expect(result.entry.lines[0]?.debit).toBe("0");
    expect(posted.entry.status).toBe("REVERSED");
  });

  test("membalik tidak membebaskan dokumen untuk diposting lagi", () => {
    entry();
    reverseDocumentEntry("CASH_RECEIPT", 901, "Dibatalkan");

    const again = entry();

    expect("failure" in again && again.failure.code).toBe("ALREADY_POSTED");
  });

  test("dokumen yang belum diposting tidak membalik apa pun", () => {
    expect(reverseDocumentEntry("CASH_RECEIPT", 999, "x")).toBeNull();
  });
});

// publicId yang kebetulan sama dengan kodenya membuat pencarian per kode
// menerima publicId tanpa ada yang berniat begitu — persis cara tiga layar
// menaut ke Jurnal lewat kunci yang salah dan lolos di mock.
describe("publicId tidak pernah sama dengan kode", () => {
  const rows: { publicId: string; code: string }[] = [
    ...ACCOUNT,
    ...TYPE_PERSEMBAHAN,
    ...JOURNAL_ENTRY,
    ...PERSEMBAHAN,
    ...CASH_RECEIPT,
    ...CASH_EXPENSE,
  ];

  test("tidak ada baris store yang kedua kuncinya bertabrakan", () => {
    const clashing = rows
      .filter((row) => row.publicId.toLowerCase() === row.code.toLowerCase())
      .map((row) => row.code);

    expect(clashing).toEqual([]);
  });
});
