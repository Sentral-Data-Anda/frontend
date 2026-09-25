import { describe, expect, test } from "bun:test";

import { buildPayables, dueLabel } from "./data";

const now = new Date("2026-09-22T03:00:00Z");

const invoice = (code: string, dueDate: string, total = "2100000") => ({
  code,
  dueDate: `${dueDate}T00:00:00.000Z`,
  totalIDR: total,
  paidAmountIDR: "100000",
  status: "AWAITING_PAYMENT" as const,
  supplier: { name: "CV Nada" },
});

const cashExpense = (code: string, date: string) => ({
  code,
  expenseDate: `${date}T00:00:00.000Z`,
  description: "Konsumsi",
  payee: "Katering",
  totalAmount: "4500000",
  bapel: { name: "Komisi Pemuda" },
});

describe("dueLabel", () => {
  test("lewat, hari ini, besok, lalu tanggal absolut", () => {
    expect(dueLabel("2026-09-21T00:00:00.000Z", "2026-09-22")).toEqual({
      tone: "due",
      label: "Lewat",
    });
    expect(dueLabel("2026-09-22T00:00:00.000Z", "2026-09-22").label).toBe(
      "Hari ini",
    );
    expect(dueLabel("2026-09-23T00:00:00.000Z", "2026-09-22").label).toBe(
      "Besok",
    );
    expect(dueLabel("2026-09-30T00:00:00.000Z", "2026-09-22").label).toBe(
      "30 Sep",
    );
  });
});

describe("buildPayables", () => {
  test("lewat jatuh tempo di atas, lalu yang paling lama menunggu", () => {
    const rows = buildPayables(
      {
        invoices: [
          invoice("INV-2", "2026-09-30"),
          invoice("INV-1", "2026-09-18"),
        ],
        cashExpenses: [cashExpense("KK-9", "2026-09-05")],
      },
      now,
    );

    expect(rows.map((row) => row.key)).toEqual([
      "inv-INV-1",
      "kk-KK-9",
      "inv-INV-2",
    ]);
    expect(rows[0].status.label).toBe("Lewat");
  });

  test("sisa tagihan faktur = total − yang sudah dibayar", () => {
    const [row] = buildPayables(
      { invoices: [invoice("INV-1", "2026-09-30")] },
      now,
    );

    expect(row.amount).toBe(2_000_000);
    expect(row.isPayable).toBe(true);
  });

  test("sumber tanpa izin tidak menghasilkan baris", () => {
    expect(buildPayables({}, now)).toEqual([]);
  });

  test("kolom jenis persetujuan memakai jenis dokumennya", () => {
    const [row] = buildPayables(
      {
        approvals: [
          {
            code: "PST-021",
            documentType: "CASH_EXPENSE",
            amount: "4500000",
            submittedAt: "2026-09-20T03:10:00.000Z",
            currentOrder: 1,
            steps: [{ order: 1, approverBapel: { name: "Komisi Pemuda" } }],
          },
        ],
      },
      now,
    );

    expect(row.kind).toBe("Kas keluar");
    expect(row.meta).toContain("Komisi Pemuda");
    expect(row.meta).toContain("2 hari");
    expect(row.isPayable).toBe(false);
  });

  test("baris persembahan belum diposting hanya saat fixture dinyalakan", () => {
    expect(buildPayables({ isUnpostedShown: false }, now)).toEqual([]);
    const [row] = buildPayables({ isUnpostedShown: true }, now);
    expect(row.isDummy).toBe(true);
    expect(row.kind).toBe("Jurnal");
  });
});
