import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";

import {
  countSummaryOf,
  differenceLabel,
  noteIssueRowsOf,
  opnameFormSchema,
  toOpnameApiFilters,
  toOpnamePayload,
  type CountLine,
  type OpnameFormValues,
} from "./model";

const line = (patch: Partial<CountLine> = {}): CountLine => ({
  stockItemId: "5",
  code: "BRP-0005",
  name: "Kertas HVS A4",
  unit: "Rim",
  systemQuantity: 12,
  physicalQuantity: "12",
  note: "",
  ...patch,
});

const values = (patch: Partial<OpnameFormValues> = {}): OpnameFormValues => ({
  opnameDate: todayJakarta(),
  roomId: "2",
  note: "",
  items: [line()],
  ...patch,
});

const issuesOf = (input: OpnameFormValues) => {
  const result = opnameFormSchema.safeParse(input);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("skema", () => {
  test("isian lengkap lolos", () => {
    expect(issuesOf(values())).toEqual({});
  });

  test("tanggal wajib dan tidak di masa depan", () => {
    expect(issuesOf(values({ opnameDate: "" })).opnameDate).toBe(
      "Isi tanggal opname",
    );
    expect(
      issuesOf(values({ opnameDate: addDays(todayJakarta(), 1) })).opnameDate,
    ).toBe("Tanggal opname tidak boleh di masa depan");
  });

  test("minimal satu baris", () => {
    expect(issuesOf(values({ items: [] })).items).toBe(
      "Tambahkan minimal satu barang yang dihitung",
    );
  });

  test("fisik wajib bilangan bulat ≥ 0", () => {
    for (const physicalQuantity of ["", "-1", "1.5", "a"]) {
      expect(
        issuesOf(values({ items: [line({ physicalQuantity })] }))[
          "items.0.physicalQuantity"
        ],
      ).toBe("Isi jumlah fisik");
    }
    expect(
      issuesOf(
        values({ items: [line({ physicalQuantity: "0", systemQuantity: 0 })] }),
      ),
    ).toEqual({});
  });

  test("baris selisih wajib bercatatan, baris sesuai tidak", () => {
    const issues = issuesOf(
      values({
        items: [line(), line({ stockItemId: "6", physicalQuantity: "11" })],
      }),
    );

    expect(issues["items.1.note"]).toBe("Tulis alasan selisih");
    expect(issues["items.0.note"]).toBeUndefined();
    expect(
      issuesOf(
        values({ items: [line({ physicalQuantity: "11", note: "Basah" })] }),
      ),
    ).toEqual({});
  });

  test("tanpa duplikat: baris kedua menunjuk baris pertama", () => {
    expect(
      issuesOf(values({ items: [line(), line(), line()] }))[
        "items.2.stockItemId"
      ],
    ).toBe("Barang sudah ada di baris 1");
  });
});

describe("selisih dan ringkasan", () => {
  test("label selisih", () => {
    expect(differenceLabel(2)).toBe("+2");
    expect(differenceLabel(-1)).toBe("−1");
    expect(differenceLabel(0)).toBe("Sesuai");
  });

  test("ringkasan menghitung selisih dan yang belum diisi", () => {
    expect(
      countSummaryOf([
        line(),
        line({ physicalQuantity: "10" }),
        line({ physicalQuantity: "" }),
      ]),
    ).toEqual({ total: 3, different: 1, unfilled: 1 });
  });
});

describe("payload", () => {
  test("seluruh gereja = roomId null, tanpa systemQuantity, catatan kosong = null", () => {
    const payload = toOpnamePayload(
      values({
        roomId: "",
        note: "  ",
        items: [line({ physicalQuantity: "11", note: " Basah " })],
      }),
    );

    expect(payload).toEqual({
      opnameDate: todayJakarta(),
      roomId: null,
      note: null,
      items: [{ stockItemId: 5, physicalQuantity: 11, note: "Basah" }],
    });
    expect(JSON.stringify(payload)).not.toContain("systemQuantity");
  });

  test("ruang terpilih jadi angka", () => {
    expect(toOpnamePayload(values()).roomId).toBe(2);
  });
});

test("filter → query be-sada", () => {
  expect(toOpnameApiFilters({ bulan: "2026-02", ruang: "2" })).toEqual({
    roomId: "2",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  });
  expect(toOpnameApiFilters({})).toEqual({
    roomId: "",
    startDate: "",
    endDate: "",
  });
});

test("baris galat catatan dari /selesai", () => {
  expect([
    ...noteIssueRowsOf([
      { path: "items.1.note" },
      { path: "items.3.note" },
      { path: "opnameDate" },
    ]),
  ]).toEqual([1, 3]);
});
