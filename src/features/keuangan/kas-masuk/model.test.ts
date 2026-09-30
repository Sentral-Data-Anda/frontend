import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  ACCOUNT_LINK,
  MONTH_ALL,
  PERIOD_LINK,
  SETTING_LINK,
  emptyReceiptForm,
  fixLinkOf,
  gatewayReceiptForm,
  isCancellable,
  isEditable,
  isReceivable,
  linesTotalOf,
  monthFilterOptions,
  receiptFormSchema,
  statusLabelOf,
  toReceiptApiFilters,
  toReceiptForm,
  toReceiptPayload,
  type ReceiptFormValues,
} from "./model";
import type { CashReceiptDetail } from "./types";

const TODAY = "2026-09-30";

const values = (next: Partial<ReceiptFormValues> = {}): ReceiptFormValues => ({
  ...emptyReceiptForm(),
  payer: "  Keluarga   Santoso ",
  intoAccountId: "2",
  method: "Tunai",
  reference: "BA-07/IX/2026",
  bapelId: "3",
  description: "  Sewa   gedung ",
  lines: [
    { accountId: "20", amount: "3500000", description: " Sewa aula " },
    { accountId: "7", amount: "15000.50", description: "" },
  ],
  ...next,
});

const detail = (next: Partial<CashReceiptDetail> = {}): CashReceiptDetail => ({
  id: 1,
  publicId: "bkm-0001",
  code: "BKM-2026-0001",
  receiptDate: "2026-09-29T00:00:00.000Z",
  description: "Sewa gedung",
  payer: "Keluarga Santoso",
  intoAccountId: 2,
  intoAccount: { id: 2, code: "1-100", name: "Kas" },
  bapel: { id: 3, code: "BPL-3", name: "Komisi Pemuda" },
  method: "Tunai",
  reference: "BA-07/IX/2026",
  totalAmount: "3515000.50",
  status: "DRAFT",
  lines: [
    {
      publicId: "bkml-1",
      accountId: 20,
      account: { code: "4-200", name: "Sewa Gedung" },
      amount: "3500000",
      description: "Sewa aula",
    },
    {
      publicId: "bkml-2",
      accountId: 7,
      account: { code: "1-400", name: "Selisih Kas" },
      amount: "15000.50",
      description: null,
    },
  ],
  journal: null,
  ...next,
});

describe("toReceiptPayload", () => {
  test("tidak pernah mengirim total maupun programId", () => {
    const payload = toReceiptPayload(values());

    expect(Object.keys(payload)).not.toContain("totalAmount");
    expect(Object.keys(payload)).not.toContain("programId");
    expect(JSON.stringify(payload)).not.toContain("programId");
  });

  test("merapikan nama dan mengosongkan teks opsional", () => {
    const payload = toReceiptPayload(
      values({ method: "  ", reference: "", bapelId: "" }),
    );

    expect(payload.payer).toBe("Keluarga Santoso");
    expect(payload.description).toBe("Sewa gedung");
    expect(payload.method).toBeNull();
    expect(payload.reference).toBeNull();
    expect(payload.bapelId).toBeNull();
    expect(payload.lines[0].description).toBe("Sewa aula");
    expect(payload.lines[1].description).toBeNull();
  });
});

describe("linesTotalOf", () => {
  test("menjumlah baris sebagai sen bulat", () => {
    expect(linesTotalOf(values().lines)).toBe("3515000.50");
  });

  test("baris kosong memberi nol", () => {
    expect(linesTotalOf(emptyReceiptForm().lines)).toBe("0");
  });
});

describe("receiptFormSchema", () => {
  test("galat baris memakai jalur lines.<i>.<field>", () => {
    const result = receiptFormSchema.safeParse(
      values({
        lines: [
          { accountId: "", amount: "0", description: "" },
          { accountId: "7", amount: "", description: "a".repeat(251) },
        ],
      }),
    );
    const paths = result.error?.issues.map((issue) => issue.path.join("."));

    expect(paths).toContain("lines.0.accountId");
    expect(paths).toContain("lines.0.amount");
    expect(paths).toContain("lines.1.amount");
    expect(paths).toContain("lines.1.description");
  });

  test("menolak tanggal di masa depan dan rincian kosong", () => {
    const result = receiptFormSchema.safeParse(
      values({ receiptDate: "2999-01-01", lines: [] }),
    );
    const paths = result.error?.issues.map((issue) => issue.path.join("."));

    expect(paths).toContain("receiptDate");
    expect(paths).toContain("lines");
  });

  test("menerima isian lengkap", () => {
    expect(receiptFormSchema.safeParse(values()).success).toBe(true);
  });
});

describe("gatewayReceiptForm", () => {
  test("mengisi dua baris dengan pos penampung di baris pertama", () => {
    const form = gatewayReceiptForm(6);

    expect(form.lines).toHaveLength(2);
    expect(form.lines[0].accountId).toBe("6");
    expect(form.lines[1].accountId).toBe("");
    expect(form.payer).toBe("Payment gateway");
  });

  test("tanpa setelan baris pertama dibiarkan kosong", () => {
    expect(gatewayReceiptForm(null).lines[0].accountId).toBe("");
  });
});

describe("toReceiptForm", () => {
  test("membawa badan pelayanan dan baris kembali ke isian", () => {
    const form = toReceiptForm(detail());

    expect(form.receiptDate).toBe("2026-09-29");
    expect(form.bapelId).toBe("3");
    expect(form.lines).toHaveLength(2);
    expect(form.lines[1].description).toBe("");
  });
});

describe("toReceiptApiFilters", () => {
  test("bawaan menyaring bulan berjalan", () => {
    expect(toReceiptApiFilters({}, TODAY)).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  test("semua bulan melepas rentangnya", () => {
    expect(toReceiptApiFilters({ bulan: MONTH_ALL }, TODAY)).toEqual({
      startDate: "",
      endDate: "",
    });
  });

  test("bulan pilihan dipakai apa adanya", () => {
    expect(toReceiptApiFilters({ bulan: "2026-07" }, TODAY).startDate).toBe(
      "2026-07-01",
    );
  });
});

describe("monthFilterOptions", () => {
  test("bulan berjalan hanya muncul sebagai Bulan ini", () => {
    const options = monthFilterOptions(TODAY);

    expect(options[0]).toEqual({ value: "", label: "Bulan ini" });
    expect(options[1]?.value).toBe(MONTH_ALL);
    expect(options.filter((option) => option.value === "2026-09")).toHaveLength(
      0,
    );
  });
});

describe("fixLinkOf", () => {
  test("mencabang pada code, bukan pada teks galat", () => {
    const closed = new FetchError(400, "apa pun", [], "PERIOD_CLOSED");
    const setting = new FetchError(400, "apa pun", [], "SETTING_EMPTY");
    const inactive = new FetchError(400, "apa pun", [], "ACCOUNT_INACTIVE");

    expect(fixLinkOf(closed)).toBe(PERIOD_LINK);
    expect(fixLinkOf(setting)).toBe(SETTING_LINK);
    expect(fixLinkOf(inactive)).toBe(ACCOUNT_LINK);
  });

  test("galat tanpa code yang dikenal tidak menautkan apa pun", () => {
    expect(
      fixLinkOf(new FetchError(400, "Periode Fiskal Sudah Ditutup")),
    ).toBeNull();
    expect(fixLinkOf(new Error("jaringan"))).toBeNull();
  });
});

describe("status", () => {
  test("hanya draf yang bisa diubah dan diterima", () => {
    expect(isEditable("DRAFT")).toBe(true);
    expect(isEditable("PAID")).toBe(false);
    expect(isReceivable("PAID")).toBe(false);
    expect(isCancellable("PAID")).toBe(true);
    expect(isCancellable("DRAFT")).toBe(false);
  });

  test("label memakai kata Diterima, bukan Dibayar", () => {
    expect(statusLabelOf("PAID")).toBe("Diterima");
    expect(statusLabelOf("DRAFT")).toBe("Draf");
  });
});
