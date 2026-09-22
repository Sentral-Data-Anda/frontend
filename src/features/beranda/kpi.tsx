"use client";

import { KpiCell } from "@/components/common/kpi-strip";
import { formatRupiahCompact } from "@/lib/format";

import { DUMMY_CASH_SUMMARY } from "./dummy";

/**
 * Sel KPI keuangan. DUMMY sampai widget keuangan membaca
 * `/laporan-keuangan/*` — registry menandainya `isDummy`, jadi tidak pernah
 * dirender di production.
 */
export function KpiCashBalance() {
  return (
    <KpiCell
      label="Saldo kas"
      value={formatRupiahCompact(DUMMY_CASH_SUMMARY.balance)}
    />
  );
}

export function KpiIncome() {
  return (
    <KpiCell
      label="Masuk"
      value={formatRupiahCompact(DUMMY_CASH_SUMMARY.income)}
      hint="Bulan ini"
    />
  );
}

export function KpiExpense() {
  return (
    <KpiCell
      label="Keluar"
      value={formatRupiahCompact(DUMMY_CASH_SUMMARY.expense)}
      hint="Bulan ini"
    />
  );
}
