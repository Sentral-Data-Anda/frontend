import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  EMPTY_ITEM,
  countGap,
  emptyPersembahanForm,
  fixLinkOf,
  giverOf,
  itemsSummary,
  itemsTotal,
  periodLabel,
  persembahanFormSchema,
  toBatchPayload,
  toItemFromType,
  toPersembahanApiFilters,
  totalsSubtitle,
  voidText,
} from "./model";
import type { OfferingTypeOption } from "./types";

const TODAY = "2026-09-30";

const typeOf = (
  extra: Partial<OfferingTypeOption> = {},
): OfferingTypeOption => ({
  id: 3,
  code: "TPS-0003",
  name: "Persembahan Bulanan",
  hasPeriod: false,
  requiresJemaat: false,
  isActive: true,
  ...extra,
});

const formOf = (
  items: ReturnType<typeof emptyPersembahanForm>["items"],
  extra: Partial<ReturnType<typeof emptyPersembahanForm>> = {},
) => ({ ...emptyPersembahanForm(TODAY), items, ...extra });

const itemOf = (extra: Partial<typeof EMPTY_ITEM> = {}) => ({
  ...EMPTY_ITEM,
  typePersembahanId: "1",
  typeName: "Kolekte",
  amount: "50000",
  ...extra,
});

describe("saringan daftar", () => {
  test("tanpa filter bulan: 30 hari terakhir, terbaru dulu", () => {
    expect(toPersembahanApiFilters({}, TODAY)).toEqual({
      startDate: "2026-09-01",
      endDate: TODAY,
      typePersembahanId: "",
      receiveMethod: "",
      isPosted: "",
    });
  });

  test("filter bulan menang atas bawaan 30 hari", () => {
    expect(toPersembahanApiFilters({ bulan: "2026-02" }, TODAY)).toMatchObject({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });

  test("tipe, cara terima, dan sudah-diposting diteruskan apa adanya", () => {
    expect(
      toPersembahanApiFilters(
        { tipe: "2", cara: "TRANSFER", posting: "0" },
        TODAY,
      ),
    ).toMatchObject({
      typePersembahanId: "2",
      receiveMethod: "TRANSFER",
      isPosted: "0",
    });
  });
});

describe("pemberi", () => {
  test("jemaat menang, lalu nama pemberi, lalu Anonim", () => {
    expect(giverOf({ jemaat: { name: "Andreas" }, donorName: "Budi" })).toBe(
      "Andreas",
    );
    expect(giverOf({ jemaat: null, donorName: "Budi" })).toBe("Budi");
    expect(giverOf({ jemaat: null, donorName: null })).toBe("Anonim");
  });
});

describe("tipe menentukan field baris", () => {
  test("tipe wajib jemaat membuang nama pemberi yang sudah diketik", () => {
    const next = toItemFromType(
      typeOf({ requiresJemaat: true }),
      itemOf({ donorName: "Budi" }),
    );

    expect(next.requiresJemaat).toBe(true);
    expect(next.donorName).toBe("");
  });

  test("tipe tanpa periode membuang periode yang sudah dipilih", () => {
    const next = toItemFromType(typeOf(), itemOf({ period: "2026-09" }));

    expect(next.hasPeriod).toBe(false);
    expect(next.period).toBe("");
  });

  test("tipe tanpa wajib jemaat membuang jemaat yang sudah dipilih", () => {
    const next = toItemFromType(
      typeOf(),
      itemOf({ jemaatId: "4", jemaatName: "Debora" }),
    );

    expect(next.jemaatId).toBe("");
    expect(next.jemaatName).toBe("");
  });
});

describe("validasi", () => {
  const issuesOf = (values: ReturnType<typeof emptyPersembahanForm>) => {
    const parsed = persembahanFormSchema.safeParse(values);

    return parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.path.join("."));
  };

  test("anonim tidak menagih nama pemberi", () => {
    expect(issuesOf(formOf([itemOf()]))).toEqual([]);
  });

  test("tipe wajib jemaat tanpa jemaat: galat di baris itu", () => {
    expect(
      issuesOf(formOf([itemOf(), itemOf({ requiresJemaat: true })])),
    ).toEqual(["items.1.jemaatId"]);
  });

  test("tipe berperiode tanpa periode: galat di baris itu", () => {
    expect(issuesOf(formOf([itemOf({ hasPeriod: true })]))).toEqual([
      "items.0.period",
    ]);
  });

  test("nominal nol ditolak, dan negatif tidak pernah diterima", () => {
    expect(issuesOf(formOf([itemOf({ amount: "0" })]))).toEqual([
      "items.0.amount",
    ]);
    expect(issuesOf(formOf([itemOf({ amount: "-5000" })]))).toEqual([
      "items.0.amount",
    ]);
  });

  test("tanggal terima di masa depan ditolak", () => {
    expect(
      issuesOf(formOf([itemOf()], { receivedDate: "2099-01-01" })),
    ).toEqual(["receivedDate"]);
  });

  test("lebih dari 100 baris ditolak", () => {
    const items = Array.from({ length: 101 }, () => itemOf());

    expect(issuesOf(formOf(items))).toEqual(["items"]);
  });

  test("hitung fisik yang berbeda tidak pernah memblokir simpan", () => {
    expect(issuesOf(formOf([itemOf()], { countCheck: "999999" }))).toEqual([]);
  });
});

describe("payload batch", () => {
  test("satu payload dengan items[]; hitung fisik tidak ikut terkirim", () => {
    const payload = toBatchPayload(
      formOf(
        [
          itemOf({ donorName: "  Budi   Santoso " }),
          itemOf({
            typePersembahanId: "3",
            hasPeriod: true,
            requiresJemaat: true,
            period: "2026-09",
            jemaatId: "4",
            amount: "125000.50",
          }),
        ],
        { countCheck: "1000000", ibadahId: "3", receivedBy: "7" },
      ),
    );

    expect(Object.keys(payload).sort()).toEqual([
      "ibadahId",
      "items",
      "receiveMethod",
      "receivedBy",
      "receivedDate",
    ]);
    expect(payload).toMatchObject({
      receivedDate: TODAY,
      receiveMethod: "TUNAI",
      ibadahId: 3,
      receivedBy: 7,
    });
    expect(payload.items).toEqual([
      {
        typePersembahanId: 1,
        jemaatId: null,
        period: null,
        donorName: "Budi Santoso",
        amount: 50000,
      },
      {
        typePersembahanId: 3,
        jemaatId: 4,
        period: "2026-09-01",
        donorName: null,
        amount: 125000.5,
      },
    ]);
  });

  test("ibadah dan diterima-oleh kosong dikirim null, bukan 0", () => {
    const payload = toBatchPayload(formOf([itemOf()]));

    expect(payload.ibadahId).toBeNull();
    expect(payload.receivedBy).toBeNull();
  });
});

describe("kaki dan hitung fisik", () => {
  test("total baris memakai aritmetika desimal eksak", () => {
    expect(
      itemsTotal([itemOf({ amount: "0.10" }), itemOf({ amount: "0.20" })]),
    ).toBe("0.30");
  });

  test("kaki menyebut jumlah baris dan totalnya", () => {
    expect(itemsSummary([itemOf(), itemOf()])).toBe(
      "2 baris · Total Rp 100.000",
    );
  });

  test("hitung fisik kosong atau sama: tanpa peringatan", () => {
    expect(countGap("", [itemOf()])).toBeNull();
    expect(countGap("50000", [itemOf()])).toBeNull();
  });

  test("hitung fisik berbeda: selisihnya, ke dua arah", () => {
    expect(countGap("60000", [itemOf()])).toBe(10000);
    expect(countGap("40000", [itemOf()])).toBe(-10000);
  });
});

describe("tautan perbaikan dan teks", () => {
  test("cabang pada code, bukan pada teks galat", () => {
    expect(
      fixLinkOf(new FetchError(400, "Apa saja", [], "PERIOD_CLOSED"))?.href,
    ).toBe("/keuangan/periode-fiskal");
    expect(
      fixLinkOf(
        new FetchError(400, "Periode Fiskal Juli 2026 Sudah Ditutup", [], null),
      ),
    ).toBeNull();
    expect(
      fixLinkOf(new FetchError(400, "x", [], "OFFERING_TYPE_NO_ACCOUNT"))?.href,
    ).toBe("/keuangan/tipe-persembahan");
  });

  test("subjudul menyebut jumlah dan total saringan aktif", () => {
    expect(totalsSubtitle(34, "37950000")).toBe(
      "34 persembahan · Total Rp 37.950.000",
    );
  });

  test("periode tampil sebagai bulan, bukan tanggal", () => {
    expect(periodLabel("2026-09-01T00:00:00.000Z")).toBe("September 2026");
    expect(periodLabel(null)).toBeNull();
  });

  test("teks batalkan menyebut pembalikan hanya bila sudah diposting", () => {
    expect(voidText(true)).toContain("dibalik");
    expect(voidText(false)).not.toContain("dibalik");
  });
});
